from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import datetime


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    status = Column(String, default="processing")  # processing | review | approved | rejected
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    user_id = Column(String, nullable=True, index=True)  # Supabase user UUID

    vendor_name = Column(String, nullable=True)
    invoice_number = Column(String, nullable=True)
    total_amount = Column(Float, nullable=True)
    date = Column(String, nullable=True)
    due_date = Column(String, nullable=True)
    confidence_score = Column(Float, nullable=True)
    raw_text = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    line_items = relationship("LineItem", back_populates="invoice", cascade="all, delete-orphan")


class LineItem(Base):
    __tablename__ = "line_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"))
    description = Column(String, nullable=True)
    quantity = Column(Float, nullable=True)
    unit_price = Column(Float, nullable=True)
    total_price = Column(Float, nullable=True)

    invoice = relationship("Invoice", back_populates="line_items")
