from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime , Text
from sqlalchemy.orm import relationship
from datetime import datetime

from .database import Base

class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)

    description = Column(String, nullable=False)

    ssr_item_no = Column(String, nullable=True)
    boq_item_no = Column(String, nullable=True)

    unit = Column(String, nullable=True)

    quantity = Column(Float, default=0)
    base_rate = Column(Float, default=0)
    gst_rate = Column(Float, default=0)
    final_rate = Column(Float, default=0)
    total_amount = Column(Float, default=0)
    # 🔹 important: match InvoiceItem.material back_populates
    invoice_items = relationship("InvoiceItem", back_populates="material")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    client_name = Column(String, nullable=False)
    site_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    invoice_type = Column(String, default="general")  # general / materials / ssr_boq

    items = relationship("InvoiceItem", back_populates="invoice")


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"))
    material_id = Column(Integer, ForeignKey("materials.id"))
    quantity = Column(Float, nullable=False)
    rate = Column(Float, nullable=False)
    amount = Column(Float, nullable=False)

    invoice = relationship("Invoice", back_populates="items")
    material = relationship("Material", back_populates="invoice_items")
