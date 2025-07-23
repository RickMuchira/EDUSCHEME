from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
import traceback

# Use absolute imports for compatibility when running main.py as entry point
from database import get_db
import schemas, crud, models

from fastapi.encoders import jsonable_encoder
from fastapi import Body
import sys
sys.path.append("..")
try:
    from services.ai_service import GroqAIService
except ImportError:
    from services.ai_service import GroqAIService

from fastapi.responses import StreamingResponse
from services.pdf_service import PDFService
import io

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/schemes", tags=["Schemes"])

pdf_service = PDFService()

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
        logger.info(f"🔍 Getting scheme {scheme_id} for user {user_google_id}")
        
        user = crud.user.get_by_google_id(db, google_id=user_google_id)
        if not user:
            logger.error(f"❌ User not found: {user_google_id}")
            raise HTTPException(status_code=404, detail="User not found")
        
        logger.info(f"✅ Found user: {user.id} - {user.email}")
        
        scheme = crud.scheme.get(db=db, id=scheme_id)
        if not scheme:
            logger.error(f"❌ Scheme not found: {scheme_id}")
            raise HTTPException(status_code=404, detail="Scheme not found")
        
        logger.info(f"✅ Found scheme: {scheme.id} - {scheme.subject_name}")
        logger.info(f"📋 Scheme data: subject_id={scheme.subject_id}, school_name={scheme.school_name}, user_id={scheme.user_id}")
        
        if scheme.user_id != user.id:
            logger.error(f"❌ Unauthorized access: user {user.id} trying to access scheme {scheme_id} owned by {scheme.user_id}")
            raise HTTPException(status_code=403, detail="Not authorized to access this scheme")
        
        # Check subject_id before conversion
        if not scheme.subject_id:
            logger.error(f"❌ Scheme {scheme_id} is missing subject_id in database")
            raise HTTPException(status_code=422, detail="Scheme is missing subject_id. Please edit the scheme to assign a subject.")
        
        logger.info(f"✅ Scheme validation passed. Converting to response format...")
        
        # Convert SQLAlchemy model to Pydantic model
        try:
            scheme_response = schemas.SchemeOfWorkResponse.model_validate(scheme)
            logger.info(f"✅ Schema validation successful. Response subject_id: {scheme_response.subject_id}")
            return scheme_response
        except Exception as validation_error:
            logger.error(f"❌ Schema validation failed: {validation_error}")
            logger.error(f"Raw scheme data: {scheme.__dict__}")
            raise HTTPException(status_code=500, detail="Failed to validate scheme data")
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error getting scheme {scheme_id}: {str(e)}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to get scheme: {str(e)}")

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

@router.get("/{scheme_id}/pdf")
async def download_scheme_pdf(
    scheme_id: int = Path(..., description="Scheme ID"),
    user_google_id: str = Query(..., description="User's Google ID"),
    db: Session = Depends(get_db)
):
    """Download a scheme of work as PDF"""
    try:
        user = crud.user.get_by_google_id(db, google_id=user_google_id)
        if not user:
            logger.error(f"User not found for google_id: {user_google_id}")
            raise HTTPException(status_code=404, detail="User not found")
            
        scheme = crud.scheme.get(db=db, id=scheme_id)
        if not scheme:
            logger.error(f"Scheme not found for id: {scheme_id}")
            raise HTTPException(status_code=404, detail="Scheme not found")
            
        if scheme.user_id != user.id:
            logger.error(f"User {user.id} not authorized for scheme {scheme_id} (belongs to {scheme.user_id})")
            raise HTTPException(status_code=403, detail="Not authorized to access this scheme")
        
        # Create PDF content - use generated content if available, otherwise create a template
        pdf_content = scheme.generated_content
        
        if not pdf_content:
            logger.info(f"No generated content for scheme {scheme_id}, creating template PDF")
            # Create a template scheme structure
            pdf_content = {
                "scheme_header": {
                    "school_name": scheme.school_name,
                    "subject": scheme.subject_name,
                    "form_grade": scheme.form_grade_name or "Unknown Form",
                    "term": scheme.term_name or "Unknown Term",
                    "academic_year": scheme.academic_year,
                    "total_weeks": 12,
                    "total_lessons": 36
                },
                "weeks": [
                    {
                        "week_number": i,
                        "theme": f"Week {i} - Content to be generated",
                        "learning_focus": "This scheme of work is waiting for AI-generated content.",
                        "lessons": [
                            {
                                "lesson_number": j,
                                "topic_subtopic": f"Topic {j} - To be generated",
                                "specific_objectives": ["Generate scheme content to populate this section"],
                                "teaching_learning_activities": ["Use the AI generator to create detailed lesson plans"],
                                "materials_resources": ["Resources will be suggested after generation"],
                                "references": "References will be provided after AI generation"
                            }
                            for j in range(1, 4)  # 3 lessons per week
                        ]
                    }
                    for i in range(1, 13)  # 12 weeks
                ]
            }
        
        # Use the PDF service to generate the PDF
        pdf_bytes = pdf_service.generate_scheme_pdf(pdf_content, {
            "school_name": scheme.school_name,
            "subject_name": scheme.subject_name,
            "form_grade": scheme.form_grade_name or "Unknown Form",
            "term": scheme.term_name or "Unknown Term",
            "academic_year": scheme.academic_year,
            "user_id": scheme.user_id,
        })
        
        filename = f"Scheme_of_Work_{scheme.subject_name}_{scheme.academic_year}.pdf"
        headers = pdf_service.create_pdf_response_headers(filename)
        
        logger.info(f"PDF generated successfully for scheme {scheme_id}, size: {len(pdf_bytes)} bytes")
        return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers=headers)
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"PDF generation failed for scheme {scheme_id}: {str(e)}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Failed to generate PDF") 