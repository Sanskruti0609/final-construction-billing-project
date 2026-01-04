from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os
import tempfile

from app.database import get_db
from app import schemas, crud
from app.utils.excel_parser import ExcelProcessor

router = APIRouter()

@router.get("/ssr/", response_model=List[schemas.SSRItem])
def read_ssr_items(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all SSR items"""
    try:
        ssr_items = crud.get_ssr_items(db, skip=skip, limit=limit)
        return ssr_items
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/boq/", response_model=List[schemas.BOQItem])
def read_boq_items(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all BOQ items"""
    try:
        boq_items = crud.get_boq_items(db, skip=skip, limit=limit)
        return boq_items
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/boq/project/{project_id}", response_model=List[schemas.BOQItem])
def read_boq_items_by_project(project_id: str, db: Session = Depends(get_db)):
    """Get BOQ items for a specific project"""
    try:
        boq_items = crud.get_boq_items_by_project(db, project_id=project_id)
        return boq_items
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/ssr/upload/", response_model=schemas.ExcelUploadResponse)
async def upload_ssr_excel(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload and process SSR Excel file"""
    try:
        if not file.filename.endswith(('.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="Only Excel files are allowed")
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name
        
        # Process Excel file
        processor = ExcelProcessor(db)
        result = processor.import_ssr_from_excel(tmp_path)
        
        # Clean up temporary file
        os.unlink(tmp_path)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing SSR file: {str(e)}")

@router.post("/boq/upload/", response_model=schemas.ExcelUploadResponse)
async def upload_boq_excel(
    file: UploadFile = File(...), 
    project_id: str = "default_project",
    project_name: str = "Default Project",
    db: Session = Depends(get_db)
):
    """Upload and process BOQ Excel file"""
    try:
        if not file.filename.endswith(('.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="Only Excel files are allowed")
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name
        
        # Process Excel file
        processor = ExcelProcessor(db)
        result = processor.import_boq_from_excel(tmp_path, project_id, project_name)
        
        # Clean up temporary file
        os.unlink(tmp_path)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing BOQ file: {str(e)}")

@router.post("/calculate/", response_model=schemas.CalculationResponse)
def calculate_project_cost(calculation_request: schemas.CalculationRequest, db: Session = Depends(get_db)):
    """Calculate project cost based on BOQ items and SSR rates"""
    try:
        total_material_cost = 0.0
        total_labour_cost = 0.0
        item_breakdown = []
        
        for boq_item in calculation_request.boq_items:
            # Get SSR item for rates
            ssr_item = crud.get_ssr_item_by_item_no(db, boq_item.ssr_item_no)
            
            if ssr_item:
                material_cost = boq_item.quantity * ssr_item.completed_rate
                labour_cost = boq_item.quantity * ssr_item.labour_rate if calculation_request.include_labour else 0
                
                total_material_cost += material_cost
                total_labour_cost += labour_cost
                
                item_breakdown.append({
                    'item_no': boq_item.item_no,
                    'description': boq_item.description,
                    'quantity': boq_item.quantity,
                    'unit': boq_item.unit,
                    'material_rate': ssr_item.completed_rate,
                    'labour_rate': ssr_item.labour_rate,
                    'material_cost': material_cost,
                    'labour_cost': labour_cost,
                    'ssr_item_no': boq_item.ssr_item_no
                })
        
        subtotal = total_material_cost + total_labour_cost
        gst_amount = subtotal * 0.18  # 18% GST
        grand_total = subtotal + gst_amount
        
        return schemas.CalculationResponse(
            total_material_cost=total_material_cost,
            total_labour_cost=total_labour_cost,
            subtotal=subtotal,
            gst_amount=gst_amount,
            grand_total=grand_total,
            item_breakdown=item_breakdown
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating costs: {str(e)}")

@router.get("/mapping/{ssr_item_no}")
def get_ssr_boq_mapping(ssr_item_no: str, db: Session = Depends(get_db)):
    """Get SSR item and associated BOQ items"""
    try:
        ssr_item = crud.get_ssr_item_by_item_no(db, ssr_item_no)
        if not ssr_item:
            raise HTTPException(status_code=404, detail="SSR item not found")
        
        # Get BOQ items that use this SSR item
        boq_items = db.query(crud.models.BOQItem).filter(
            crud.models.BOQItem.ssr_item_no == ssr_item_no
        ).all()
        
        return {
            'ssr_item': ssr_item,
            'associated_boq_items': boq_items,
            'mapping_count': len(boq_items)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")