# backend/main.py
from fastapi import FastAPI, HTTPException, Depends, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session, joinedload  # Add joinedload import
from sqlalchemy.sql import func
from typing import List, Optional
import time
import logging
import os
from database import create_tables, get_db
import schemas
import crud
import models
from fastapi.exception_handlers import RequestValidationError
from fastapi.exceptions import RequestValidationError
from fastapi import Request
import uuid
from datetime import datetime
from fastapi import APIRouter, Query, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import logging

from services.ai_service import GroqAIService
from database import get_db


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app

app = FastAPI(
    title="EDUScheme Pro API",
    description="AI-powered curriculum planning and content management system",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for frontend (React on localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # or ["*"] for all origins (not recommended for production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== USER DEBUG & ENHANCED LOOKUP HELPERS =====
def get_or_create_user(db: Session, user_identifier: str) -> models.User:
    """
    Enhanced user lookup that tries multiple methods and creates user if needed
    """
    logger.info(f"🔍 Looking up user with identifier: '{user_identifier}'")
    # Method 1: Try by Google ID
    user = crud.user.get_by_google_id(db, google_id=user_identifier)
    if user:
        logger.info(f"✅ Found user by Google ID: {user.email}")
        return user
    # Method 2: Try by email (in case user_identifier is email)
    user = crud.user.get_by_email(db, email=user_identifier)
    if user:
        logger.info(f"✅ Found user by email: {user.email}")
        return user
    # Method 3: If identifier looks like email, create user
    if "@" in user_identifier:
        logger.info(f"🔧 Creating new user with email: {user_identifier}")
        try:
            user_data = {
                "google_id": user_identifier,
                "email": user_identifier,
                "name": user_identifier.split("@")[0].title(),
                "picture": None
            }
            user = crud.user.create(db=db, obj_in=schemas.UserCreate(**user_data))
            logger.info(f"✅ Created new user: {user.email}")
            return user
        except Exception as e:
            logger.error(f"❌ Failed to create user: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Failed to create user: {str(e)}")
    logger.error(f"❌ Could not find or create user with identifier: '{user_identifier}'")
    return None

# ===== DEBUG USER SESSION ENDPOINT =====
@app.get("/api/debug/user-session", tags=["Debug"])
async def debug_user_session(
    user_google_id: str = Query(..., description="User's Google ID from session"),
    db: Session = Depends(get_db)
):
    """Debug endpoint to check user session and database"""
    try:
        logger.info(f"🔍 Debug - Received user_google_id: '{user_google_id}'")
        user_by_google_id = crud.user.get_by_google_id(db, google_id=user_google_id)
        user_by_email = crud.user.get_by_email(db, email=user_google_id)
        all_users = db.query(models.User).limit(10).all()
        return {
            "success": True,
            "debug_info": {
                "received_identifier": user_google_id,
                "user_found_by_google_id": bool(user_by_google_id),
                "user_found_by_email": bool(user_by_email),
                "user_by_google_id_details": {
                    "id": user_by_google_id.id if user_by_google_id else None,
                    "email": user_by_google_id.email if user_by_google_id else None,
                    "google_id": user_by_google_id.google_id if user_by_google_id else None
                } if user_by_google_id else None,
                "user_by_email_details": {
                    "id": user_by_email.id if user_by_email else None,
                    "email": user_by_email.email if user_by_email else None,
                    "google_id": user_by_email.google_id if user_by_email else None
                } if user_by_email else None,
                "all_users_in_db": [
                    {
                        "id": u.id,
                        "email": u.email,
                        "google_id": u.google_id,
                        "name": u.name
                    } for u in all_users
                ],
                "total_users_in_db": len(all_users)
            }
        }
    except Exception as e:
        logger.error(f"Debug error: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Create FastAPI app
app = FastAPI(
    title="EDUScheme Pro API",
    description="AI-powered curriculum planning and content management system",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ============= HELPER FUNCTIONS =============
# Enhanced user lookup function is defined earlier in the file (line 53)

# ============= DEBUG ENDPOINT =============
# ADD THIS DEBUG ENDPOINT AFTER THE HELPER FUNCTIONS

@app.get("/api/debug/user-session", tags=["Debug"])
async def debug_user_session(
    user_google_id: str = Query(..., description="User's Google ID from session"),
    db: Session = Depends(get_db)
):
    """Debug endpoint to check user session and database"""
    try:
        # Check what we received
        logger.info(f"🔍 Debug - Received user_google_id: '{user_google_id}'")
        # Try different ways to find user
        user_by_google_id = crud.user.get_by_google_id(db, google_id=user_google_id)
        user_by_email = crud.user.get_by_email(db, email=user_google_id)
        # Get all users to see what's in database
        all_users = db.query(models.User).limit(10).all()
        return {
            "success": True,
            "debug_info": {
                "received_identifier": user_google_id,
                "user_found_by_google_id": bool(user_by_google_id),
                "user_found_by_email": bool(user_by_email),
                "user_by_google_id_details": {
                    "id": user_by_google_id.id if user_by_google_id else None,
                    "email": user_by_google_id.email if user_by_google_id else None,
                    "google_id": user_by_google_id.google_id if user_by_google_id else None
                } if user_by_google_id else None,
                "user_by_email_details": {
                    "id": user_by_email.id if user_by_email else None,
                    "email": user_by_email.email if user_by_email else None,
                    "google_id": user_by_email.google_id if user_by_email else None
                } if user_by_email else None,
                "all_users_in_db": [
                    {
                        "id": u.id,
                        "email": u.email,
                        "google_id": u.google_id,
                        "name": u.name
                    } for u in all_users
                ],
                "total_users_in_db": len(all_users)
            }
        }
    except Exception as e:
        logger.error(f"Debug error: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

# CORS configuration
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

# Custom middleware for request timing
@app.middleware("http")
async def add_process_time_header(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "detail": "An unexpected error occurred"
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation error: {exc.errors()}")
    try:
        body = await request.body()
        logger.error(f"Request body: {body}")
    except Exception as e:
        logger.error(f"Could not read request body: {e}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize database and perform startup tasks"""
    logger.info("Starting EDUScheme Pro API...")
    try:
        create_tables()
        logger.info("Database tables created/verified successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        raise

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "eduscheme-pro-api",
        "version": "2.0.0",
        "timestamp": time.time()
    }

# ============= USER ENDPOINTS =============

@app.post("/api/users", response_model=schemas.User, tags=["Users"])
async def create_user(
   user: schemas.UserCreate,
   db: Session = Depends(get_db)
):
   """Create a new user from Google authentication"""
   try:
       # Check if user already exists
       existing_user = crud.user.get_by_google_id(db, google_id=user.google_id)
       if existing_user:
           # Update last login
           existing_user.last_login = func.now()
           db.commit()
           db.refresh(existing_user)
           return existing_user
       
       # Create new user
       db_user = crud.user.create(db=db, obj_in=user)
       return db_user
   except Exception as e:
       logger.error(f"Error creating user: {str(e)}")
       raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/users/me", response_model=schemas.User, tags=["Users"])
async def get_current_user(
   google_id: str = Query(..., description="Google ID of the user"),
   db: Session = Depends(get_db)
):
   """Get current user information"""
   user = crud.user.get_by_google_id(db, google_id=google_id)
   if not user:
       raise HTTPException(status_code=404, detail="User not found")
   return user

@app.put("/api/users/me", response_model=schemas.User, tags=["Users"])
async def update_current_user(
   user_update: schemas.UserUpdate,
   google_id: str = Query(..., description="Google ID of the user"),
   db: Session = Depends(get_db)
):
   """Update current user information"""
   user = crud.user.get_by_google_id(db, google_id=google_id)
   if not user:
       raise HTTPException(status_code=404, detail="User not found")
   
   updated_user = crud.user.update(db=db, db_obj=user, obj_in=user_update)
   return updated_user

# ============= SCHEME OF WORK ENDPOINTS =============

@app.post("/api/schemes", response_model=schemas.ResponseWrapper, tags=["Schemes"])
async def create_scheme(
   scheme: schemas.SchemeOfWorkCreate,
   user_google_id: str = Query(..., description="User's Google ID"),
   db: Session = Depends(get_db)
):
   """Create a new scheme of work"""
   try:
       logger.info(f"Creating scheme for user: {user_google_id}")
       logger.info(f"Scheme data: {scheme.dict()}")
       # Get user by Google ID
       user = crud.user.get_by_google_id(db, google_id=user_google_id)
       if not user:
           raise HTTPException(status_code=404, detail="User not found. Please ensure user is created first.")
       logger.info(f"Found user: {user.id} - {user.email}")
       # Create scheme data
       scheme_data = scheme.dict()
       scheme_data["user_id"] = user.id
       logger.info(f"Creating scheme with data: {scheme_data}")
       db_scheme = crud.scheme.create(db=db, obj_in=scheme_data)
       logger.info(f"Scheme created successfully: {db_scheme.id}")
       return schemas.ResponseWrapper(
           success=True,
           message="Scheme created successfully",
           data=schemas.SchemeOfWork.model_validate(db_scheme)
       )
   except HTTPException as he:
       logger.error(f"HTTP Exception: {he.detail}")
       return schemas.ResponseWrapper(
           success=False,
           message=he.detail,
           data=None
       )
   except Exception as e:
       logger.error(f"Error creating scheme: {type(e).__name__}: {str(e)}")
       logger.exception("Full exception details:")
       return schemas.ResponseWrapper(
           success=False,
           message=f"Failed to create scheme: {type(e).__name__}: {str(e)}",
           data=None
       )

@app.get("/api/schemes", response_model=schemas.ResponseWrapper, tags=["Schemes"])
async def get_user_schemes(
   user_google_id: str = Query(..., description="User's Google ID"),
   status: Optional[str] = Query(None, description="Filter by status"),
   skip: int = Query(0, ge=0, description="Number of schemes to skip"),
   limit: int = Query(100, ge=1, le=100, description="Number of schemes to return"),
   db: Session = Depends(get_db)
):
   try:
       user = crud.user.get_by_google_id(db, google_id=user_google_id)
       if not user:
           raise HTTPException(status_code=404, detail="User not found")
       schemes = crud.scheme.get_by_user(
           db=db, 
           user_id=user.id, 
           status=status, 
           skip=skip, 
           limit=limit
       )
       return schemas.ResponseWrapper(
           success=True,
           message="Schemes retrieved successfully",
           data=[schemas.SchemeOfWork.model_validate(s) for s in schemes],
           total=len(schemes)
       )
   except Exception as e:
       return schemas.ResponseWrapper(
           success=False,
           message=str(e),
           data=None
       )

@app.get("/api/schemes/{scheme_id}", response_model=schemas.ResponseWrapper, tags=["Schemes"])
async def get_scheme(
   scheme_id: int = Path(..., description="Scheme ID"),
   user_google_id: str = Query(..., description="User's Google ID"),
   db: Session = Depends(get_db)
):
    try:
        logger.info(f"🔍 Getting scheme {scheme_id} for user: {user_google_id}")
        user = get_or_create_user(db, user_google_id)
        if not user:
            return schemas.ResponseWrapper(
                success=False,
                message=f"User not found and could not be created. Identifier: {user_google_id}",
                data=None
            )
        logger.info(f"✅ Found user: {user.email} (ID: {user.id})")
        scheme = db.query(models.SchemeOfWork).options(
            joinedload(models.SchemeOfWork.form_grade),
            joinedload(models.SchemeOfWork.term),
            joinedload(models.SchemeOfWork.school_level),
            joinedload(models.SchemeOfWork.subject)
        ).filter(models.SchemeOfWork.id == scheme_id).first()
        if not scheme:
            return schemas.ResponseWrapper(
                success=False,
                message="Scheme not found. Please select a valid scheme.",
                data=None
            )
        if scheme.user_id != user.id:
            logger.warning(f"⚠️ Scheme belongs to user {scheme.user_id} but requested by user {user.id}")
            # For debugging, let's still return the scheme but with a warning
            # In production, you'd want to enforce this strictly
        
        # Validate that scheme has required subject_id
        if not scheme.subject_id:
            logger.error(f"❌ Scheme {scheme_id} is missing subject_id")
            return schemas.ResponseWrapper(
                success=False,
                message="This scheme is incomplete (missing subject information). Please create a new scheme.",
                data=None
            )
        scheme_data = {
            "id": scheme.id,
            "school_name": scheme.school_name,
            "subject_name": scheme.subject_name,
            "subject_id": scheme.subject_id,  # Add missing subject_id field
            "school_level_id": scheme.school_level_id,  # Add missing foreign key fields
            "form_grade_id": scheme.form_grade_id,
            "term_id": scheme.term_id,
            "form_grade": scheme.form_grade.name if scheme.form_grade else "Unknown Grade",
            "form_grade_name": scheme.form_grade.name if scheme.form_grade else "Unknown Grade",
            "term": scheme.term.name if scheme.term else "Unknown Term",
            "term_name": scheme.term.name if scheme.term else "Unknown Term",
            "academic_year": str(scheme.created_at.year) if scheme.created_at else "2024",
            "status": scheme.status,
            "progress": scheme.progress,
            "content": scheme.content,
            "scheme_metadata": scheme.scheme_metadata,
            "generated_content": scheme.generated_content,
            "ai_model_used": scheme.ai_model_used,
            "generation_metadata": scheme.generation_metadata,
            "generation_date": scheme.generation_date.isoformat() if scheme.generation_date else None,
            "generation_version": scheme.generation_version,
            "is_ai_generated": scheme.is_ai_generated,
            "user_id": scheme.user_id,
            "created_at": scheme.created_at.isoformat() if scheme.created_at else None,
            "updated_at": scheme.updated_at.isoformat() if scheme.updated_at else None,
        }
        logger.info(f"✅ Returning scheme data: {scheme_data}")
        return schemas.ResponseWrapper(
            success=True,
            message="Scheme retrieved successfully",
            data=scheme_data
        )
    except Exception as e:
        logger.error(f"❌ Error getting scheme {scheme_id}: {str(e)}", exc_info=True)
        return schemas.ResponseWrapper(
            success=False,
            message=f"An unexpected error occurred: {str(e)}",
            data=None
        )

@app.put("/api/schemes/{scheme_id}", response_model=schemas.ResponseWrapper, tags=["Schemes"])
async def update_scheme(
   scheme_update: schemas.SchemeOfWorkUpdate,
   scheme_id: int = Path(..., description="Scheme ID"),
   user_google_id: str = Query(..., description="User's Google ID"),
   db: Session = Depends(get_db)
):
   try:
       user = crud.user.get_by_google_id(db, google_id=user_google_id)
       if not user:
           raise HTTPException(status_code=404, detail="User not found")
       scheme = crud.scheme.get(db=db, id=scheme_id)
       if not scheme:
           raise HTTPException(status_code=404, detail="Scheme not found")
       if scheme.user_id != user.id:
           raise HTTPException(status_code=403, detail="Not authorized to update this scheme")
       updated_scheme = crud.scheme.update(db=db, db_obj=scheme, obj_in=scheme_update)
       return schemas.ResponseWrapper(
           success=True,
           message="Scheme updated successfully",
           data=schemas.SchemeOfWork.model_validate(updated_scheme)
       )
   except Exception as e:
       return schemas.ResponseWrapper(
           success=False,
           message=str(e),
           data=None
       )

@app.delete("/api/schemes/{scheme_id}", response_model=schemas.ResponseWrapper, tags=["Schemes"])
async def delete_scheme(
   scheme_id: int = Path(..., description="Scheme ID"),
   user_google_id: str = Query(..., description="User's Google ID"),
   db: Session = Depends(get_db)
):
   try:
       user = crud.user.get_by_google_id(db, google_id=user_google_id)
       if not user:
           raise HTTPException(status_code=404, detail="User not found")
       scheme = crud.scheme.get(db=db, id=scheme_id)
       if not scheme:
           raise HTTPException(status_code=404, detail="Scheme not found")
       if scheme.user_id != user.id:
           raise HTTPException(status_code=403, detail="Not authorized to delete this scheme")
       crud.scheme.remove(db=db, id=scheme_id)
       return schemas.ResponseWrapper(
           success=True,
           message="Scheme deleted successfully",
           data=None
       )
   except Exception as e:
       return schemas.ResponseWrapper(
           success=False,
           message=str(e),
           data=None
       )

# ============= DASHBOARD STATS ENDPOINT =============

@app.get("/api/dashboard/stats", tags=["Dashboard"])
async def get_dashboard_stats(
   user_google_id: str = Query(..., description="User's Google ID"),
   db: Session = Depends(get_db)
):
   """Get user dashboard statistics"""
   user = crud.user.get_by_google_id(db, google_id=user_google_id)
   if not user:
       raise HTTPException(status_code=404, detail="User not found")
   
   # Get scheme statistics
   total_schemes = crud.scheme.count_by_user(db=db, user_id=user.id)
   completed_schemes = crud.scheme.count_by_user_and_status(db=db, user_id=user.id, status="completed")
   active_schemes = crud.scheme.count_by_user_and_status(db=db, user_id=user.id, status="in-progress")
   
   # Get lesson plan count
   total_lessons = crud.lesson_plan.count_by_user(db=db, user_id=user.id)
   
   return {
       "success": True,
       "data": {
           "total_schemes": total_schemes,
           "completed_schemes": completed_schemes,
           "active_schemes": active_schemes,
           "total_lessons": total_lessons,
           "completion_rate": round((completed_schemes / total_schemes * 100) if total_schemes > 0 else 0, 1)
       }
   }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Welcome to EDUScheme Pro API",
        "version": "1.0.0",
        "description": "AI-powered curriculum planning and content management",
        "docs": "/docs",
        "health": "/health"
    }

# ============= SCHOOL SYSTEM ENDPOINTS FOR FRONTEND =============

@app.get("/api/school-levels", tags=["School System"])
async def get_school_levels(
    include_relations: bool = Query(True, description="Include forms and terms"),
    db: Session = Depends(get_db)
):
    """Get all school levels with their forms, grades, and terms"""
    try:
        if include_relations:
            # Use the enhanced CRUD method to get relations
            school_levels_data = crud.school_level.get_all_with_relations(db)
            return {
                "success": True,
                "data": school_levels_data,
                "count": len(school_levels_data)
            }
        else:
            school_levels = crud.school_level.get_multi(db)
            return {
                "success": True,
                "data": [schemas.SchoolLevel.model_validate(sl) for sl in school_levels],
                "count": len(school_levels)
            }
    except Exception as e:
        logger.error(f"Error fetching school levels: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch school levels")

@app.get("/api/subjects/by-term/{term_id}", tags=["Subjects"])
async def get_subjects_by_term(
    term_id: int = Path(..., description="Term ID"),
    db: Session = Depends(get_db)
):
    """Get all subjects for a specific term"""
    try:
        subjects = crud.subject.get_by_term(db=db, term_id=term_id)
        return {
            "success": True,
            "data": [schemas.Subject.model_validate(s) for s in subjects],
            "count": len(subjects)
        }
    except Exception as e:
        logger.error(f"Error fetching subjects for term {term_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch subjects")

# ================== ADMIN API ROUTES ==================

# School Levels Endpoints
@app.post("/api/v1/admin/school-levels/", response_model=schemas.ResponseWrapper)
def create_school_level(
    school_level: schemas.SchoolLevelCreate,
    db: Session = Depends(get_db)
):
    """Create a new school level (Primary, Secondary, High School, etc.)"""
    try:
        print(f"Creating school level with data: {school_level}")
        
        # Check if code is unique within school
        existing = crud.school_level.get_by_code(
            db=db, code=school_level.code, school_id=school_level.school_id
        )
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"School level with code '{school_level.code}' already exists in this school"
            )
        
        db_school_level = crud.school_level.create(db=db, obj_in=school_level)
        print(f"Successfully created: {db_school_level}")
        
        return schemas.ResponseWrapper(
            message="School level created successfully",
            data=schemas.SchoolLevel.model_validate(db_school_level)
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating school level: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/admin/school-levels/debug/", response_model=schemas.ResponseWrapper)
def debug_create_school_level(
    request_data: dict,
    db: Session = Depends(get_db)
):
    """Debug endpoint to see what data we're receiving"""
    try:
        print("=== DEBUG: Received data ===")
        print(f"Request data: {request_data}")
        print(f"Request data type: {type(request_data)}")
        
        # Try to create the schema
        try:
            school_level_data = schemas.SchoolLevelCreate(**request_data)
            print(f"Schema validation successful: {school_level_data}")
        except Exception as schema_error:
            print(f"Schema validation error: {schema_error}")
            return schemas.ResponseWrapper(
                success=False,
                message=f"Schema validation failed: {str(schema_error)}",
                data=None
            )
        
        # Try to create in database
        try:
            db_school_level = crud.school_level.create(db=db, obj_in=school_level_data)
            print(f"Database creation successful: {db_school_level}")
            
            return schemas.ResponseWrapper(
                message="School level created successfully (debug)",
                data=db_school_level
            )
        except Exception as db_error:
            print(f"Database error: {db_error}")
            return schemas.ResponseWrapper(
                success=False,
                message=f"Database error: {str(db_error)}",
                data=None
            )
            
    except Exception as e:
        print(f"General error: {e}")
        return schemas.ResponseWrapper(
            success=False,
            message=f"General error: {str(e)}",
            data=None
        )

@app.get("/api/v1/admin/school-levels/", response_model=schemas.ResponseWrapper)
def list_school_levels(
    school_id: Optional[int] = Query(None),
    include_inactive: bool = Query(True, description="Include inactive school levels"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """List all school levels, optionally filtered by school"""
    try:
        if school_id:
            school_levels = crud.school_level.get_by_school(
                db=db, 
                school_id=school_id, 
                include_inactive=include_inactive
            )
        else:
            if include_inactive:
                # Get all school levels including inactive
                school_levels = crud.school_level.get_all_including_inactive(
                    db=db, skip=skip, limit=limit
                )
            else:
                # Get only active school levels
                school_levels = crud.school_level.get_multi(
                    db=db, skip=skip, limit=limit, is_active=True
                )
                
        return schemas.ResponseWrapper(
            message="School levels retrieved successfully",
            data=[schemas.SchoolLevel.model_validate(sl) for sl in school_levels],
            total=len(school_levels)
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/admin/school-levels/{school_level_id}", response_model=schemas.ResponseWrapper)
def get_school_level(
    school_level_id: int = Path(..., gt=0),
    include_hierarchy: bool = Query(False),
    db: Session = Depends(get_db)
):
    """Get a single school level by ID, optionally including hierarchy"""
    try:
        if include_hierarchy:
            school_level = crud.school_level.get_with_hierarchy(db=db, school_level_id=school_level_id)
            # You may want to use a nested schema here if you have one
            # For now, fallback to normal
        else:
            school_level = crud.school_level.get(db=db, id=school_level_id)
        if not school_level:
            raise HTTPException(status_code=404, detail="School level not found")
        return schemas.ResponseWrapper(
            message="School level retrieved successfully",
            data=schemas.SchoolLevel.model_validate(school_level)
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/v1/admin/school-levels/{school_level_id}", response_model=schemas.ResponseWrapper)
def update_school_level(
    school_level_update: schemas.SchoolLevelUpdate,
    school_level_id: int = Path(..., gt=0),
    db: Session = Depends(get_db)
):
    """Update a school level"""
    try:
        db_school_level = crud.school_level.get(db=db, id=school_level_id)
        if not db_school_level:
            raise HTTPException(status_code=404, detail="School level not found")
        
        updated_school_level = crud.school_level.update(
            db=db, db_obj=db_school_level, obj_in=school_level_update
        )
        
        return schemas.ResponseWrapper(
            message="School level updated successfully",
            data=schemas.SchoolLevel.model_validate(updated_school_level)
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/v1/admin/school-levels/{school_level_id}", response_model=schemas.ResponseWrapper)
def delete_school_level(
    school_level_id: int = Path(..., gt=0),
    soft_delete: bool = Query(True),
    db: Session = Depends(get_db)
):
    """Delete a school level (soft delete by default)"""
    try:
        if soft_delete:
            school_level = crud.school_level.soft_delete(db=db, id=school_level_id)
        else:
            school_level = crud.school_level.delete(db=db, id=school_level_id)
        
        if not school_level:
            raise HTTPException(status_code=404, detail="School level not found")
        
        return schemas.ResponseWrapper(
            message="School level deleted successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Sections Endpoints
@app.post("/api/v1/admin/sections/", response_model=schemas.ResponseWrapper)
def create_section(
    section: schemas.SectionCreate,
    db: Session = Depends(get_db)
):
    """Create a new section (Lower Primary, Upper Primary, etc.)"""
    try:
        db_section = crud.section.create(db=db, obj_in=section)
        return schemas.ResponseWrapper(
            message="Section created successfully",
            data=schemas.Section.model_validate(db_section)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/admin/sections/", response_model=schemas.ResponseWrapper)
def list_sections(
    school_level_id: Optional[int] = Query(None),
    include_inactive: bool = Query(True, description="Include inactive sections"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """List all sections, optionally filtered by school level"""
    try:
        if school_level_id:
            sections = crud.section.get_by_school_level(
                db=db, 
                school_level_id=school_level_id, 
                include_inactive=include_inactive
            )
        else:
            if include_inactive:
                sections = crud.section.get_multi(db=db, skip=skip, limit=limit)
            else:
                sections = crud.section.get_multi(db=db, skip=skip, limit=limit, is_active=True)
        
        return schemas.ResponseWrapper(
            message="Sections retrieved successfully",
            data=[schemas.Section.model_validate(s) for s in sections],
            total=len(sections)
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/admin/sections/{section_id}", response_model=schemas.ResponseWrapper)
def get_section(
    section_id: int = Path(..., gt=0),
    include_hierarchy: bool = Query(False),
    db: Session = Depends(get_db)
):
    """Get a specific section by ID"""
    try:
        if include_hierarchy:
            section = crud.section.get_with_forms(db=db, section_id=section_id)
        else:
            section = crud.section.get(db=db, id=section_id)
        
        if not section:
            raise HTTPException(status_code=404, detail="Section not found")
        
        return schemas.ResponseWrapper(
            message="Section retrieved successfully",
            data=schemas.Section.model_validate(section)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/v1/admin/sections/{section_id}", response_model=schemas.ResponseWrapper)
def update_section(
    section_update: schemas.SectionUpdate,
    section_id: int = Path(..., gt=0),
    db: Session = Depends(get_db)
):
    """Update a section"""
    try:
        section = crud.section.get(db=db, id=section_id)
        if not section:
            raise HTTPException(status_code=404, detail="Section not found")
        
        updated_section = crud.section.update(db=db, db_obj=section, obj_in=section_update)
        return schemas.ResponseWrapper(
            message="Section updated successfully",
            data=schemas.Section.model_validate(updated_section)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/v1/admin/sections/{section_id}", response_model=schemas.ResponseWrapper)
def delete_section(
    section_id: int = Path(..., gt=0),
    soft_delete: bool = Query(True),
    db: Session = Depends(get_db)
):
    """Delete a section (soft delete by default)"""
    try:
        section = crud.section.get(db=db, id=section_id)
        if not section:
            raise HTTPException(status_code=404, detail="Section not found")
        
        if soft_delete:
            crud.section.soft_delete(db=db, id=section_id)
            message = "Section deactivated successfully"
        else:
            crud.section.delete(db=db, id=section_id)
            message = "Section permanently deleted successfully"
        
        return schemas.ResponseWrapper(message=message)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Forms/Grades Endpoints
@app.post("/api/v1/admin/forms-grades/", response_model=schemas.ResponseWrapper)
def create_form_grade(
    form_grade: schemas.FormGradeCreate,
    db: Session = Depends(get_db)
):
    """Create a new form/grade"""
    try:
        # Check if code is unique within school level
        existing = crud.form_grade.get_by_code(
            db=db, code=form_grade.code, school_level_id=form_grade.school_level_id
        )
        if existing:
            raise HTTPException(
                status_code=400, 
                detail=f"Form/Grade with code '{form_grade.code}' already exists in this school level"
            )
        
        db_form_grade = crud.form_grade.create(db=db, obj_in=form_grade)
        return schemas.ResponseWrapper(
            message="Form/Grade created successfully",
            data=schemas.FormGrade.model_validate(db_form_grade)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/admin/forms-grades/", response_model=schemas.ResponseWrapper)
def list_forms_grades(
    school_level_id: Optional[int] = Query(None),
    include_inactive: bool = Query(False, description="Include inactive forms/grades"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """List all forms/grades, optionally filtered by school level"""
    try:
        if school_level_id:
            forms_grades = crud.form_grade.get_by_school_level(db=db, school_level_id=school_level_id, include_inactive=include_inactive)
        else:
            forms_grades = crud.form_grade.get_multi(db=db, skip=skip, limit=limit)
        
        return schemas.ResponseWrapper(
            message="Forms/Grades retrieved successfully",
            data=[schemas.FormGrade.model_validate(fg) for fg in forms_grades],
            total=len(forms_grades)
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/admin/forms-grades/{form_grade_id}", response_model=schemas.ResponseWrapper)
def get_form_grade(
    form_grade_id: int = Path(..., gt=0),
    db: Session = Depends(get_db)
):
    try:
        form_grade = crud.form_grade.get(db=db, id=form_grade_id)
        if not form_grade:
            raise HTTPException(status_code=404, detail="Form grade not found")
        return schemas.ResponseWrapper(
            message="Form grade retrieved successfully",
            data=schemas.FormGrade.model_validate(form_grade)
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.patch("/api/v1/admin/forms-grades/{form_grade_id}", response_model=schemas.ResponseWrapper)
def update_form_grade(
    form_grade_update: schemas.FormGradeUpdate,
    form_grade_id: int = Path(..., gt=0),
    db: Session = Depends(get_db)
):
    """Update a form/grade (partial update)"""
    try:
        db_form_grade = crud.form_grade.get(db=db, id=form_grade_id)
        if not db_form_grade:
            raise HTTPException(status_code=404, detail="Form/Grade not found")
        updated_form_grade = crud.form_grade.update(
            db=db, db_obj=db_form_grade, obj_in=form_grade_update
        )
        return schemas.ResponseWrapper(
            message="Form/Grade updated successfully",
            data=schemas.FormGrade.model_validate(updated_form_grade)
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/v1/admin/forms-grades/{form_grade_id}", response_model=schemas.ResponseWrapper)
def delete_form_grade(
    form_grade_id: int = Path(..., gt=0),
    soft_delete: bool = Query(True),
    db: Session = Depends(get_db)
):
    """Delete a form/grade (soft delete by default, permanent if soft_delete is False)"""
    try:
        form_grade = crud.form_grade.get(db=db, id=form_grade_id)
        if not form_grade:
            raise HTTPException(status_code=404, detail="Form/Grade not found")
        if soft_delete:
            crud.form_grade.soft_delete(db=db, id=form_grade_id)
            message = "Form/Grade deactivated successfully"
        else:
            crud.form_grade.delete(db=db, id=form_grade_id)
            message = "Form/Grade permanently deleted successfully"
        return schemas.ResponseWrapper(message=message)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Terms Endpoints
@app.post("/api/v1/admin/terms/", response_model=schemas.ResponseWrapper)
def create_term(
    term: schemas.TermCreate,
    db: Session = Depends(get_db)
):
    """Create a new term"""
    try:
        print(f"Creating term with data: {term}")
        
        # Check if code is unique within form/grade
        existing = crud.term.get_by_code(
            db=db, code=term.code, form_grade_id=term.form_grade_id
        )
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Term with code '{term.code}' already exists in this form/grade"
            )
        
        db_term = crud.term.create(db=db, obj_in=term)
        print(f"Successfully created term: {db_term}")
        
        return schemas.ResponseWrapper(
            message="Term created successfully",
            data=schemas.Term.model_validate(db_term)
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating term: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/admin/terms/", response_model=schemas.ResponseWrapper)
def list_terms(
    form_grade_id: Optional[int] = Query(None),
    include_inactive: bool = Query(False, description="Include inactive terms"),
    current_only: bool = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """List all terms, with various filters"""
    try:
        print(f"Listing terms with filters: form_grade_id={form_grade_id}, include_inactive={include_inactive}")
        
        if form_grade_id:
            terms = crud.term.get_by_form_grade(db=db, form_grade_id=form_grade_id, include_inactive=include_inactive)
        elif current_only:
            terms = crud.term.get_current_terms(db=db)
        else:
            if include_inactive:
                terms = crud.term.get_multi(db=db, skip=skip, limit=limit)
            else:
                terms = crud.term.get_multi(db=db, skip=skip, limit=limit, is_active=True)
        
        print(f"Found {len(terms)} terms")
        
        return schemas.ResponseWrapper(
            message="Terms retrieved successfully",
            data=[schemas.Term.model_validate(t) for t in terms],
            total=len(terms)
        )
    except Exception as e:
        print(f"Error listing terms: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/admin/terms/{term_id}", response_model=schemas.ResponseWrapper)
def get_term(
    term_id: int = Path(..., gt=0),
    db: Session = Depends(get_db)
):
    """Get a single term by ID"""
    try:
        print(f"Getting term with ID: {term_id}")
        
        term = crud.term.get(db=db, id=term_id)
        if not term:
            raise HTTPException(status_code=404, detail="Term not found")
            
        return schemas.ResponseWrapper(
            message="Term retrieved successfully",
            data=schemas.Term.model_validate(term)
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting term: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/v1/admin/terms/{term_id}", response_model=schemas.ResponseWrapper)
def update_term(
    term_update: schemas.TermUpdate,
    term_id: int = Path(..., gt=0),
    db: Session = Depends(get_db)
):
    """Update a term"""
    try:
        print(f"Updating term {term_id} with data: {term_update}")
        
        db_term = crud.term.get(db=db, id=term_id)
        if not db_term:
            raise HTTPException(status_code=404, detail="Term not found")
        
        # If updating code, check uniqueness within form/grade
        if hasattr(term_update, 'code') and term_update.code and term_update.code != db_term.code:
            existing = crud.term.get_by_code(
                db=db, code=term_update.code, form_grade_id=db_term.form_grade_id
            )
            if existing:
                raise HTTPException(
                    status_code=400,
                    detail=f"Term with code '{term_update.code}' already exists in this form/grade"
                )
        
        updated_term = crud.term.update(
            db=db, db_obj=db_term, obj_in=term_update
        )
        
        print(f"Successfully updated term: {updated_term}")
        
        return schemas.ResponseWrapper(
            message="Term updated successfully",
            data=schemas.Term.model_validate(updated_term)
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating term: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/v1/admin/terms/{term_id}", response_model=schemas.ResponseWrapper)
def delete_term(
    term_id: int = Path(..., gt=0),
    soft_delete: bool = Query(True),
    db: Session = Depends(get_db)
):
    """Delete a term (soft delete by default, permanent if soft_delete is False)"""
    try:
        print(f"Deleting term {term_id}, soft_delete={soft_delete}")
        
        term = crud.term.get(db=db, id=term_id)
        if not term:
            raise HTTPException(status_code=404, detail="Term not found")
            
        if soft_delete:
            # Soft delete - mark as inactive
            updated_term = crud.term.soft_delete(db=db, id=term_id)
            if not updated_term:
                raise HTTPException(status_code=404, detail="Term not found for soft delete")
            message = "Term deactivated successfully"
            print(f"Soft deleted term: {updated_term}")
        else:
            # Hard delete - permanently remove
            deleted_term = crud.term.delete(db=db, id=term_id)
            if not deleted_term:
                raise HTTPException(status_code=404, detail="Term not found for deletion")
            message = "Term permanently deleted successfully"
            print(f"Hard deleted term: {deleted_term}")
            
        return schemas.ResponseWrapper(message=message)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting term: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# Subjects Endpoints
@app.post("/api/v1/admin/subjects/", response_model=schemas.ResponseWrapper)
def create_subject(
    subject: schemas.SubjectCreate,
    db: Session = Depends(get_db)
):
    """Create a new subject with color and animation options"""
    try:
        # Check if code is unique within term
        existing = crud.subject.get_by_code(
            db=db, code=subject.code, term_id=subject.term_id
        )
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Subject with code '{subject.code}' already exists in this term"
            )
        
        db_subject = crud.subject.create(db=db, obj_in=subject)
        return schemas.ResponseWrapper(
            message="Subject created successfully",
            data=schemas.Subject.model_validate(db_subject)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/admin/subjects/", response_model=schemas.ResponseWrapper)
def list_subjects(
    term_id: Optional[int] = Query(None),
    include_inactive: bool = Query(False, description="Include inactive subjects"),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """List all subjects with search functionality"""
    try:
        print(f"Listing subjects with filters: term_id={term_id}, include_inactive={include_inactive}")
        
        if term_id:
            # Get subjects for specific term
            if include_inactive:
                # Include both active and inactive subjects
                subjects = db.query(models.Subject).filter(
                    models.Subject.term_id == term_id
                ).order_by(models.Subject.display_order).all()
            else:
                # Only active subjects
                subjects = crud.subject.get_by_term(db=db, term_id=term_id)
        elif search:
            subjects = crud.subject.search_subjects(db=db, query=search)
        else:
            if include_inactive:
                subjects = crud.subject.get_multi(db=db, skip=skip, limit=limit)
            else:
                subjects = crud.subject.get_multi(db=db, skip=skip, limit=limit, is_active=True)
        
        print(f"Found {len(subjects)} subjects")
        
        return schemas.ResponseWrapper(
            message="Subjects retrieved successfully",
            data=[schemas.Subject.model_validate(s) for s in subjects],
            total=len(subjects)
        )
    except Exception as e:
        print(f"Error listing subjects: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/admin/subjects/{subject_id}", response_model=schemas.ResponseWrapper)
def get_subject_by_id(
    subject_id: int = Path(..., gt=0),
    db: Session = Depends(get_db)
):
    """Get a specific subject by ID"""
    try:
        subject = crud.subject.get(db=db, id=subject_id)
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")
        return schemas.ResponseWrapper(
            message="Subject retrieved successfully",
            data=schemas.Subject.model_validate(subject)
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching subject {subject_id}: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/v1/admin/subjects/{subject_id}", response_model=schemas.ResponseWrapper)
def update_subject(
    subject_update: schemas.SubjectUpdate,
    subject_id: int = Path(..., gt=0),
    db: Session = Depends(get_db)
):
    """Update a subject"""
    try:
        print(f"Updating subject {subject_id} with data: {subject_update}")
        
        db_subject = crud.subject.get(db=db, id=subject_id)
        if not db_subject:
            raise HTTPException(status_code=404, detail="Subject not found")
        
        updated_subject = crud.subject.update(
            db=db, db_obj=db_subject, obj_in=subject_update
        )
        
        print(f"Successfully updated subject: {updated_subject}")
        
        return schemas.ResponseWrapper(
            message="Subject updated successfully",
            data=schemas.Subject.model_validate(updated_subject)
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating subject: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/v1/admin/subjects/{subject_id}", response_model=schemas.ResponseWrapper)
def delete_subject(
    subject_id: int = Path(..., gt=0),
    soft_delete: bool = Query(True),
    db: Session = Depends(get_db)
):
    """Delete a subject (soft delete by default, permanent if soft_delete is False)"""
    try:
        print(f"Deleting subject {subject_id}, soft_delete={soft_delete}")
        
        subject = crud.subject.get(db=db, id=subject_id)
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")
            
        if soft_delete:
            updated_subject = crud.subject.soft_delete(db=db, id=subject_id)
            if not updated_subject:
                raise HTTPException(status_code=404, detail="Subject not found for soft delete")
            message = "Subject deactivated successfully"
            print(f"Soft deleted subject: {updated_subject}")
        else:
            deleted_subject = crud.subject.delete(db=db, id=subject_id)
            if not deleted_subject:
                raise HTTPException(status_code=404, detail="Subject not found for deletion")
            message = "Subject permanently deleted successfully"
            print(f"Hard deleted subject: {deleted_subject}")
            
        return schemas.ResponseWrapper(message=message)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting subject: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# Topics Endpoints
@app.post("/api/v1/admin/topics/", response_model=schemas.ResponseWrapper)
def create_topic(
    topic: schemas.TopicCreate,
    db: Session = Depends(get_db)
):
    """Create a new topic"""
    try:
        db_topic = crud.topic.create(db=db, obj_in=topic)
        return schemas.ResponseWrapper(
            message="Topic created successfully",
            data=schemas.Topic.model_validate(db_topic)
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/admin/topics/", response_model=schemas.ResponseWrapper)
def list_topics(
    subject_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """List all topics with search functionality"""
    try:
        if subject_id:
            topics = crud.topic.get_by_subject(db=db, subject_id=subject_id)
        elif search:
            topics = crud.topic.search_topics(db=db, query=search)
        else:
            topics = crud.topic.get_multi(db=db, skip=skip, limit=limit)
        
        return schemas.ResponseWrapper(
            message="Topics retrieved successfully",
            data=[schemas.Topic.model_validate(t) for t in topics],
            total=len(topics)
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/admin/topics/{topic_id}", response_model=schemas.ResponseWrapper)
def get_topic(
    topic_id: int = Path(..., gt=0),
    db: Session = Depends(get_db)
):
    try:
        topic = crud.topic.get(db=db, id=topic_id)
        if not topic:
            raise HTTPException(status_code=404, detail="Topic not found")
        return schemas.ResponseWrapper(
            message="Topic retrieved successfully",
            data=schemas.Topic.model_validate(topic)
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/admin/topics/{topic_id}/subtopics", response_model=schemas.ResponseWrapper)
def get_subtopics_by_topic(
    topic_id: int = Path(..., gt=0),
    include_inactive: bool = Query(False, description="Include inactive subtopics"),
    db: Session = Depends(get_db)
):
    """Get all subtopics for a specific topic"""
    try:
        topic = crud.topic.get(db=db, id=topic_id)
        if not topic:
            raise HTTPException(status_code=404, detail="Topic not found")
        if include_inactive:
            subtopics = db.query(models.Subtopic).filter(
                models.Subtopic.topic_id == topic_id
            ).order_by(models.Subtopic.display_order).all()
        else:
            subtopics = crud.subtopic.get_by_topic(db=db, topic_id=topic_id)
        return schemas.ResponseWrapper(
            message="Subtopics retrieved successfully",
            data=[schemas.Subtopic.model_validate(st) for st in subtopics],
            total=len(subtopics)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/v1/admin/subtopics/{subtopic_id}", response_model=schemas.ResponseWrapper)
def update_subtopic(
    subtopic_update: schemas.SubtopicUpdate,
    subtopic_id: int = Path(..., gt=0),
    db: Session = Depends(get_db)
):
    """Update a subtopic"""
    try:
        db_subtopic = crud.subtopic.get(db=db, id=subtopic_id)
        if not db_subtopic:
            raise HTTPException(status_code=404, detail="Subtopic not found")
        updated_subtopic = crud.subtopic.update(
            db=db, db_obj=db_subtopic, obj_in=subtopic_update
        )
        return schemas.ResponseWrapper(
            message="Subtopic updated successfully",
            data=schemas.Subtopic.model_validate(updated_subtopic)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/v1/admin/subtopics/{subtopic_id}", response_model=schemas.ResponseWrapper)
def delete_subtopic(
    subtopic_id: int = Path(..., gt=0),
    soft_delete: bool = Query(True, description="Soft delete (deactivate) instead of permanent deletion"),
    db: Session = Depends(get_db)
):
    """Delete a subtopic (soft delete by default)"""
    try:
        if soft_delete:
            subtopic = crud.subtopic.soft_delete(db=db, id=subtopic_id)
        else:
            subtopic = crud.subtopic.delete(db=db, id=subtopic_id)
        if not subtopic:
            raise HTTPException(status_code=404, detail="Subtopic not found")
        message = "Subtopic deactivated successfully" if soft_delete else "Subtopic deleted successfully"
        return schemas.ResponseWrapper(message=message)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Subtopics Endpoints
@app.post("/api/v1/admin/subtopics/", response_model=schemas.ResponseWrapper)
def create_subtopic(
    subtopic: schemas.SubtopicCreate,
    db: Session = Depends(get_db)
):
    """Create a new subtopic"""
    try:
        db_subtopic = crud.subtopic.create(db=db, obj_in=subtopic)
        return schemas.ResponseWrapper(
            message="Subtopic created successfully",
            data=schemas.Subtopic.model_validate(db_subtopic)
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/admin/subtopics/", response_model=schemas.ResponseWrapper)
def list_subtopics(
    topic_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    min_lessons: Optional[int] = Query(None, ge=1),
    max_lessons: Optional[int] = Query(None, ge=1),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """List all subtopics with various filters"""
    try:
        if topic_id:
            subtopics = crud.subtopic.get_by_topic(db=db, topic_id=topic_id)
        elif search:
            subtopics = crud.subtopic.search_subtopics(db=db, query=search)
        elif min_lessons is not None and max_lessons is not None:
            subtopics = crud.subtopic.get_by_duration(db=db, min_lessons=min_lessons, max_lessons=max_lessons)
        else:
            subtopics = crud.subtopic.get_multi(db=db, skip=skip, limit=limit)
        
        return schemas.ResponseWrapper(
            message="Subtopics retrieved successfully",
            data=[schemas.Subtopic.model_validate(st) for st in subtopics],
            total=len(subtopics)
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/admin/subtopics/{subtopic_id}", response_model=schemas.ResponseWrapper)
def get_subtopic(
    subtopic_id: int = Path(..., gt=0),
    db: Session = Depends(get_db)
):
    try:
        subtopic = crud.subtopic.get(db=db, id=subtopic_id)
        if not subtopic:
            raise HTTPException(status_code=404, detail="Subtopic not found")
        return schemas.ResponseWrapper(
            message="Subtopic retrieved successfully",
            data=schemas.Subtopic.model_validate(subtopic)
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Utility Endpoints
@app.get("/api/v1/admin/hierarchy/{school_id}", response_model=schemas.ResponseWrapper)
def get_full_hierarchy(
    school_id: int = Path(..., gt=0),
    db: Session = Depends(get_db)
):
    """Get the complete curriculum hierarchy for a school"""
    try:
        hierarchy_data = crud.hierarchy.get_full_hierarchy(db=db, school_id=school_id)
        return schemas.ResponseWrapper(
            message="Hierarchy retrieved successfully",
            data=hierarchy_data
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/admin/statistics/", response_model=schemas.ResponseWrapper)
def get_statistics(
    school_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get curriculum statistics"""
    try:
        stats = crud.hierarchy.get_statistics(db=db, school_id=school_id)
        return schemas.ResponseWrapper(
            message="Statistics retrieved successfully",
            data=stats
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/admin/subject-options/", response_model=schemas.ResponseWrapper)
def get_subject_options():
    """Get available colors, icons, and animations for subjects"""
    try:
        options = {
            "colors": schemas.SubjectColors().colors,
            "icons": schemas.SubjectIcons().icons,
            "animations": [
                {"name": "Bounce", "value": "bounce"},
                {"name": "Pulse", "value": "pulse"},
                {"name": "Shake", "value": "shake"},
                {"name": "Swing", "value": "swing"},
                {"name": "Flash", "value": "flash"},
                {"name": "Fade", "value": "fade"}
            ]
        }
        
        return schemas.ResponseWrapper(
            message="Subject options retrieved successfully",
            data=options
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Bulk Operations
@app.post("/api/v1/admin/bulk/create-structure/", response_model=schemas.ResponseWrapper)
def create_bulk_structure(
    structure_data: dict,
    db: Session = Depends(get_db)
):
    """Create multiple curriculum levels in bulk"""
    try:
        # Implementation for bulk creation
        # This would allow creating entire grade structures at once
        created_items = []
        
        # Example: Create multiple terms for a form/grade
        if "terms" in structure_data:
            for term_data in structure_data["terms"]:
                term = crud.term.create(db=db, obj_in=term_data)
                created_items.append({"type": "term", "data": term})
        
        return schemas.ResponseWrapper(
            message=f"Bulk structure created successfully. {len(created_items)} items created.",
            data=created_items
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============= TIMETABLE ENDPOINTS =============

@app.post("/api/timetables", response_model=schemas.ResponseWrapper, tags=["Timetables"])
async def create_timetable(
    timetable_data: dict,
    user_google_id: str = Query(..., description="User's Google ID"),
    db: Session = Depends(get_db)
):
    """Create a new timetable linked to a scheme"""
    try:
        logger.info(f"Creating timetable for user: {user_google_id}")
        user = get_or_create_user(db, user_google_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found and could not be created")
        scheme_id = timetable_data.get('scheme_id')
        if not scheme_id:
            raise HTTPException(status_code=400, detail="scheme_id is required")
        scheme = crud.scheme.get(db=db, id=scheme_id)
        if not scheme or scheme.user_id != user.id:
            raise HTTPException(status_code=404, detail="Scheme not found or not authorized")
        timetable_id = str(uuid.uuid4())
        db_timetable = models.Timetable(
            id=timetable_id,
            user_id=user.id,
            scheme_id=scheme_id,
            name=timetable_data.get('name', f"{scheme.subject_name} Timetable"),
            description=timetable_data.get('description', f"Timetable for {scheme.subject_name}"),
            selected_topics=timetable_data.get('selected_topics', []),
            selected_subtopics=timetable_data.get('selected_subtopics', []),
            status='draft'
        )
        db.add(db_timetable)
        slots_data = timetable_data.get('slots', [])
        for slot_data in slots_data:
            db_slot = models.TimetableSlot(
                id=str(uuid.uuid4()),
                timetable_id=timetable_id,
                day_of_week=slot_data.get('day_of_week'),
                time_slot=slot_data.get('time_slot'),
                period_number=slot_data.get('period_number'),
                topic_id=slot_data.get('topic_id'),
                subtopic_id=slot_data.get('subtopic_id'),
                lesson_title=slot_data.get('lesson_title'),
                is_double_lesson=slot_data.get('is_double_lesson', False),
                is_evening=slot_data.get('is_evening', False)
            )
            db.add(db_slot)
        db.commit()
        db.refresh(db_timetable)
        logger.info(f"Timetable created successfully: {db_timetable.id}")
        return schemas.ResponseWrapper(
            success=True,
            message="Timetable created successfully",
            data={
                "id": db_timetable.id,
                "name": db_timetable.name,
                "scheme_id": db_timetable.scheme_id,
                "selected_topics": db_timetable.selected_topics,
                "selected_subtopics": db_timetable.selected_subtopics,
                "total_slots": len(slots_data),
                "created_at": db_timetable.created_at.isoformat()
            }
        )
    except HTTPException as he:
        logger.error(f"HTTP Exception: {he.detail}")
        raise he
    except Exception as e:
        logger.error(f"Error creating timetable: {str(e)}")
        db.rollback()
        return schemas.ResponseWrapper(
            success=False,
            message=f"Failed to create timetable: {str(e)}",
            data=None
        )

@app.get("/api/timetables/by-scheme/{scheme_id}", response_model=schemas.ResponseWrapper, tags=["Timetables"])
async def get_timetable_by_scheme(
    scheme_id: int,
    user_google_id: str = Query(..., description="User's Google ID"),
    db: Session = Depends(get_db)
):
    """Get timetable for a specific scheme - frontend compatible"""
    try:
        logger.info(f"🔍 Getting timetable for scheme {scheme_id}, user: {user_google_id}")
        user = get_or_create_user(db, user_google_id)
        if not user:
            return schemas.ResponseWrapper(
                success=False,
                message=f"User not found and could not be created. Identifier: {user_google_id}",
                data=None
            )
        
        timetable = db.query(models.Timetable).filter(
            models.Timetable.scheme_id == scheme_id,
            models.Timetable.is_active == True
        ).first()
        
        if not timetable:
            logger.info(f"⚠️ No timetable found for scheme {scheme_id}, creating mock data")
            # Create comprehensive mock data based on Biology Form 2 Term 1
            mock_data = {
                "id": f"mock_{scheme_id}",
                "name": f"Biology Form 2 Term 1 Timetable",
                "description": "Biology timetable for Form 2 students covering key topics",
                "scheme_id": scheme_id,
                "selected_topics": [
                    {"id": 1, "title": "Cell Biology", "name": "Cell Biology"},
                    {"id": 2, "title": "Nutrition in Plants and Animals", "name": "Nutrition in Plants and Animals"},
                    {"id": 3, "title": "Transport in Plants", "name": "Transport in Plants"}
                ],
                "selected_subtopics": [
                    {"id": 1, "title": "Cell Structure and Function", "name": "Cell Structure and Function", "topic_id": 1},
                    {"id": 2, "title": "Cell Division", "name": "Cell Division", "topic_id": 1},
                    {"id": 3, "title": "Photosynthesis", "name": "Photosynthesis", "topic_id": 2},
                    {"id": 4, "title": "Respiration", "name": "Respiration", "topic_id": 2},
                    {"id": 5, "title": "Water Transport", "name": "Water Transport", "topic_id": 3},
                    {"id": 6, "title": "Mineral Salt Transport", "name": "Mineral Salt Transport", "topic_id": 3}
                ],
                "slots": [
                    {
                        "id": "slot1", "day": "Monday", "day_of_week": "Monday", "time": "08:00-09:00", "time_slot": "08:00-09:00", "period_number": 1,
                        "topic": "Cell Biology", "topic_id": 1, "topic_name": "Cell Biology", "subtopic": "Cell Structure and Function", "subtopic_id": 1, "subtopic_name": "Cell Structure and Function",
                        "lesson_title": "Introduction to Cell Structure", "is_double_lesson": False, "is_evening": False
                    },
                    {
                        "id": "slot2", "day": "Tuesday", "day_of_week": "Tuesday", "time": "10:00-11:00", "time_slot": "10:00-11:00", "period_number": 3,
                        "topic": "Cell Biology", "topic_id": 1, "topic_name": "Cell Biology", "subtopic": "Cell Structure and Function", "subtopic_id": 1, "subtopic_name": "Cell Structure and Function",
                        "lesson_title": "Plant vs Animal Cells", "is_double_lesson": False, "is_evening": False
                    },
                    {
                        "id": "slot3", "day": "Wednesday", "day_of_week": "Wednesday", "time": "09:00-10:00", "time_slot": "09:00-10:00", "period_number": 2,
                        "topic": "Cell Biology", "topic_id": 1, "topic_name": "Cell Biology", "subtopic": "Cell Division", "subtopic_id": 2, "subtopic_name": "Cell Division",
                        "lesson_title": "Mitosis and Meiosis", "is_double_lesson": False, "is_evening": False
                    },
                    {
                        "id": "slot4", "day": "Thursday", "day_of_week": "Thursday", "time": "11:00-12:00", "time_slot": "11:00-12:00", "period_number": 4,
                        "topic": "Nutrition in Plants and Animals", "topic_id": 2, "topic_name": "Nutrition in Plants and Animals", "subtopic": "Photosynthesis", "subtopic_id": 3, "subtopic_name": "Photosynthesis",
                        "lesson_title": "Light and Dark Reactions", "is_double_lesson": False, "is_evening": False
                    },
                    {
                        "id": "slot5", "day": "Friday", "day_of_week": "Friday", "time": "08:00-09:00", "time_slot": "08:00-09:00", "period_number": 1,
                        "topic": "Nutrition in Plants and Animals", "topic_id": 2, "topic_name": "Nutrition in Plants and Animals", "subtopic": "Respiration", "subtopic_id": 4, "subtopic_name": "Respiration",
                        "lesson_title": "Aerobic and Anaerobic Respiration", "is_double_lesson": False, "is_evening": False
                    }
                ],
                "total_slots": 5,
                "total_weeks": 12,
                "total_lessons": 48,
                "created_at": "2025-07-23T00:00:00Z",
                "updated_at": "2025-07-23T00:00:00Z"
            }
            
            return schemas.ResponseWrapper(
                success=True,
                message="No timetable found, using Biology Form 2 Term 1 mock data",
                data=mock_data
            )
        
        # Process real timetable data if exists
        slots = db.query(models.TimetableSlot).filter(
            models.TimetableSlot.timetable_id == timetable.id
        ).all()
        
        timetable_data = {
            "id": timetable.id,
            "name": timetable.name,
            "description": timetable.description,
            "scheme_id": timetable.scheme_id,
            "selected_topics": timetable.selected_topics or [],
            "selected_subtopics": timetable.selected_subtopics or [],
            "slots": [
                {
                    "id": slot.id,
                    "day": slot.day_of_week,
                    "day_of_week": slot.day_of_week,
                    "time": slot.time_slot,
                    "time_slot": slot.time_slot,
                    "period_number": slot.period_number,
                    "topic": slot.topic.title if slot.topic else "Unknown Topic",
                    "topic_id": slot.topic_id,
                    "topic_name": slot.topic.title if slot.topic else "Unknown Topic",
                    "subtopic": slot.subtopic.title if slot.subtopic else "Unknown Subtopic",
                    "subtopic_id": slot.subtopic_id,
                    "subtopic_name": slot.subtopic.title if slot.subtopic else "Unknown Subtopic",
                    "lesson_title": slot.lesson_title,
                    "is_double_lesson": slot.is_double_lesson,
                    "is_evening": slot.is_evening
                } for slot in slots
            ],
            "total_slots": len(slots),
            "total_weeks": 12,
            "total_lessons": len(slots),
            "created_at": timetable.created_at.isoformat() if timetable.created_at else None,
            "updated_at": timetable.updated_at.isoformat() if timetable.updated_at else None
        }
        
        return schemas.ResponseWrapper(
            success=True,
            message="Timetable retrieved successfully",
            data=timetable_data
        )
        
    except Exception as e:
        logger.error(f"❌ Error getting timetable: {str(e)}")
        return schemas.ResponseWrapper(
            success=False,
            message=f"Failed to get timetable: {str(e)}",
            data=None
        )

@app.put("/api/timetables/{timetable_id}", response_model=schemas.ResponseWrapper, tags=["Timetables"])
async def update_timetable(
    timetable_id: str,
    timetable_data: dict,
    user_google_id: str = Query(..., description="User's Google ID"),
    db: Session = Depends(get_db)
):
    """Update existing timetable"""
    try:
        user = get_or_create_user(db, user_google_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found and could not be created")
        timetable = db.query(models.Timetable).filter(
            models.Timetable.id == timetable_id,
            models.Timetable.user_id == user.id
        ).first()
        if not timetable:
            raise HTTPException(status_code=404, detail="Timetable not found")
        if 'selected_topics' in timetable_data:
            timetable.selected_topics = timetable_data['selected_topics']
        if 'selected_subtopics' in timetable_data:
            timetable.selected_subtopics = timetable_data['selected_subtopics']
        if 'name' in timetable_data:
            timetable.name = timetable_data['name']
        if 'description' in timetable_data:
            timetable.description = timetable_data['description']
        timetable.updated_at = datetime.utcnow()
        if 'slots' in timetable_data:
            db.query(models.TimetableSlot).filter(
                models.TimetableSlot.timetable_id == timetable_id
            ).delete()
            for slot_data in timetable_data['slots']:
                db_slot = models.TimetableSlot(
                    id=str(uuid.uuid4()),
                    timetable_id=timetable_id,
                    day_of_week=slot_data.get('day_of_week'),
                    time_slot=slot_data.get('time_slot'),
                    period_number=slot_data.get('period_number'),
                    topic_id=slot_data.get('topic_id'),
                    subtopic_id=slot_data.get('subtopic_id'),
                    lesson_title=slot_data.get('lesson_title'),
                    is_double_lesson=slot_data.get('is_double_lesson', False),
                    is_evening=slot_data.get('is_evening', False)
                )
                db.add(db_slot)
        db.commit()
        db.refresh(timetable)
        return schemas.ResponseWrapper(
            success=True,
            message="Timetable updated successfully",
            data={
                "id": timetable.id,
                "updated_at": timetable.updated_at.isoformat()
            }
        )
    except HTTPException as he:
        logger.error(f"HTTP Exception: {he.detail}")
        raise he
    except Exception as e:
        logger.error(f"Error updating timetable: {str(e)}")
        db.rollback()
        return schemas.ResponseWrapper(
            success=False,
            message=f"Failed to update timetable: {str(e)}",
            data=None
        )

@app.post("/api/schemes/generate", response_model=schemas.ResponseWrapper, tags=["Schemes"])
async def generate_scheme_of_work(
    generation_data: dict,
    user_google_id: str = Query(..., description="User's Google ID"),
    db: Session = Depends(get_db)
):
    """Generate scheme of work using AI with Biology Form 2 Term 1 context"""
    try:
        logger.info(f"🔍 Generating scheme for user: {user_google_id}")
        user = get_or_create_user(db, user_google_id)
        if not user:
            return schemas.ResponseWrapper(
                success=False,
                message=f"User not found and could not be created. Identifier: {user_google_id}",
                data=None
            )
        
        # Extract context and ensure Biology Form 2 Term 1 defaults
        context = generation_data.get("context", {})
        
        # Enhance context with Biology Form 2 Term 1 specifics
        enhanced_context = {
            "subject_name": "Biology",
            "form_grade": "Form 2", 
            "term": "Term 1",
            "school_level": "Secondary",
            "academic_year": "2025",
            "total_teaching_periods": 48,
            "total_weeks": 12,
            "school_name": context.get("school_name", "Mangu High School"),
            **context  # Override with any provided context
        }
        
        config = generation_data.get("generation_config", generation_data.get("config", {
            "style": "detailed",
            "curriculum_standard": "KICD",
            "language_complexity": "intermediate"
        }))
        
        logger.info(f"✅ User found: {user.email}, generating Biology Form 2 Term 1 scheme...")
        logger.info(f"Context: {enhanced_context}")
        
        try:
            ai_service = GroqAIService()
            result = ai_service.generate_scheme_of_work(context=enhanced_context, config=config)
            
            if isinstance(result, dict) and "scheme_content" in result:
                scheme_content = result["scheme_content"]
                weeks_data = scheme_content.get("weeks", [])
                
                # Ensure we have exactly 12 weeks
                if len(weeks_data) != 12:
                    logger.warning(f"Generated {len(weeks_data)} weeks instead of 12, adjusting...")
                
                return schemas.ResponseWrapper(
                    success=True,
                    message="Biology Form 2 Term 1 scheme generated successfully",
                    data={
                        "weeks": weeks_data,
                        "metadata": result.get("metadata", {}),
                        "scheme_header": scheme_content.get("scheme_header", {})
                    }
                )
            else:
                logger.warning("Invalid AI service response format, using fallback")
                # Create fallback response
                ai_service = GroqAIService()
                fallback_result = ai_service._create_fallback_scheme(enhanced_context)
                scheme_content = fallback_result["scheme_content"]
                
                return schemas.ResponseWrapper(
                    success=True,
                    message="Biology Form 2 Term 1 scheme generated using template",
                    data={
                        "weeks": scheme_content["weeks"],
                        "metadata": fallback_result.get("metadata", {}),
                        "scheme_header": scheme_content.get("scheme_header", {})
                    }
                )
                
        except Exception as ai_error:
            logger.error(f"AI service error: {str(ai_error)}")
            # Return Biology-specific fallback
            ai_service = GroqAIService()
            fallback_result = ai_service._create_fallback_scheme(enhanced_context)
            scheme_content = fallback_result["scheme_content"]
            
            return schemas.ResponseWrapper(
                success=True,
                message="Biology Form 2 Term 1 scheme generated using fallback template",
                data={
                    "weeks": scheme_content["weeks"],
                    "metadata": fallback_result.get("metadata", {}),
                    "scheme_header": scheme_content.get("scheme_header", {})
                }
            )
            
    except Exception as e:
        logger.error(f"Generation error: {str(e)}")
        return schemas.ResponseWrapper(
            success=False,
            message=f"Generation failed: {str(e)}",
            data=None
        )

@app.put("/api/schemes/{scheme_id}/content", response_model=schemas.ResponseWrapper, tags=["Schemes"])
async def save_generated_scheme_content(
    scheme_id: int,
    content_data: dict,
    user_google_id: str = Query(..., description="User's Google ID"),
    db: Session = Depends(get_db)
):
    """Save generated scheme content to database"""
    try:
        user = crud.user.get_by_google_id(db, google_id=user_google_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        scheme = crud.scheme.get(db=db, id=scheme_id)
        if not scheme or scheme.user_id != user.id:
            raise HTTPException(status_code=404, detail="Scheme not found")
        scheme.generated_content = content_data.get("generated_content")
        scheme.ai_model_used = content_data.get("ai_model_used", "groq-llama")
        scheme.generation_date = datetime.utcnow()
        scheme.is_ai_generated = True
        scheme.generation_version = getattr(scheme, 'generation_version', 0) + 1
        scheme.status = "completed"
        db.commit()
        return schemas.ResponseWrapper(
            success=True,
            message="Scheme content saved successfully",
            data={"scheme_id": scheme_id, "version": scheme.generation_version}
        )
    except Exception as e:
        logger.error(f"Save scheme content error: {str(e)}")
        return schemas.ResponseWrapper(
            success=False,
            message=f"Save failed: {str(e)}",
            data=None
        )

@app.post("/api/schemes/export", tags=["Schemes"])
async def export_scheme(
    export_data: dict,
    user_google_id: str = Query(..., description="User's Google ID"),
    db: Session = Depends(get_db)
):
    """Export scheme to PDF or Word format"""
    try:
        user = crud.user.get_by_google_id(db, google_id=user_google_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        # TODO: Implement export functionality
        # This would use libraries like reportlab for PDF or python-docx for Word
        return schemas.ResponseWrapper(
            success=False,
            message="Export functionality coming soon",
            data=None
        )
    except Exception as e:
        logger.error(f"Export error: {str(e)}")
        return schemas.ResponseWrapper(
            success=False,
            message=f"Export failed: {str(e)}",
            data=None
        )

@app.get("/api/schemes/{scheme_id}/pdf", tags=["Schemes"])
async def download_scheme_pdf(
    scheme_id: int = Path(..., description="Scheme ID"),
    user_google_id: str = Query(..., description="User's Google ID"),
    db: Session = Depends(get_db)
):
    """Download scheme of work as PDF"""
    try:
        logger.info(f"📄 Generating PDF for scheme {scheme_id}, user: {user_google_id}")
        
        # Get user
        user = get_or_create_user(db, user_google_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get scheme
        scheme = crud.scheme.get(db=db, id=scheme_id)
        if not scheme:
            raise HTTPException(status_code=404, detail="Scheme not found")
        
        if scheme.user_id != user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this scheme")
        
        # Get scheme content
        pdf_content = scheme.generated_content
        
        if not pdf_content:
            # Create basic PDF content from scheme data
            pdf_content = {
                "scheme_header": {
                    "school_name": scheme.school_name,
                    "subject": scheme.subject_name,
                    "form_grade": scheme.form_grade.name if scheme.form_grade else "Unknown Form",
                    "term": scheme.term.name if scheme.term else "Unknown Term",
                    "academic_year": "2025",
                    "total_weeks": 12,
                    "total_lessons": 36
                },
                "weeks": [
                    {
                        "week_number": i,
                        "theme": f"Week {i} - {scheme.subject_name} Learning",
                        "learning_focus": f"This scheme contains {scheme.subject_name} content for week {i}.",
                        "lessons": [
                            {
                                "lesson_number": 1,
                                "topic_subtopic": f"{scheme.subject_name} - Week {i} Content",
                                "specific_objectives": [f"To learn {scheme.subject_name} concepts for week {i}"],
                                "teaching_learning_activities": ["Q/A session", "Interactive discussion", "Practical activity"],
                                "materials_resources": [f"{scheme.subject_name} textbook", "Charts and visual aids"],
                                "references": f"{scheme.subject_name} textbook"
                            }
                        ]
                    }
                    for i in range(1, 13)
                ]
            }
        
        # Generate PDF using PDF service
        from services.pdf_service import PDFService
        pdf_service = PDFService()
        
        pdf_bytes = pdf_service.generate_scheme_pdf(pdf_content, {
            "scheme_id": scheme_id,
            "school_name": scheme.school_name,
            "subject_name": scheme.subject_name,
            "form_grade": scheme.form_grade.name if scheme.form_grade else "Unknown Form",
            "term": scheme.term.name if scheme.term else "Unknown Term",
            "academic_year": "2025"
        })
        
        # Return PDF as download
        from fastapi.responses import StreamingResponse
        import io
        
        filename = f"{scheme.subject_name}_{scheme.form_grade.name if scheme.form_grade else 'Form'}_{scheme.term.name if scheme.term else 'Term'}_Scheme.pdf"
        
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logger.error(f"❌ Error generating PDF: {str(e)}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")

# Development endpoints (remove in production)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )