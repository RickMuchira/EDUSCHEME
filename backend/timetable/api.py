# backend/timetable/api.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import json

from backend.database import get_db
from backend.timetable import crud, schemas, models
from backend.timetable.crud import timetable_crud
from backend.auth import get_current_user  # Assuming you have auth
from backend.timetable.schemas import TimetableListResponse, TimetableSlotResponse, TimetableAnalyticsResponse

router = APIRouter(prefix="/api/timetables", tags=["Timetables"])

@router.post("/", response_model=schemas.TimetableResponse)
async def create_timetable(
    timetable_data: schemas.TimetableCreate,
    user_id: int = Query(..., description="User ID"),
    db: Session = Depends(get_db)
):
    """Create a new timetable with slots"""
    try:
        # Create the main timetable
        db_timetable = timetable_crud.create_timetable(
            db=db,
            timetable=timetable_data,
            user_id=user_id
        )
        
        # Add slots if provided
        if timetable_data.slots:
            for slot_data in timetable_data.slots:
                timetable_crud.create_slot(
                    db=db,
                    slot=slot_data,
                    timetable_id=db_timetable.id,
                    user_id=user_id
                )
        
        # Generate analytics
        analytics = timetable_crud.get_analytics(db, db_timetable.id)
        
        return {
            "success": True,
            "message": "Timetable created successfully",
            "data": db_timetable,
            "analytics": analytics
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{timetable_id}", response_model=schemas.TimetableResponse)
async def update_timetable(
    timetable_id: str,
    timetable_data: schemas.TimetableUpdate,
    user_id: int = Query(..., description="User ID"),
    db: Session = Depends(get_db)
):
    """Update an existing timetable"""
    try:
        # Update main timetable
        db_timetable = timetable_crud.update_timetable(
            db=db,
            timetable_id=timetable_id,
            timetable_update=timetable_data,
            user_id=user_id
        )
        
        if not db_timetable:
            raise HTTPException(status_code=404, detail="Timetable not found")
        
        # Update slots if provided
        if timetable_data.slots is not None:
            # Clear existing slots
            # timetable_crud.clear_slots(db, timetable_id, user_id) # TODO: Implement clear_slots
            
            # Add new slots
            for slot_data in timetable_data.slots:
                timetable_crud.create_slot(
                    db=db,
                    slot=slot_data,
                    timetable_id=timetable_id,
                    user_id=user_id
                )
        
        # Recalculate analytics
        analytics = timetable_crud.get_analytics(db, timetable_id)
        
        return {
            "success": True,
            "message": "Timetable updated successfully",
            "data": db_timetable,
            "analytics": analytics
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{timetable_id}", response_model=schemas.TimetableResponse)
async def get_timetable(
    timetable_id: str,
    user_id: int = Query(..., description="User ID"),
    db: Session = Depends(get_db)
):
    """Get a specific timetable with all slots"""
    try:
        timetable = timetable_crud.get_timetable_with_slots(db, timetable_id, user_id)
        
        if not timetable:
            raise HTTPException(status_code=404, detail="Timetable not found")
        
        # Get analytics
        analytics = timetable_crud.get_analytics(db, timetable_id)
        
        return {
            "success": True,
            "message": "Timetable retrieved successfully",
            "data": timetable,
            "analytics": analytics
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=TimetableListResponse)
async def list_timetables(
    user_id: int = Query(..., description="User ID"),
    db: Session = Depends(get_db)
):
    """List all timetables for a user"""
    try:
        timetables = timetable_crud.get_user_timetables(
            db=db,
            user_id=user_id
        )
        return TimetableListResponse(
            success=True,
            message=f"Found {len(timetables)} timetables",
            data=timetables,
            total=len(timetables)
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{timetable_id}")
async def delete_timetable(
    timetable_id: str,
    user_id: int = Query(..., description="User ID"),
    db: Session = Depends(get_db)
):
    """Delete a timetable"""
    try:
        success = timetable_crud.delete_timetable(db, timetable_id, user_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Timetable not found")
        
        return {
            "success": True,
            "message": "Timetable deleted successfully"
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{timetable_id}/slots", response_model=TimetableSlotResponse)
async def add_slot(
    timetable_id: str,
    slot_data: schemas.TimetableSlotCreate,
    user_id: int = Query(..., description="User ID"),
    db: Session = Depends(get_db)
):
    """Add a single slot to a timetable"""
    try:
        db_slot = timetable_crud.create_slot(
            db=db,
            slot=slot_data,
            timetable_id=timetable_id,
            user_id=user_id
        )
        
        if not db_slot:
            raise HTTPException(status_code=400, detail="Failed to create slot")
        
        return {
            "success": True,
            "message": "Slot added successfully",
            "data": db_slot
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{timetable_id}/slots")
async def remove_slot(
    timetable_id: str,
    day_of_week: str = Query(..., description="Day of the week"),
    time_slot: str = Query(..., description="Time slot"),
    user_id: int = Query(..., description="User ID"),
    db: Session = Depends(get_db)
):
    """Remove a specific slot from a timetable"""
    try:
        success = timetable_crud.remove_slot(
            db=db,
            timetable_id=timetable_id,
            day_of_week=day_of_week,
            time_slot=time_slot,
            user_id=user_id
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Slot not found")
        
        return {
            "success": True,
            "message": "Slot removed successfully"
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{timetable_id}/analytics", response_model=TimetableAnalyticsResponse)
async def get_timetable_analytics(
    timetable_id: str,
    user_id: int = Query(..., description="User ID"),
    db: Session = Depends(get_db)
):
    """Get analytics for a specific timetable"""
    try:
        # Verify timetable ownership
        timetable = timetable_crud.get_timetable(db, timetable_id, user_id)
        if not timetable:
            raise HTTPException(status_code=404, detail="Timetable not found")
        
        analytics = timetable_crud.get_analytics(db, timetable_id)
        
        return {
            "success": True,
            "message": "Analytics retrieved successfully",
            "data": analytics
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/autosave", response_model=schemas.TimetableResponse)
async def autosave_timetable(
    autosave_data: schemas.AutosaveData,
    user_id: int = Query(..., description="User ID"),
    db: Session = Depends(get_db)
):
    """Auto-save timetable data from frontend"""
    try:
        # Check if timetable exists
        existing_timetable = None
        if autosave_data.timetable_id:
            existing_timetable = timetable_crud.get_timetable(
                db, autosave_data.timetable_id, user_id
            )
        
        if existing_timetable:
            # Update existing timetable
            update_data = schemas.TimetableUpdate(
                name=autosave_data.name or existing_timetable.name,
                description=autosave_data.description,
                subject_id=autosave_data.subject_id,
                slots=autosave_data.slots
            )
            
            db_timetable = timetable_crud.update_timetable(
                db=db,
                timetable_id=existing_timetable.id,
                timetable_update=update_data,
                user_id=user_id
            )
        else:
            # Create new timetable
            create_data = schemas.TimetableCreate(
                name=autosave_data.name or f"Timetable {datetime.now().strftime('%Y-%m-%d %H:%M')}",
                description=autosave_data.description or "Auto-saved timetable",
                subject_id=autosave_data.subject_id,
                slots=autosave_data.slots or []
            )
            
            db_timetable = timetable_crud.create_timetable(
                db=db,
                timetable=create_data,
                user_id=user_id
            )
        
        # Get updated analytics
        analytics = timetable_crud.get_analytics(db, db_timetable.id)
        
        return {
            "success": True,
            "message": "Timetable auto-saved successfully",
            "data": db_timetable,
            "analytics": analytics
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))