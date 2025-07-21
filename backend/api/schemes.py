from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
import traceback

# Use relative imports since we're in api/ subdirectory
from ..database import get_db
from .. import schemas, crud, models

from fastapi.encoders import jsonable_encoder
from fastapi import Body
import sys
sys.path.append("..")
try:
    from ..services.ai_service import GroqAIService
except ImportError:
    from services.ai_service import GroqAIService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/schemes", tags=["Schemes"])

# --- AI Scheme Generation Endpoint ---
@router.post("/generate", response_model=dict)
async def generate_scheme_of_work(
    context: dict = Body(..., description="Full scheme and timetable context for AI generation"),
    config: dict = Body({}, description="Optional AI config"),
):
    """Generate a scheme of work using AI based on provided context and timetable data."""
    try:
        # --- Ensure selected topics/subtopics are passed by title, not just ID ---
        db = next(get_db())
        timetable_data = context.get("timetable_data", {})
        # Replace selected_topics with their titles
        if "selected_topics" in timetable_data:
            topic_ids = timetable_data["selected_topics"]
            if topic_ids and isinstance(topic_ids[0], int):
                topics = db.query(models.Topic).filter(models.Topic.id.in_(topic_ids)).all()
                timetable_data["selected_topics"] = [{"id": t.id, "title": t.title} for t in topics]
        # Replace selected_subtopics with their titles
        if "selected_subtopics" in timetable_data:
            subtopic_ids = timetable_data["selected_subtopics"]
            if subtopic_ids and isinstance(subtopic_ids[0], int):
                subtopics = db.query(models.Subtopic).filter(models.Subtopic.id.in_(subtopic_ids)).all()
                timetable_data["selected_subtopics"] = [{"id": st.id, "title": st.title} for st in subtopics]
        context["timetable_data"] = timetable_data
        ai_service = GroqAIService()
        result = ai_service.generate_scheme_of_work(context, config)
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"AI generation error: {str(e)}")
        return {"success": False, "error": str(e)}

@router.post("/", response_model=schemas.SchemeOfWorkResponse)
async def create_scheme(
    scheme: schemas.SchemeOfWorkCreate,
    user_google_id: str = Query(..., description="User's Google ID"),
    db: Session = Depends(get_db)
):
    """Create a new scheme of work"""
    try:
        logger.info(f"Creating scheme for user: {user_google_id}")
        logger.info(f"Scheme data: {scheme.model_dump()}")
        
        # Get user by Google ID
        user = crud.user.get_by_google_id(db, google_id=user_google_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        logger.info(f"Found user: {user.id} - {user.email}")
        
        # Create scheme data
        scheme_data = scheme.model_dump()
        scheme_data["user_id"] = user.id

        # --- Resolve and save names for all relevant fields ---
        # School Level
        school_level = db.query(models.SchoolLevel).filter(models.SchoolLevel.id == scheme_data["school_level_id"]).first()
        scheme_data["school_level_name"] = school_level.name if school_level else None

        # Form/Grade
        form_grade = db.query(models.FormGrade).filter(models.FormGrade.id == scheme_data["form_grade_id"]).first()
        scheme_data["form_grade_name"] = form_grade.name if form_grade else None

        # Term
        term = db.query(models.Term).filter(models.Term.id == scheme_data["term_id"]).first()
        scheme_data["term_name"] = term.name if term else None

        # Subject
        if scheme_data.get("subject_id"):
            subject = db.query(models.Subject).filter(models.Subject.id == scheme_data["subject_id"]).first()
            scheme_data["subject_name"] = subject.name if subject else scheme_data.get("subject_name")

        # School (get by school_level)
        school = None
        if school_level:
            school = db.query(models.School).filter(models.School.id == school_level.school_id).first()
        scheme_data["school_name"] = school.name if school else scheme_data.get("school_name")

        logger.info(f"Creating scheme with data: {scheme_data}")

        # Create the scheme using your CRUD function
        db_scheme = crud.scheme.create(db=db, obj_in=scheme_data)

        logger.info(f"Scheme created successfully: {db_scheme.id}")

        # Convert SQLAlchemy model to Pydantic model
        scheme_response = schemas.SchemeOfWorkResponse.model_validate(db_scheme)

        return scheme_response
        
    except Exception as e:
        logger.error(f"Error creating scheme: {str(e)}")
        logger.error(traceback.format_exc())
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create scheme: {str(e)}")

@router.get("/", response_model=List[schemas.SchemeOfWorkResponse])
async def get_user_schemes(
    user_google_id: str = Query(..., description="User's Google ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get all schemes for a user"""
    try:
        user = crud.user.get_by_google_id(db, google_id=user_google_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        schemes = crud.scheme.get_multi_by_user(db=db, user_id=user.id, skip=skip, limit=limit)
        
        # Convert each SQLAlchemy model to Pydantic model
        schemes_response = [schemas.SchemeOfWorkResponse.model_validate(scheme) for scheme in schemes]
        
        return schemes_response
        
    except Exception as e:
        logger.error(f"Error getting schemes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{scheme_id}", response_model=schemas.SchemeOfWorkResponse)
async def get_scheme(
    scheme_id: int = Path(..., description="Scheme ID"),
    user_google_id: str = Query(..., description="User's Google ID"),
    db: Session = Depends(get_db)
):
    """Get a specific scheme"""
    try:
        user = crud.user.get_by_google_id(db, google_id=user_google_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        scheme = crud.scheme.get(db=db, id=scheme_id)
        if not scheme:
            raise HTTPException(status_code=404, detail="Scheme not found")
        
        if scheme.user_id != user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this scheme")
        
        # Convert SQLAlchemy model to Pydantic model
        scheme_response = schemas.SchemeOfWorkResponse.model_validate(scheme)
        
        return scheme_response
        
    except Exception as e:
        logger.error(f"Error getting scheme: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

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
    # Convert to Pydantic model
    return schemas.SchemeOfWorkResponse.model_validate(latest_scheme)

@router.get("/subjects", response_model=List[schemas.Subject])
async def get_subjects_for_scheme(
    form_grade_id: int = Query(..., description="Form/Grade ID"),
    term_id: int = Query(..., description="Term ID"),
    db: Session = Depends(get_db)
):
    """Get subjects for specific form and term"""
    subjects = crud.subject.get_by_term(db=db, term_id=term_id)
    return subjects 