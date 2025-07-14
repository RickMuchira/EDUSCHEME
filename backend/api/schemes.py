from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

# Use relative imports since we're in api/ subdirectory
from ..database import get_db
from .. import schemas, crud

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/schemes", tags=["Schemes"])

@router.post("/", response_model=schemas.SchemeOfWork)
async def create_scheme(
    scheme: schemas.SchemeOfWorkCreate,
    user_google_id: str = Query(..., description="User's Google ID"),
    db: Session = Depends(get_db)
):
    """Create a new scheme of work and save to database"""
    try:
        # Get user
        user = crud.user.get_by_google_id(db, google_id=user_google_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        # Create scheme data
        scheme_data = scheme.dict()
        scheme_data["user_id"] = user.id
        scheme_data["status"] = "completed"  # Mark as completed when saving
        scheme_data["progress"] = 100
        db_scheme = crud.scheme.create(db=db, obj_in=scheme_data)
        return db_scheme
    except Exception as e:
        logger.error(f"Error creating scheme: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/latest", response_model=schemas.SchemeOfWork)
async def get_latest_scheme(
    user_google_id: str = Query(..., description="User's Google ID"),
    db: Session = Depends(get_db)
):
    """Get user's latest scheme of work"""
    user = crud.user.get_by_google_id(db, google_id=user_google_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Get latest scheme
    latest_scheme = crud.scheme.get_latest_by_user(db=db, user_id=user.id)
    if not latest_scheme:
        raise HTTPException(status_code=404, detail="No schemes found")
    return latest_scheme

@router.get("/subjects", response_model=List[schemas.Subject])
async def get_subjects_for_scheme(
    form_grade_id: int = Query(..., description="Form/Grade ID"),
    term_id: int = Query(..., description="Term ID"),
    db: Session = Depends(get_db)
):
    """Get subjects for specific form and term"""
    subjects = crud.subject.get_by_term(db=db, term_id=term_id)
    return subjects 