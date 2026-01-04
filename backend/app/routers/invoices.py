from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import os
import tempfile
from datetime import datetime

from app.database import get_db
from app import schemas, crud
from app.utils.pdf_generator import InvoicePDFGenerator

router = APIRouter()
pdf_generator = InvoicePDFGenerator()

@router.get("/", response_model=List[schemas.Invoice])
def read_invoices(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all invoices"""
    try:
        invoices = crud.get_invoices(db, skip=skip, limit=limit)
        return invoices
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/{invoice_id}", response_model=schemas.Invoice)
def read_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """Get a specific invoice by ID"""
    try:
        invoice = crud.get_invoice(db, invoice_id=invoice_id)
        if invoice is None:
            raise HTTPException(status_code=404, detail="Invoice not found")
        return invoice
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/", response_model=schemas.Invoice, status_code=status.HTTP_201_CREATED)
def create_invoice(invoice: schemas.InvoiceCreate, db: Session = Depends(get_db)):
    """Create a new invoice"""
    try:
        return crud.create_invoice(db=db, invoice=invoice)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/{invoice_id}/generate-pdf/")
def generate_invoice_pdf(invoice_id: int, template_type: str = "standard", db: Session = Depends(get_db)):
    """Generate PDF for an invoice"""
    try:
        invoice = crud.get_invoice(db, invoice_id=invoice_id)
        if invoice is None:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Convert SQLAlchemy model to dict for PDF generation
        invoice_data = {
            'invoice_number': invoice.invoice_number,
            'project_name': invoice.project_name,
            'client_name': invoice.client_name,
            'client_address': invoice.client_address,
            'client_gstin': invoice.client_gstin,
            'date': invoice.date,
            'items': invoice.items,
            'subtotal': invoice.subtotal,
            'gst_percentage': invoice.gst_percentage,
            'gst_amount': invoice.gst_amount,
            'grand_total': invoice.grand_total,
            'template_type': template_type
        }
        
        # Create temporary file for PDF
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            output_path = tmp_file.name
        
        # Generate PDF based on template type
        if template_type == "detailed":
            pdf_path = pdf_generator.generate_detailed_invoice(invoice_data, output_path)
        elif template_type == "simplified":
            pdf_path = pdf_generator.generate_simplified_invoice(invoice_data, output_path)
        else:
            pdf_path = pdf_generator.generate_standard_invoice(invoice_data, output_path)
        
        # Read the generated PDF
        with open(pdf_path, 'rb') as pdf_file:
            pdf_content = pdf_file.read()
        
        # Clean up temporary file
        os.unlink(pdf_path)
        
        # Return PDF as response
        from fastapi.responses import Response
        return Response(
            content=pdf_content,
            media_type='application/pdf',
            headers={
                'Content-Disposition': f'attachment; filename="invoice_{invoice.invoice_number}.pdf"'
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")

@router.put("/{invoice_id}/status")
def update_invoice_status(invoice_id: int, status: str, db: Session = Depends(get_db)):
    """Update invoice status"""
    try:
        invoice = crud.get_invoice(db, invoice_id=invoice_id)
        if invoice is None:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        valid_statuses = ["draft", "sent", "paid", "cancelled"]
        if status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
        
        return crud.update_invoice_status(db=db, invoice_id=invoice_id, status=status)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/{invoice_id}/preview")
def preview_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """Get invoice data for preview (without generating PDF)"""
    try:
        invoice = crud.get_invoice(db, invoice_id=invoice_id)
        if invoice is None:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        return {
            "invoice": invoice,
            "calculated_totals": {
                "subtotal": invoice.subtotal,
                "gst_amount": invoice.gst_amount,
                "grand_total": invoice.grand_total
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")