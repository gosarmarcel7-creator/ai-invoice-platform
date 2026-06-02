import math
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import or_, func
from sqlalchemy.orm import Session

import models
import schemas
import database
from ai_agent import extract_invoice_data

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="DocuExtract AI API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _extract_text(content: bytes, filename: str) -> str:
    if filename.lower().endswith(".pdf") and HAS_PDFPLUMBER:
        import io
        try:
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                return "\n".join(p.extract_text() or "" for p in pdf.pages)
        except Exception:
            pass
    return content.decode("utf-8", errors="ignore")


def _process_in_background(invoice_id: int, text: str) -> None:
    """Creates its own DB session — safe to run as a background task."""
    db = database.SessionLocal()
    try:
        extracted = extract_invoice_data(text)
        inv = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
        if inv:
            inv.vendor_name = extracted.get("vendor_name")
            inv.invoice_number = extracted.get("invoice_number")
            inv.total_amount = extracted.get("total_amount")
            inv.date = extracted.get("date")
            inv.due_date = extracted.get("due_date")
            inv.confidence_score = extracted.get("confidence_score")
            inv.status = "review"
            for item in extracted.get("line_items", []):
                db.add(models.LineItem(
                    invoice_id=invoice_id,
                    description=item.get("description"),
                    quantity=item.get("quantity"),
                    unit_price=item.get("unit_price"),
                    total_price=item.get("total_price"),
                ))
            db.commit()
    except Exception as e:
        print(f"Background task error for invoice {invoice_id}: {e}")
        db.rollback()
    finally:
        db.close()


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "version": "2.0.0"}


# ── Invoices ──────────────────────────────────────────────────────────────────

@app.post("/api/invoices/", response_model=schemas.InvoiceListItem)
async def upload_invoice(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
):
    content = await file.read()
    text = _extract_text(content, file.filename or "upload")

    inv = models.Invoice(filename=file.filename, raw_text=text)
    db.add(inv)
    db.commit()
    db.refresh(inv)

    background_tasks.add_task(_process_in_background, inv.id, text)
    return inv


@app.get("/api/invoices/", response_model=schemas.PaginatedInvoices)
def list_invoices(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(database.get_db),
):
    q = db.query(models.Invoice)
    if status and status != "all":
        q = q.filter(models.Invoice.status == status)
    if search:
        term = f"%{search}%"
        q = q.filter(or_(
            models.Invoice.filename.ilike(term),
            models.Invoice.vendor_name.ilike(term),
            models.Invoice.invoice_number.ilike(term),
        ))
    total = q.count()
    items = (
        q.order_by(models.Invoice.uploaded_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": max(1, math.ceil(total / limit)),
    }


@app.get("/api/invoices/{invoice_id}", response_model=schemas.Invoice)
def get_invoice(invoice_id: int, db: Session = Depends(database.get_db)):
    inv = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return inv


@app.put("/api/invoices/{invoice_id}", response_model=schemas.Invoice)
def update_invoice(
    invoice_id: int,
    update: schemas.InvoiceUpdate,
    db: Session = Depends(database.get_db),
):
    inv = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    for field in ("vendor_name", "invoice_number", "total_amount", "date", "due_date", "status", "notes"):
        val = getattr(update, field, None)
        if val is not None:
            setattr(inv, field, val)

    if update.line_items is not None:
        db.query(models.LineItem).filter(models.LineItem.invoice_id == invoice_id).delete()
        for item in update.line_items:
            db.add(models.LineItem(
                invoice_id=invoice_id,
                description=item.description,
                quantity=item.quantity,
                unit_price=item.unit_price,
                total_price=item.total_price,
            ))

    db.commit()
    db.refresh(inv)
    return inv


@app.delete("/api/invoices/{invoice_id}", status_code=204)
def delete_invoice(invoice_id: int, db: Session = Depends(database.get_db)):
    inv = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    db.delete(inv)
    db.commit()


# ── Analytics ─────────────────────────────────────────────────────────────────

@app.get("/api/analytics")
def get_analytics(db: Session = Depends(database.get_db)):
    total = db.query(models.Invoice).count()
    by_status = dict(
        db.query(models.Invoice.status, func.count(models.Invoice.id))
        .group_by(models.Invoice.status)
        .all()
    )
    total_value = db.query(func.sum(models.Invoice.total_amount)).scalar() or 0
    avg_conf = db.query(func.avg(models.Invoice.confidence_score)).scalar() or 0

    return {
        "total_documents": total,
        "processing": by_status.get("processing", 0),
        "awaiting_review": by_status.get("review", 0),
        "approved": by_status.get("approved", 0),
        "rejected": by_status.get("rejected", 0),
        "total_value": round(float(total_value), 2),
        "avg_confidence": round(float(avg_conf) * 100, 1) if avg_conf else 0,
    }
