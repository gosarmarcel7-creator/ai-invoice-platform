import math
import os
from datetime import datetime, timedelta, date
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, BackgroundTasks, Query, Request
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

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="DocuExtract AI API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://docuextract.xyz",
        "https://www.docuextract.xyz",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Auth ──────────────────────────────────────────────────────────────────────

def get_current_user_id(request: Request) -> Optional[str]:
    """Returns Supabase user UUID from Bearer token. Returns None if JWT secret not configured."""
    if not SUPABASE_JWT_SECRET:
        return None
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth[7:]
    try:
        import jwt
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def require_user(request: Request) -> str:
    """Like get_current_user_id but raises 401 if not authenticated."""
    user_id = get_current_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user_id


# ── Utilities ─────────────────────────────────────────────────────────────────

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
    db = database.SessionLocal()
    try:
        inv = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
        if not inv:
            return
        if not text.strip():
            inv.status = "failed"
            inv.notes = "No readable text could be extracted from the uploaded file."
            db.commit()
            return

        extracted = extract_invoice_data(text)
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
        inv = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
        if inv:
            inv.status = "failed"
            inv.notes = str(e)
            db.commit()
    finally:
        db.close()


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "version": "3.0.0"}


# ── Invoices ──────────────────────────────────────────────────────────────────

@app.post("/api/invoices/", response_model=schemas.InvoiceListItem)
async def upload_invoice(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
):
    user_id = get_current_user_id(request)
    content = await file.read()
    text = _extract_text(content, file.filename or "upload")
    inv = models.Invoice(filename=file.filename, raw_text=text, user_id=user_id)
    db.add(inv)
    db.commit()
    db.refresh(inv)
    background_tasks.add_task(_process_in_background, inv.id, text)
    return inv


@app.get("/api/invoices/", response_model=schemas.PaginatedInvoices)
def list_invoices(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(database.get_db),
):
    user_id = get_current_user_id(request)
    q = db.query(models.Invoice)
    if user_id:
        q = q.filter(models.Invoice.user_id == user_id)
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
    return {"items": items, "total": total, "page": page, "limit": limit,
            "pages": max(1, math.ceil(total / limit))}


@app.get("/api/invoices/{invoice_id}", response_model=schemas.Invoice)
def get_invoice(
    request: Request,
    invoice_id: int,
    db: Session = Depends(database.get_db),
):
    user_id = get_current_user_id(request)
    q = db.query(models.Invoice).filter(models.Invoice.id == invoice_id)
    if user_id:
        q = q.filter(models.Invoice.user_id == user_id)
    inv = q.first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return inv


@app.put("/api/invoices/{invoice_id}", response_model=schemas.Invoice)
def update_invoice(
    request: Request,
    invoice_id: int,
    update: schemas.InvoiceUpdate,
    db: Session = Depends(database.get_db),
):
    user_id = get_current_user_id(request)
    q = db.query(models.Invoice).filter(models.Invoice.id == invoice_id)
    if user_id:
        q = q.filter(models.Invoice.user_id == user_id)
    inv = q.first()
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
def delete_invoice(
    request: Request,
    invoice_id: int,
    db: Session = Depends(database.get_db),
):
    user_id = get_current_user_id(request)
    q = db.query(models.Invoice).filter(models.Invoice.id == invoice_id)
    if user_id:
        q = q.filter(models.Invoice.user_id == user_id)
    inv = q.first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    db.delete(inv)
    db.commit()


# ── Analytics ─────────────────────────────────────────────────────────────────

@app.get("/api/analytics")
def get_analytics(
    request: Request,
    db: Session = Depends(database.get_db),
):
    user_id = get_current_user_id(request)
    q = db.query(models.Invoice)
    if user_id:
        q = q.filter(models.Invoice.user_id == user_id)

    total = q.count()
    by_status = dict(
        q.with_entities(models.Invoice.status, func.count(models.Invoice.id))
        .group_by(models.Invoice.status).all()
    )
    total_value = q.with_entities(func.sum(models.Invoice.total_amount)).scalar() or 0
    avg_conf = q.with_entities(func.avg(models.Invoice.confidence_score)).scalar() or 0

    return {
        "total_documents": total,
        "processing": by_status.get("processing", 0),
        "awaiting_review": by_status.get("review", 0),
        "approved": by_status.get("approved", 0),
        "rejected": by_status.get("rejected", 0),
        "total_value": round(float(total_value), 2),
        "avg_confidence": round(float(avg_conf) * 100, 1) if avg_conf else 0,
    }


@app.get("/api/analytics/timeseries")
def get_timeseries(
    request: Request,
    db: Session = Depends(database.get_db),
):
    user_id = get_current_user_id(request)
    today = date.today()
    year_start = datetime(today.year, 1, 1)

    q = db.query(models.Invoice.uploaded_at, models.Invoice.status, models.Invoice.total_amount).filter(
        models.Invoice.uploaded_at >= year_start
    )
    if user_id:
        q = q.filter(models.Invoice.user_id == user_id)
    invoices = q.all()

    weekly_map: dict = {}
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        weekly_map[d.isoformat()] = {"day": d.strftime("%a"), "date": d.isoformat(),
                                      "total": 0, "approved": 0, "rejected": 0}

    month_names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    monthly_map: dict = {}
    for m in range(1, today.month + 1):
        monthly_map[m] = {"month": month_names[m - 1], "total": 0, "value": 0.0}

    for inv in invoices:
        if inv.uploaded_at is None:
            continue
        inv_date = inv.uploaded_at.date() if hasattr(inv.uploaded_at, "date") else inv.uploaded_at
        ds = inv_date.isoformat()
        if ds in weekly_map:
            weekly_map[ds]["total"] += 1
            if inv.status == "approved":
                weekly_map[ds]["approved"] += 1
            elif inv.status == "rejected":
                weekly_map[ds]["rejected"] += 1
        month_num = inv_date.month
        if month_num in monthly_map:
            monthly_map[month_num]["total"] += 1
            if inv.status == "approved" and inv.total_amount:
                monthly_map[month_num]["value"] += float(inv.total_amount)

    return {
        "weekly": list(weekly_map.values()),
        "monthly": [{**v, "value": round(v["value"], 2)} for v in monthly_map.values()],
    }
