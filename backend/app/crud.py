from sqlalchemy.orm import Session
from . import models, schemas
from .utils.ssr_loader import fetch_ssr_rate
from fastapi import HTTPException


# ---------- MATERIALS ----------


def create_material(db: Session, material: schemas.MaterialCreate):
    db_material = models.Material(
        description=material.description,
        ssr_item_no=material.ssr_item_no,
        boq_item_no=material.boq_item_no,
        unit=material.unit,
        quantity=material.quantity,
        base_rate=material.base_rate,
        gst_rate=material.gst_rate,
        final_rate=material.final_rate,
        total_amount=material.total_amount,
    )
    db.add(db_material)
    db.commit()
    db.refresh(db_material)
    return db_material



def get_materials(db: Session) -> list[models.Material]:
    return (
        db.query(models.Material)
        .order_by(models.Material.id.asc())
        .all()
    )


def delete_material(db: Session, material_id: int) -> bool:
    obj = db.query(models.Material).get(material_id)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True

# ---------- INVOICES ----------

def create_invoice(db: Session, inv_in: schemas.InvoiceCreate) -> models.Invoice:
    invoice = models.Invoice(
        client_name=inv_in.client_name,
        site_name=inv_in.site_name,
        invoice_type=inv_in.invoice_type,
    )
    db.add(invoice)
    db.flush()  # invoice.id available

    for item_in in inv_in.items:
        material = db.query(models.Material).get(item_in.material_id)
        if not material:
            continue
        rate = material.rate
        amount = rate * item_in.quantity

        inv_item = models.InvoiceItem(
            invoice=invoice,
            material=material,
            quantity=item_in.quantity,
            rate=rate,
            amount=amount,
        )
        db.add(inv_item)

    db.commit()
    db.refresh(invoice)
    return invoice


def get_invoice(db: Session, invoice_id: int):
    return db.query(models.Invoice).get(invoice_id)


def list_invoices(db: Session, skip: int = 0, limit: int = 50):
    return db.query(models.Invoice).order_by(models.Invoice.created_at.desc()).offset(skip).limit(limit).all()
