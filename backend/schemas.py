# backend/schemas.py
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime

# Base schema with configuration
class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

# ============= RESPONSE WRAPPER =============

class ResponseWrapper(BaseSchema):
    success: bool = Field(default=True, description="Whether the request was successful")
    message: str = Field(..., description="Response message")
    data: Optional[Any] = Field(None, description="Response data")
    total: Optional[int] = Field(None, description="Total count for paginated responses")
    errors: Optional[Dict[str, Any]] = Field(None, description="Error details if any")

# ============= USER SCHEMAS =============

class UserBase(BaseSchema):
    email: EmailStr = Field(..., description="Email address")
    name: str = Field(..., min_length=1, max_length=255, description="Full name")
    picture: Optional[str] = Field(None, max_length=500, description="Profile picture URL")

class UserCreate(UserBase):
    google_id: str = Field(..., description="Google ID")

class UserUpdate(BaseSchema):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    picture: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None

class User(UserBase):
    id: int
    google_id: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None

# ============= SCHEME OF WORK SCHEMAS =============

class SchemeOfWorkBase(BaseSchema):
    school_name: str = Field(..., min_length=1, max_length=255, description="School name")
    subject_name: str = Field(..., min_length=1, max_length=150, description="Subject name")
    status: str = Field(default="draft", description="Scheme status")
    progress: int = Field(default=0, ge=0, le=100, description="Progress percentage")
    content: Optional[Dict[str, Any]] = Field(None, description="Scheme content")
    scheme_metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

class SchemeOfWorkCreate(SchemeOfWorkBase):
    school_level_id: int = Field(..., gt=0, description="School level ID")
    form_grade_id: int = Field(..., gt=0, description="Form/Grade ID")
    term_id: int = Field(..., gt=0, description="Term ID")
    subject_id: Optional[int] = Field(None, gt=0, description="Subject ID")
    due_date: Optional[datetime] = Field(None, description="Due date")

class SchemeOfWorkUpdate(BaseSchema):
    status: Optional[str] = None
    progress: Optional[int] = Field(None, ge=0, le=100)
    content: Optional[Dict[str, Any]] = None
    scheme_metadata: Optional[Dict[str, Any]] = None
    due_date: Optional[datetime] = None

class SchemeOfWork(SchemeOfWorkBase):
    id: int
    user_id: int
    school_level_id: int
    form_grade_id: int
    term_id: int
    subject_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    due_date: Optional[datetime]

# ============= LESSON PLAN SCHEMAS =============

class LessonPlanBase(BaseSchema):
    title: str = Field(..., min_length=1, max_length=255, description="Lesson title")
    content: Optional[Dict[str, Any]] = Field(None, description="Lesson content")
    objectives: Optional[List[str]] = Field(None, description="Learning objectives")
    activities: Optional[List[Dict[str, Any]]] = Field(None, description="Lesson activities")
    resources: Optional[List[str]] = Field(None, description="Required resources")
    assessment: Optional[Dict[str, Any]] = Field(None, description="Assessment methods")
    duration_minutes: int = Field(default=40, ge=1, le=480, description="Lesson duration in minutes")
    lesson_number: int = Field(default=1, ge=1, description="Lesson number in sequence")

class LessonPlanCreate(LessonPlanBase):
    scheme_id: int = Field(..., gt=0, description="Scheme of work ID")
    topic_id: Optional[int] = Field(None, gt=0, description="Topic ID")
    subtopic_id: Optional[int] = Field(None, gt=0, description="Subtopic ID")
    scheduled_date: Optional[datetime] = Field(None, description="Scheduled date")

class LessonPlanUpdate(BaseSchema):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[Dict[str, Any]] = None
    objectives: Optional[List[str]] = None
    activities: Optional[List[Dict[str, Any]]] = None
    resources: Optional[List[str]] = None
    assessment: Optional[Dict[str, Any]] = None
    duration_minutes: Optional[int] = Field(None, ge=1, le=480)
    lesson_number: Optional[int] = Field(None, ge=1)
    scheduled_date: Optional[datetime] = None

class LessonPlan(LessonPlanBase):
    id: int
    user_id: int
    scheme_id: int
    topic_id: Optional[int]
    subtopic_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    scheduled_date: Optional[datetime]

# ============= SCHOOL SCHEMAS =============

class SchoolBase(BaseSchema):
    name: str = Field(..., min_length=1, max_length=255, description="School name")
    code: str = Field(..., min_length=1, max_length=50, description="School code")
    address: Optional[str] = Field(None, description="School address")
    phone: Optional[str] = Field(None, max_length=20, description="Phone number")
    email: Optional[EmailStr] = Field(None, description="School email")
    logo_url: Optional[str] = Field(None, max_length=500, description="Logo URL")
    is_active: bool = Field(default=True, description="Whether the school is active")

class SchoolCreate(SchoolBase):
    pass

class SchoolUpdate(BaseSchema):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    address: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    logo_url: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None

class School(SchoolBase):
    id: int
    created_at: datetime
    updated_at: datetime

# ============= SCHOOL LEVEL SCHEMAS =============

class SchoolLevelBase(BaseSchema):
    name: str = Field(..., min_length=1, max_length=100, description="School level name")
    code: str = Field(..., min_length=1, max_length=20, description="School level code")
    description: Optional[str] = Field(None, description="Description of the school level")
    display_order: int = Field(default=0, ge=0, description="Display order")
    grade_type: str = Field(default="grade", description="Type: 'form' or 'grade'")
    is_active: bool = Field(default=True, description="Whether the school level is active")

class SchoolLevelCreate(SchoolLevelBase):
    school_id: int = Field(default=1, gt=0, description="School ID")

class SchoolLevelUpdate(BaseSchema):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    code: Optional[str] = Field(None, min_length=1, max_length=20)
    description: Optional[str] = None
    display_order: Optional[int] = Field(None, ge=0)
    grade_type: Optional[str] = None
    is_active: Optional[bool] = None
    school_id: Optional[int] = Field(None, gt=0)

class SchoolLevel(SchoolLevelBase):
    id: int
    school_id: int
    created_at: datetime
    updated_at: datetime

# ============= SECTION SCHEMAS =============

class SectionBase(BaseSchema):
    name: str = Field(..., min_length=1, max_length=100, description="Section name")
    description: Optional[str] = Field(None, description="Section description")
    display_order: int = Field(default=0, ge=0, description="Display order")
    is_active: bool = Field(default=True, description="Whether the section is active")

class SectionCreate(SectionBase):
    school_level_id: int = Field(..., gt=0, description="School level ID")

class SectionUpdate(BaseSchema):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    display_order: Optional[int] = Field(None, ge=0)
    school_level_id: Optional[int] = Field(None, gt=0)
    is_active: Optional[bool] = None

class Section(SectionBase):
    id: int
    school_level_id: int
    created_at: datetime
    updated_at: datetime

# ============= FORM GRADE SCHEMAS =============

class FormGradeBase(BaseSchema):
    name: str = Field(..., min_length=1, max_length=100, description="Form/Grade name")
    code: str = Field(..., min_length=1, max_length=20, description="Form/Grade code")
    description: Optional[str] = Field(None, description="Form/Grade description")
    display_order: int = Field(default=0, ge=0, description="Display order")
    is_active: bool = Field(default=True, description="Whether the form/grade is active")

class FormGradeCreate(FormGradeBase):
    school_level_id: int = Field(..., gt=0, description="School level ID")

class FormGradeUpdate(BaseSchema):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    code: Optional[str] = Field(None, min_length=1, max_length=20)
    description: Optional[str] = None
    display_order: Optional[int] = Field(None, ge=0)
    school_level_id: Optional[int] = Field(None, gt=0)
    is_active: Optional[bool] = None

class FormGrade(FormGradeBase):
    id: int
    school_level_id: int
    created_at: datetime
    updated_at: datetime

# ============= TERM SCHEMAS =============

class TermBase(BaseSchema):
    name: str = Field(..., min_length=1, max_length=100, description="Term name")
    code: str = Field(..., min_length=1, max_length=20, description="Term code")
    start_date: Optional[datetime] = Field(None, description="Term start date")
    end_date: Optional[datetime] = Field(None, description="Term end date")
    display_order: int = Field(default=0, ge=0, description="Display order")
    is_active: bool = Field(default=True, description="Whether the term is active")

class TermCreate(TermBase):
    form_grade_id: int = Field(..., gt=0, description="Form/Grade ID")

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
    form_grade_id: int
    created_at: datetime
    updated_at: datetime

# ============= SUBJECT SCHEMAS =============

class SubjectBase(BaseSchema):
    name: str = Field(..., min_length=1, max_length=150, description="Subject name")
    code: str = Field(..., min_length=1, max_length=20, description="Subject code")
    description: Optional[str] = Field(None, description="Subject description")
    color: str = Field(default="#3B82F6", description="Subject color (hex)")
    icon: str = Field(default="book", description="Subject icon")
    animation_type: str = Field(default="bounce", description="Animation type")
    display_order: int = Field(default=0, ge=0, description="Display order")
    is_active: bool = Field(default=True, description="Whether the subject is active")

class SubjectCreate(SubjectBase):
    term_id: int = Field(..., gt=0, description="Term ID")

class SubjectUpdate(BaseSchema):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    code: Optional[str] = Field(None, min_length=1, max_length=20)
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    animation_type: Optional[str] = None
    display_order: Optional[int] = Field(None, ge=0)
    term_id: Optional[int] = Field(None, gt=0)
    is_active: Optional[bool] = None

class Subject(SubjectBase):
    id: int
    term_id: int
    created_at: datetime
    updated_at: datetime

# ============= TOPIC SCHEMAS =============

class TopicBase(BaseSchema):
    title: str = Field(..., min_length=1, max_length=255, description="Topic title")
    description: Optional[str] = Field(None, description="Topic description")
    learning_objectives: Optional[List[str]] = Field(None, description="Learning objectives")
    duration_weeks: int = Field(default=1, ge=1, le=52, description="Duration in weeks")
    display_order: int = Field(default=0, ge=0, description="Display order")
    is_active: bool = Field(default=True, description="Whether the topic is active")

class TopicCreate(TopicBase):
    subject_id: int = Field(..., gt=0, description="Subject ID")

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
    subject_id: int
    created_at: datetime
    updated_at: datetime

# ============= SUBTOPIC SCHEMAS =============

class SubtopicBase(BaseSchema):
    title: str = Field(..., min_length=1, max_length=255, description="Subtopic title")
    content: Optional[str] = Field(None, description="Subtopic content")
    activities: Optional[List[Dict[str, Any]]] = Field(None, description="Learning activities")
    assessment_criteria: Optional[List[Dict[str, Any]]] = Field(None, description="Assessment criteria")
    resources: Optional[List[Dict[str, Any]]] = Field(None, description="Learning resources")
    duration_lessons: int = Field(default=1, ge=1, le=100, description="Duration in lessons")
    display_order: int = Field(default=0, ge=0, description="Display order")
    is_active: bool = Field(default=True, description="Whether the subtopic is active")

class SubtopicCreate(SubtopicBase):
    topic_id: int = Field(..., gt=0, description="Topic ID")

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
    topic_id: int
    created_at: datetime
    updated_at: datetime

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

class SchoolLevelWithHierarchy(SchoolLevel):
    forms_grades: List[FormGradeWithTerms] = []

# ============= UTILITY SCHEMAS =============

class SubjectColors(BaseSchema):
    colors: List[Dict[str, str]] = [
        {"name": "Blue", "value": "#3B82F6"},
        {"name": "Red", "value": "#EF4444"},
        {"name": "Green", "value": "#10B981"},
        {"name": "Yellow", "value": "#F59E0B"},
        {"name": "Purple", "value": "#8B5CF6"},
        {"name": "Pink", "value": "#EC4899"},
        {"name": "Indigo", "value": "#6366F1"},
        {"name": "Orange", "value": "#F97316"},
        {"name": "Teal", "value": "#14B8A6"},
        {"name": "Gray", "value": "#6B7280"}
    ]

class SubjectIcons(BaseSchema):
    icons: List[Dict[str, str]] = [
        {"name": "Book", "value": "book"},
        {"name": "Calculator", "value": "calculator"},
        {"name": "Globe", "value": "globe"},
        {"name": "Microscope", "value": "microscope"},
        {"name": "Palette", "value": "palette"},
        {"name": "Music", "value": "music"},
        {"name": "Dumbbell", "value": "dumbbell"},
        {"name": "Computer", "value": "computer"},
        {"name": "Language", "value": "language"},
        {"name": "Heart", "value": "heart"}
    ]

# ============= PAGINATION SCHEMAS =============

class PaginationParams(BaseSchema):
    skip: int = Field(default=0, ge=0, description="Number of items to skip")
    limit: int = Field(default=100, ge=1, le=500, description="Number of items to return")

class PaginatedResponse(BaseSchema):
    items: List[Any]
    total: int
    skip: int
    limit: int
    has_next: bool
    has_previous: bool