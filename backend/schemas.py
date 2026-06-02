from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class LineItemBase(BaseModel):
    description: Optional[str] = None
    quantity: Optional[float] = None
    unit_price: Optional[float] = None
    total_price: Optional[float] = None


class LineItemCreate(LineItemBase):
    pass


class LineItem(LineItemBase):
    id: int
    invoice_id: int

    class Config:
        from_attributes = True


class InvoiceBase(BaseModel):
    vendor_name: Optional[str] = None
    invoice_number: Optional[str] = None
    total_amount: Optional[float] = None
    date: Optional[str] = None
    due_date: Optional[str] = None


class InvoiceUpdate(InvoiceBase):
    status: str
    notes: Optional[str] = None
    line_items: Optional[List[LineItemBase]] = None


class InvoiceListItem(InvoiceBase):
    id: int
    filename: str
    status: str
    uploaded_at: datetime
    confidence_score: Optional[float] = None
    line_items: List[LineItem] = []

    class Config:
        from_attributes = True


class Invoice(InvoiceBase):
    id: int
    filename: str
    status: str
    uploaded_at: datetime
    confidence_score: Optional[float] = None
    raw_text: Optional[str] = None
    notes: Optional[str] = None
    line_items: List[LineItem] = []

    class Config:
        from_attributes = True


class PaginatedInvoices(BaseModel):
    items: List[InvoiceListItem]
    total: int
    page: int
    limit: int
    pages: int
