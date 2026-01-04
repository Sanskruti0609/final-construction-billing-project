from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging

from app.database import get_db
from app import schemas, crud

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/", response_model=List[schemas.Material])
def read_materials(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all materials"""
    try:
        materials = crud.get_materials(db, skip=skip, limit=limit)
        return materials
    except Exception as e:
        logger.error(f"Error fetching materials: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{material_id}", response_model=schemas.Material)
def read_material(material_id: int, db: Session = Depends(get_db)):
    """Get a specific material by ID"""
    try:
        material = crud.get_material(db, material_id=material_id)
        if material is None:
            raise HTTPException(status_code=404, detail="Material not found")
        return material
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching material {material_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/", response_model=schemas.Material, status_code=status.HTTP_201_CREATED)
def create_material(material: schemas.MaterialCreate, db: Session = Depends(get_db)):
    """Create a new material"""
    try:
        return crud.create_material(db=db, material=material)
    except Exception as e:
        logger.error(f"Error creating material: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/{material_id}", response_model=schemas.Material)
def update_material(material_id: int, material: schemas.MaterialCreate, db: Session = Depends(get_db)):
    """Update an existing material"""
    try:
        db_material = crud.get_material(db, material_id=material_id)
        if db_material is None:
            raise HTTPException(status_code=404, detail="Material not found")
        return crud.update_material(db=db, material_id=material_id, material=material)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating material {material_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/{material_id}")
def delete_material(material_id: int, db: Session = Depends(get_db)):
    """Delete a material"""
    try:
        db_material = crud.get_material(db, material_id=material_id)
        if db_material is None:
            raise HTTPException(status_code=404, detail="Material not found")
        crud.delete_material(db=db, material_id=material_id)
        return {"message": "Material deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting material {material_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/search/", response_model=List[schemas.Material])
def search_materials(query: str, skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """Search materials by name or category"""
    try:
        # This would typically use database search functions
        # For now, we'll filter in Python (replace with proper DB search in production)
        all_materials = crud.get_materials(db, skip=0, limit=1000)
        filtered_materials = [
            material for material in all_materials 
            if query.lower() in material.name.lower() or query.lower() in material.category.lower()
        ]
        return filtered_materials[skip:skip + limit]
    except Exception as e:
        logger.error(f"Error searching materials: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")