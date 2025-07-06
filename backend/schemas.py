# backend/schemas.py
from pydantic import BaseModel, Field, field_validator, EmailStr
from typing import List, Optional, Dict, Any, Union
from datetime import datetime

# ============= BASE SCHEMAS =============

class BaseSchema(BaseModel):
    """Base schema with common configuration"""
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

# ============= SCHOOL LEVEL SCHEMAS =============

class SchoolLevelBase(BaseSchema):
    name: str = Field(..., min_length=1, max_length=100, description="School level name")
    code: str = Field(..., min_length=1, max_length=20, description="School level code")
    display_order: int = Field(default=0, ge=0, description="Display order")
    school_id: Optional[int] = Field(None, description="Associated school ID")
    is_active: bool = Field(default=True, description="Whether the school level is active")

class SchoolLevelCreate(SchoolLevelBase):
    # Temporary fix: make school_id optional with default
    school_id: int = Field(default=1, description="Associated school ID")

class SchoolLevelUpdate(BaseSchema):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    code: Optional[str] = Field(None, min_length=1, max_length=20)
    display_order: Optional[int] = Field(None, ge=0)
    school_id: Optional[int] = None
    is_active: Optional[bool] = None

class SchoolLevel(SchoolLevelBase):
    id: int
    created_at: datetime
    updated_at: datetime

# ============= FORM/GRADE SCHEMAS =============

class FormGradeBase(BaseSchema):
    name: str = Field(..., min_length=1, max_length=100, description="Form/Grade name")
    code: str = Field(..., min_length=1, max_length=20, description="Form/Grade code")
    display_order: int = Field(default=0, ge=0, description="Display order")
    school_level_id: int = Field(..., gt=0, description="Associated school level ID")
    is_active: bool = Field(default=True, description="Whether the form/grade is active")

class FormGradeCreate(FormGradeBase):
    pass

class FormGradeUpdate(BaseSchema):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    code: Optional[str] = Field(None, min_length=1, max_length=20)
    display_order: Optional[int] = Field(None, ge=0)
    school_level_id: Optional[int] = Field(None, gt=0)
    is_active: Optional[bool] = None

class FormGrade(FormGradeBase):
    id: int
    created_at: datetime
    updated_at: datetime
    school_level: Optional[SchoolLevel] = None

# ============= TERM SCHEMAS =============

class TermBase(BaseSchema):
    name: str = Field(..., min_length=1, max_length=100, description="Term name")
    code: str = Field(..., min_length=1, max_length=20, description="Term code")
    start_date: Optional[datetime] = Field(None, description="Term start date")
    end_date: Optional[datetime] = Field(None, description="Term end date")
    display_order: int = Field(default=0, ge=0, description="Display order")
    form_grade_id: int = Field(..., gt=0, description="Associated form/grade ID")
    is_active: bool = Field(default=True, description="Whether the term is active")

    @field_validator('end_date')
    @classmethod
    def validate_end_date(cls, v, info):
        if v and info.data.get('start_date'):
            if v <= info.data['start_date']:
                raise ValueError('End date must be after start date')
        return v

class TermCreate(TermBase):
    pass

class TermUpdate(BaseSchema):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    code: Optional[str] = Field(None, min_length=1, max_length=20)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    display_order: Optional[int] = Field(None, ge=0)
    form_grade_id: Optional[int] = Field(None, gt=0)
    is_active: Optional[bool] = None

class Term(TermBase):
    id: int
    created_at: datetime
    updated_at: datetime
    form_grade: Optional[FormGrade] = None

# ============= SUBJECT SCHEMAS =============

class SubjectBase(BaseSchema):
    name: str = Field(..., min_length=1, max_length=150, description="Subject name")
    code: str = Field(..., min_length=1, max_length=20, description="Subject code")
    description: Optional[str] = Field(None, description="Subject description")
    color: str = Field(default="#3B82F6", pattern=r"^#[0-9A-Fa-f]{6}$", description="Hex color code")
    icon: str = Field(default="book", min_length=1, max_length=50, description="Icon name")
    animation_type: str = Field(default="bounce", min_length=1, max_length=50, description="Animation type")
    display_order: int = Field(default=0, ge=0, description="Display order")
    term_id: int = Field(..., gt=0, description="Associated term ID")
    is_active: bool = Field(default=True, description="Whether the subject is active")

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(BaseSchema):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    code: Optional[str] = Field(None, min_length=1, max_length=20)
    description: Optional[str] = None
    color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    icon: Optional[str] = Field(None, min_length=1, max_length=50)
    animation_type: Optional[str] = Field(None, min_length=1, max_length=50)
    display_order: Optional[int] = Field(None, ge=0)
    term_id: Optional[int] = Field(None, gt=0)
    is_active: Optional[bool] = None

class Subject(SubjectBase):
    id: int
    created_at: datetime
    updated_at: datetime
    term: Optional[Term] = None

# ============= TOPIC SCHEMAS =============

class TopicBase(BaseSchema):
    title: str = Field(..., min_length=1, max_length=255, description="Topic title")
    description: Optional[str] = Field(None, description="Topic description")
    learning_objectives: Optional[List[str]] = Field(default=[], description="Learning objectives")
    duration_weeks: int = Field(default=1, ge=1, le=52, description="Duration in weeks")
    display_order: int = Field(default=0, ge=0, description="Display order")
    subject_id: int = Field(..., gt=0, description="Associated subject ID")
    is_active: bool = Field(default=True, description="Whether the topic is active")

class TopicCreate(TopicBase):
    pass

class TopicUpdate(BaseSchema):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    learning_objectives: Optional[List[str]] = None
    duration_weeks: Optional[int] = Field(None, ge=1, le=52)
    display_order: Optional[int] = Field(None, ge=0)
    subject_id: Optional[int] = Field(None, gt=0)
    is_active: Optional[bool] = None

class Topic(TopicBase):
    id: int
    created_at: datetime
    updated_at: datetime
    subject: Optional[Subject] = None

# ============= SUBTOPIC SCHEMAS =============

class SubtopicBase(BaseSchema):
    title: str = Field(..., min_length=1, max_length=255, description="Subtopic title")
    content: Optional[str] = Field(None, description="Subtopic content")
    activities: Optional[List[Dict[str, Any]]] = Field(default=[], description="Learning activities")
    assessment_criteria: Optional[List[Dict[str, Any]]] = Field(default=[], description="Assessment criteria")
    resources: Optional[List[Dict[str, Any]]] = Field(default=[], description="Learning resources")
    duration_lessons: int = Field(default=1, ge=1, le=100, description="Duration in lessons")
    display_order: int = Field(default=0, ge=0, description="Display order")
    topic_id: int = Field(..., gt=0, description="Associated topic ID")
    is_active: bool = Field(default=True, description="Whether the subtopic is active")

class SubtopicCreate(SubtopicBase):
    pass

class SubtopicUpdate(BaseSchema):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = None
    activities: Optional[List[Dict[str, Any]]] = None
    assessment_criteria: Optional[List[Dict[str, Any]]] = None
    resources: Optional[List[Dict[str, Any]]] = None
    duration_lessons: Optional[int] = Field(None, ge=1, le=100)
    display_order: Optional[int] = Field(None, ge=0)
    topic_id: Optional[int] = Field(None, gt=0)
    is_active: Optional[bool] = None

class Subtopic(SubtopicBase):
    id: int
    created_at: datetime
    updated_at: datetime
    topic: Optional[Topic] = None

# ============= ADMIN USER SCHEMAS =============

class AdminUserBase(BaseSchema):
    username: str = Field(..., min_length=3, max_length=100, description="Username")
    email: EmailStr = Field(..., description="Email address")
    full_name: Optional[str] = Field(None, max_length=255, description="Full name")
    is_active: bool = Field(default=True, description="Whether the user is active")
    is_superuser: bool = Field(default=False, description="Whether the user is a superuser")

class AdminUserCreate(AdminUserBase):
    password: str = Field(..., min_length=6, description="Password")

class AdminUserUpdate(BaseSchema):
    username: Optional[str] = Field(None, min_length=3, max_length=100)
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, max_length=255)
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=6)

class AdminUser(AdminUserBase):
    id: int
    created_at: datetime
    last_login: Optional[datetime] = None

# ============= NESTED SCHEMAS FOR HIERARCHY =============

class SubtopicWithoutTopic(BaseSchema):
    id: int
    title: str
    content: Optional[str]
    activities: Optional[List[Dict[str, Any]]]
    assessment_criteria: Optional[List[Dict[str, Any]]]
    resources: Optional[List[Dict[str, Any]]]
    duration_lessons: int
    display_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

class TopicWithSubtopics(Topic):
    subtopics: List[SubtopicWithoutTopic] = []

class SubjectWithTopics(Subject):
    topics: List[TopicWithSubtopics] = []

class TermWithSubjects(Term):
    subjects: List[SubjectWithTopics] = []

class FormGradeWithTerms(FormGrade):
    terms: List[TermWithSubjects] = []

class SchoolLevelWithForms(SchoolLevel):
    forms_grades: List[FormGradeWithTerms] = []

# ============= UTILITY SCHEMAS =============

class HierarchyStats(BaseSchema):
    total_school_levels: int
    total_forms_grades: int
    total_terms: int
    total_subjects: int
    total_topics: int
    total_subtopics: int

class SubjectColors(BaseSchema):
    """Predefined color options for subjects"""
    colors: List[Dict[str, str]] = [
        {"name": "Blue", "value": "#3B82F6"},
        {"name": "Green", "value": "#10B981"},
        {"name": "Purple", "value": "#8B5CF6"},
        {"name": "Red", "value": "#EF4444"},
        {"name": "Yellow", "value": "#F59E0B"},
        {"name": "Pink", "value": "#EC4899"},
        {"name": "Indigo", "value": "#6366F1"},
        {"name": "Teal", "value": "#14B8A6"},
        {"name": "Orange", "value": "#F97316"},
        {"name": "Cyan", "value": "#06B6D4"}
    ]

class SubjectIcons(BaseSchema):
    """Predefined icon options for subjects"""
    icons: List[Dict[str, str]] = [
        {"name": "Book", "value": "book"},
        {"name": "Calculator", "value": "calculator"},
        {"name": "Globe", "value": "globe"},
        {"name": "Atom", "value": "atom"},
        {"name": "Palette", "value": "palette"},
        {"name": "Music", "value": "music"},
        {"name": "Trophy", "value": "trophy"},
        {"name": "Heart", "value": "heart"},
        {"name": "Cpu", "value": "cpu"},
        {"name": "Languages", "value": "languages"}
    ]

class SubjectAnimations(BaseSchema):
    """Predefined animation options for subjects"""
    animations: List[Dict[str, str]] = [
        {"name": "Bounce", "value": "bounce"},
        {"name": "Pulse", "value": "pulse"},
        {"name": "Shake", "value": "shake"},
        {"name": "Swing", "value": "swing"},
        {"name": "Flash", "value": "flash"},
        {"name": "Fade", "value": "fade"},
        {"name": "Spin", "value": "spin"},
        {"name": "Wobble", "value": "wobble"}
    ]

class BulkOperationRequest(BaseSchema):
    """Schema for bulk operations"""
    operation_type: str = Field(..., description="Type of bulk operation")
    data: List[Dict[str, Any]] = Field(..., description="Bulk data")
    options: Optional[Dict[str, Any]] = Field(default={}, description="Additional options")

class BulkOperationResult(BaseSchema):
    """Result of bulk operations"""
    success_count: int
    error_count: int
    errors: List[Dict[str, Any]] = []
    created_items: List[Dict[str, Any]] = []

# ============= SEARCH AND FILTER SCHEMAS =============

class SearchRequest(BaseSchema):
    query: str = Field(..., min_length=1, description="Search query")
    filters: Optional[Dict[str, Any]] = Field(default={}, description="Additional filters")
    limit: Optional[int] = Field(default=10, ge=1, le=100, description="Result limit")

class SearchResult(BaseSchema):
    entity_type: str
    entity_id: int
    title: str
    description: Optional[str]
    match_score: float

class GlobalSearchResult(BaseSchema):
    school_levels: List[SearchResult] = []
    forms_grades: List[SearchResult] = []
    terms: List[SearchResult] = []
    subjects: List[SearchResult] = []
    topics: List[SearchResult] = []
    subtopics: List[SearchResult] = []
    total_results: int

# ============= AUTHENTICATION SCHEMAS =============

class LoginRequest(BaseSchema):
    username: str = Field(..., description="Username or email")
    password: str = Field(..., description="Password")

class LoginResponse(BaseSchema):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: AdminUser

class TokenRefreshRequest(BaseSchema):
    refresh_token: str

class PasswordChangeRequest(BaseSchema):
    current_password: str
    new_password: str = Field(..., min_length=6)

# ============= RESPONSE WRAPPER =============

class ResponseWrapper(BaseSchema):
    """Standard API response wrapper"""
    success: bool = True
    message: str = "Operation successful"
    data: Optional[Any] = None
    total: Optional[int] = None
    page: Optional[int] = None
    limit: Optional[int] = None
    errors: Optional[List[str]] = None

# ============= VALIDATION SCHEMAS =============

class ValidationError(BaseSchema):
    field: str
    message: str
    value: Optional[Any] = None

class ValidationResult(BaseSchema):
    is_valid: bool
    errors: List[ValidationError] = []

# ============= PAGINATION SCHEMAS =============

class PaginationParams(BaseSchema):
    page: int = Field(default=1, ge=1, description="Page number")
    limit: int = Field(default=10, ge=1, le=100, description="Items per page")
    sort_by: Optional[str] = Field(None, description="Sort field")
    sort_order: Optional[str] = Field(default="asc", pattern="^(asc|desc)$", description="Sort order")

class PaginatedResponse(BaseSchema):
    items: List[Any]
    total: int
    page: int
    limit: int
    pages: int
    has_next: bool
    has_prev: bool

# ============= EXPORT/IMPORT SCHEMAS =============

class ExportRequest(BaseSchema):
    entity_type: str = Field(..., description="Entity type to export")
    format: str = Field(default="json", pattern="^(json|csv|xlsx)$", description="Export format")
    filters: Optional[Dict[str, Any]] = Field(default={}, description="Export filters")

class ImportRequest(BaseSchema):
    entity_type: str = Field(..., description="Entity type to import")
    data: List[Dict[str, Any]] = Field(..., description="Import data")
    options: Optional[Dict[str, Any]] = Field(default={}, description="Import options")

class ImportResult(BaseSchema):
    total_processed: int
    successful_imports: int
    failed_imports: int
    errors: List[Dict[str, Any]] = []
    warnings: List[Dict[str, Any]] = []

# ============= SYSTEM HEALTH SCHEMAS =============

class HealthCheck(BaseSchema):
    status: str
    timestamp: datetime
    version: str
    database_status: str
    api_status: str

class SystemStats(BaseSchema):
    uptime: str
    memory_usage: Dict[str, Any]
    database_size: str
    active_sessions: int
    api_calls_today: int

# ============= ERROR SCHEMAS =============

class ErrorDetail(BaseSchema):
    code: str
    message: str
    field: Optional[str] = None

class ErrorResponse(BaseSchema):
    success: bool = False
    message: str
    detail: Optional[str] = None
    errors: Optional[List[ErrorDetail]] = None
    timestamp: datetime = Field(default_factory=datetime.now)