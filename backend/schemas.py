# backend/schemas.py
from pydantic import BaseModel, EmailStr, validator
from typing import List, Optional, Dict, Any
from datetime import datetime

# Base schemas
class BaseSchema(BaseModel):
    class Config:
        from_attributes = True

# School Level Schemas
class SchoolLevelBase(BaseSchema):
    name: str
    description: Optional[str] = None
    display_order: int = 0

class SchoolLevelCreate(SchoolLevelBase):
    school_id: int

class SchoolLevelUpdate(BaseSchema):
    name: Optional[str] = None
    description: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None

class SchoolLevel(SchoolLevelBase):
    id: int
    school_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

# Form/Grade Schemas
class FormGradeBase(BaseSchema):
    name: str
    code: str
    display_order: int = 0

class FormGradeCreate(FormGradeBase):
    school_level_id: int

class FormGradeUpdate(BaseSchema):
    name: Optional[str] = None
    code: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None

class FormGrade(FormGradeBase):
    id: int
    school_level_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

# Term Schemas
class TermBase(BaseSchema):
    name: str
    code: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    display_order: int = 0

class TermCreate(TermBase):
    form_grade_id: int

class TermUpdate(BaseSchema):
    name: Optional[str] = None
    code: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None

class Term(TermBase):
    id: int
    form_grade_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

# Subject Schemas
class SubjectBase(BaseSchema):
    name: str
    code: str
    description: Optional[str] = None
    color: str = "#3B82F6"
    icon: str = "book"
    animation_type: str = "bounce"
    display_order: int = 0

    @validator('color')
    def validate_color(cls, v):
        if not v.startswith('#') or len(v) != 7:
            raise ValueError('Color must be a valid hex color (e.g., #3B82F6)')
        return v

    @validator('animation_type')
    def validate_animation(cls, v):
        allowed_animations = ['bounce', 'pulse', 'shake', 'swing', 'flash', 'fade']
        if v not in allowed_animations:
            raise ValueError(f'Animation must be one of: {", ".join(allowed_animations)}')
        return v

class SubjectCreate(SubjectBase):
    term_id: int

class SubjectUpdate(BaseSchema):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    animation_type: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None

    @validator('color')
    def validate_color(cls, v):
        if v and (not v.startswith('#') or len(v) != 7):
            raise ValueError('Color must be a valid hex color (e.g., #3B82F6)')
        return v

class Subject(SubjectBase):
    id: int
    term_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

# Topic Schemas
class TopicBase(BaseSchema):
    title: str
    description: Optional[str] = None
    learning_objectives: Optional[List[str]] = []
    duration_weeks: int = 1
    display_order: int = 0

class TopicCreate(TopicBase):
    subject_id: int

class TopicUpdate(BaseSchema):
    title: Optional[str] = None
    description: Optional[str] = None
    learning_objectives: Optional[List[str]] = None
    duration_weeks: Optional[int] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None

class Topic(TopicBase):
    id: int
    subject_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

# Subtopic Schemas
class SubtopicBase(BaseSchema):
    title: str
    content: Optional[str] = None
    activities: Optional[List[Dict[str, Any]]] = []
    assessment_criteria: Optional[List[str]] = []
    resources: Optional[List[Dict[str, Any]]] = []
    duration_lessons: int = 1
    display_order: int = 0

class SubtopicCreate(SubtopicBase):
    topic_id: int

class SubtopicUpdate(BaseSchema):
    title: Optional[str] = None
    content: Optional[str] = None
    activities: Optional[List[Dict[str, Any]]] = None
    assessment_criteria: Optional[List[str]] = None
    resources: Optional[List[Dict[str, Any]]] = None
    duration_lessons: Optional[int] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None

class Subtopic(SubtopicBase):
    id: int
    topic_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

# Nested response schemas for hierarchical data
class SubtopicWithDetails(Subtopic):
    pass

class TopicWithSubtopics(Topic):
    subtopics: List[SubtopicWithDetails] = []

class SubjectWithTopics(Subject):
    topics: List[TopicWithSubtopics] = []

class TermWithSubjects(Term):
    subjects: List[SubjectWithTopics] = []

class FormGradeWithTerms(FormGrade):
    terms: List[TermWithSubjects] = []

class SchoolLevelWithForms(SchoolLevel):
    forms_grades: List[FormGradeWithTerms] = []

# Utility schemas
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

# Response wrapper
class ResponseWrapper(BaseSchema):
    success: bool = True
    message: str = "Operation successful"
    data: Optional[Any] = None
    total: Optional[int] = None
    page: Optional[int] = None
    limit: Optional[int] = None