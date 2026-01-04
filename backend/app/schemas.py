from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# class MaterialBase(BaseModel):
#     description: str
#     quantity: float = 1.0
class MaterialBase(BaseModel):
    description: str
    ssr_item_no: Optional[str] = None
    boq_item_no: Optional[str] = None
    unit: Optional[str] = None
    quantity: float
    base_rate: float
    gst_rate: float
    final_rate: float
    total_amount: float   


class MaterialCreate(BaseModel):
    description: str

    ssr_item_no: Optional[str] = None
    boq_item_no: Optional[str] = None

    unit: Optional[str] = None
    quantity: float

    base_rate: float
    gst_rate: float
    final_rate: float
    total_amount: float

    is_non_ssr: bool = False


class Material(MaterialBase):
    id: int
    ssr_item_no: str | None = None
    unit: Optional[str] = None   # ✅ FIX
    base_rate: float
    gst_rate: float
    final_rate: float
    total_amount: float

    class Config:
        from_attributes = True


class RateRequest(BaseModel):
    description: str
    quantity: float = 1.0


class RateResponse(BaseModel):
    ssr_item_no: str
    unit: str
    base_rate: float
    gst_rate: float
    final_rate: float
    total_amount: float
    boq_item_no: Optional[str] = None    # from BOQ.json if available
    non_ssr: bool = False    

    
# ---------- INVOICES (for later / your existing CRUD) ----------

class InvoiceItemBase(BaseModel):
    material_id: int
    quantity: float


class InvoiceItemCreate(InvoiceItemBase):
    pass


class InvoiceItem(InvoiceItemBase):
    id: int
    rate: float
    amount: float
    # nested material for convenience
    material: Material

    class Config:
        from_attributes = True


class InvoiceBase(BaseModel):
    client_name: str
    site_name: Optional[str] = None
    invoice_type: str = "general"  # e.g. general / materials / ssr_boq


class InvoiceCreate(InvoiceBase):
    items: List[InvoiceItemCreate]


class Invoice(InvoiceBase):
    id: int
    created_at: datetime
    items: List[InvoiceItem]

    class Config:
        from_attributes = True

class MaterialMeasurementEntry(BaseModel):
    pile_description: Optional[str] = None
    no_of_items: Optional[float] = None
    length: Optional[float] = None
    breadth: Optional[float] = None
    depth: Optional[float] = None
    quantity: Optional[float] = None

class MaterialSingleBillRequest(BaseModel):
    description: str
    # flat fields (optional)
    no_of_items: Optional[float] = None
    length: Optional[float] = None
    breadth: Optional[float] = None
    depth: Optional[float] = None
    quantity: Optional[float] = None
    # multi-row mode
    entries: Optional[List[MaterialMeasurementEntry]] = None

class SingleMaterialBillEntry(BaseModel):
    """
    One measurement row in the individual material bill:
    No × L × B × D = Quantity
    """
    pile_description: Optional[str] = ""
    no_of_items: Optional[float] = None
    length: Optional[float] = None
    breadth: Optional[float] = None
    depth: Optional[float] = None
    quantity: Optional[float] = None  # frontend may send, backend recomputes anyway


class SingleMaterialBillRequest(BaseModel):
    """
    Request body for:
      - POST /materials/single-bill/pdf
      - POST /materials/single-bill/excel

    Matches what your MaterialForm sends from the frontend:
      {
        "description": "...",
        "entries": [ { ...row... }, ... ]
      }
    """
    description: str
    entries: List[SingleMaterialBillEntry]