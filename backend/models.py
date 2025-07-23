# backend/models.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.types import TypeDecorator, Text as SQLText
from datetime import datetime
import json
import uuid

from base import Base

# Custom JSON type for SQLite compatibility
class JSONType(TypeDecorator):
    impl = SQLText
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            return json.dumps(value)
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            return json.loads(value)
        return value

# User model for Google authenticated users
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    google_id = Column(String(255), unique=True, nullable=False, index=True)  # Google's unique ID
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    picture = Column(String(500))  # URL to profile picture
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    last_login = Column(DateTime)
    
    # Relationships
    schemes = relationship("SchemeOfWork", back_populates="user", cascade="all, delete-orphan")
    timetables = relationship("Timetable", back_populates="user", cascade="all, delete-orphan")

# Scheme of Work model
class SchemeOfWork(Base):
    @property
    def form_grade_name(self):
        """Frontend expects form_grade_name"""
        return self.form_grade.name if self.form_grade else None

    @property
    def term_name(self):
        """Frontend expects term_name"""
        return self.term.name if self.term else None

    @property
    def school_level_name(self):
        """Useful for frontend display"""
        return self.school_level.name if self.school_level else None

    @property
    def academic_year(self):
        """Frontend expects academic_year"""
        if hasattr(self, '_academic_year') and self._academic_year:
            return self._academic_year
        # Extract from created_at or use current year
        if self.created_at:
            return str(self.created_at.year)
        from datetime import datetime
        return str(datetime.now().year)
    __tablename__ = "schemes_of_work"
    
    id = Column(Integer, primary_key=True, index=True)
    school_name = Column(String(255), nullable=False)
    subject_name = Column(String(150), nullable=False)
    status = Column(String(50), default="draft")  # draft, in-progress, completed
    progress = Column(Integer, default=0)  # 0-100
    content = Column(JSONType)  # Store scheme content as JSON
    scheme_metadata = Column(JSONType)  # Additional metadata - RENAMED from 'metadata'
    
    # AI generation fields - ADD THESE IF NOT PRESENT
    generated_content = Column(JSONType, nullable=True)
    ai_model_used = Column(String(100), nullable=True)
    generation_metadata = Column(JSONType, nullable=True)
    generation_date = Column(DateTime, nullable=True)
    generation_version = Column(Integer, default=1)
    is_ai_generated = Column(Boolean, default=False)
    
    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    school_level_id = Column(Integer, ForeignKey("school_levels.id"), nullable=False)
    form_grade_id = Column(Integer, ForeignKey("forms_grades.id"), nullable=False)
    term_id = Column(Integer, ForeignKey("terms.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    due_date = Column(DateTime)
    
    # Relationships
    user = relationship("User", back_populates="schemes")
    school_level = relationship("SchoolLevel")
    form_grade = relationship("FormGrade")
    term = relationship("Term")
    subject = relationship("Subject")
    timetables = relationship("Timetable", back_populates="scheme")

    def to_dict(self):
        """Updated to_dict method to include frontend-expected fields"""
        return {
            "id": self.id,
            "school_name": self.school_name,
            "subject_name": self.subject_name,
            "form_grade": self.form_grade.name if self.form_grade else None,
            "form_grade_name": self.form_grade_name,  # Frontend expects this
            "term": self.term.name if self.term else None,
            "term_name": self.term_name,  # Frontend expects this
            "school_level_name": self.school_level_name,
            "academic_year": self.academic_year,  # Frontend expects this
            "status": self.status,
            "progress": self.progress,
            "content": self.content,
            "scheme_metadata": self.scheme_metadata,
            "generated_content": self.generated_content,
            "ai_model_used": self.ai_model_used,
            "generation_metadata": self.generation_metadata,
            "generation_date": self.generation_date.isoformat() if self.generation_date else None,
            "generation_version": self.generation_version,
            "is_ai_generated": self.is_ai_generated,
            "user_id": self.user_id,
            "school_level_id": self.school_level_id,
            "form_grade_id": self.form_grade_id,
            "term_id": self.term_id,
            "subject_id": self.subject_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "due_date": self.due_date.isoformat() if self.due_date else None,
        }

# Lesson Plan model
class LessonPlan(Base):
    __tablename__ = "lesson_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    content = Column(JSONType)  # Store lesson content as JSON
    objectives = Column(JSONType)  # Learning objectives
    activities = Column(JSONType)  # Lesson activities
    resources = Column(JSONType)  # Required resources
    assessment = Column(JSONType)  # Assessment methods
    duration_minutes = Column(Integer, default=40)
    lesson_number = Column(Integer, default=1)
    
    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    scheme_id = Column(Integer, ForeignKey("schemes_of_work.id"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
    subtopic_id = Column(Integer, ForeignKey("subtopics.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    scheduled_date = Column(DateTime)
    
    # Relationships
    user = relationship("User")
    scheme = relationship("SchemeOfWork")
    topic = relationship("Topic")
    subtopic = relationship("Subtopic")

class School(Base):
    __tablename__ = "schools"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    code = Column(String(50), unique=True, nullable=False)
    address = Column(Text)
    phone = Column(String(20))
    email = Column(String(255))
    logo_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    school_levels = relationship("SchoolLevel", back_populates="school", cascade="all, delete-orphan")

class SchoolLevel(Base):
    __tablename__ = "school_levels"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # Primary, Secondary, High School
    code = Column(String(20), nullable=False)  # PS, SS, HS, etc.
    description = Column(Text)
    display_order = Column(Integer, default=0)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=False)
    grade_type = Column(String(20), default="grade")  # "form" or "grade"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    school = relationship("School", back_populates="school_levels")
    sections = relationship("Section", back_populates="school_level", cascade="all, delete-orphan")
    forms_grades = relationship("FormGrade", back_populates="school_level", cascade="all, delete-orphan")

class Section(Base):
    __tablename__ = "sections"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # Lower Primary, Upper Primary, etc.
    description = Column(Text)
    display_order = Column(Integer, default=0)
    school_level_id = Column(Integer, ForeignKey("school_levels.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    school_level = relationship("SchoolLevel", back_populates="sections")

class FormGrade(Base):
    __tablename__ = "forms_grades"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # Form 1, Grade 1, etc.
    code = Column(String(20), nullable=False)  # F1, G1, etc.
    description = Column(Text)
    display_order = Column(Integer, default=0)
    school_level_id = Column(Integer, ForeignKey("school_levels.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    school_level = relationship("SchoolLevel", back_populates="forms_grades")
    terms = relationship("Term", back_populates="form_grade", cascade="all, delete-orphan")

class Term(Base):
    __tablename__ = "terms"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # Term 1, Term 2, etc.
    code = Column(String(20), nullable=False)  # T1, T2, etc.
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    display_order = Column(Integer, default=0)
    form_grade_id = Column(Integer, ForeignKey("forms_grades.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    form_grade = relationship("FormGrade", back_populates="terms")
    subjects = relationship("Subject", back_populates="term", cascade="all, delete-orphan")

class Subject(Base):
    __tablename__ = "subjects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)  # Mathematics, English, etc.
    code = Column(String(20), nullable=False)  # MATH, ENG, etc.
    description = Column(Text)
    color = Column(String(7), default="#3B82F6")  # Hex color for theming
    icon = Column(String(50), default="book")  # Icon name for animations
    animation_type = Column(String(50), default="bounce")  # Animation preference
    display_order = Column(Integer, default=0)
    term_id = Column(Integer, ForeignKey("terms.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    term = relationship("Term", back_populates="subjects")
    topics = relationship("Topic", back_populates="subject", cascade="all, delete-orphan")

class Topic(Base):
    __tablename__ = "topics"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    learning_objectives = Column(JSONType)  # Store as JSON using custom type
    duration_weeks = Column(Integer, default=1)
    display_order = Column(Integer, default=0)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    subject = relationship("Subject", back_populates="topics")
    subtopics = relationship("Subtopic", back_populates="topic", cascade="all, delete-orphan")

class Subtopic(Base):
    __tablename__ = "subtopics"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text)
    activities = Column(JSONType)  # Store activities as JSON using custom type
    assessment_criteria = Column(JSONType)  # Assessment criteria as JSON using custom type
    resources = Column(JSONType)  # Learning resources as JSON using custom type
    duration_lessons = Column(Integer, default=1)
    display_order = Column(Integer, default=0)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    topic = relationship("Topic", back_populates="subtopics")

# Admin User model for authentication
class AdminUser(Base):
    __tablename__ = "admin_users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    last_login = Column(DateTime)

# --- Timetable Models for Save & Continue System ---
class Timetable(Base):
    __tablename__ = "timetables"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    scheme_id = Column(Integer, ForeignKey("schemes_of_work.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(String(50), default="draft")
    selected_topics = Column(JSONType)
    selected_subtopics = Column(JSONType)
    total_lessons = Column(Integer, default=0)
    total_weeks = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    # Simple relationships without back_populates/backref
    user = relationship("User", back_populates="timetables")
    scheme = relationship("SchemeOfWork", back_populates="timetables")
    slots = relationship("TimetableSlot", back_populates="timetable", cascade="all, delete-orphan")

class TimetableSlot(Base):
    __tablename__ = "timetable_slots"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    timetable_id = Column(String, ForeignKey("timetables.id", ondelete="CASCADE"), nullable=False)
    day_of_week = Column(String(10), nullable=False)
    time_slot = Column(String(20), nullable=False)
    period_number = Column(Integer, nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
    subtopic_id = Column(Integer, ForeignKey("subtopics.id"), nullable=True)
    lesson_title = Column(String(255))
    lesson_objectives = Column(Text)
    activities = Column(JSONType)
    resources = Column(JSONType)
    assessment_notes = Column(Text)
    is_double_lesson = Column(Boolean, default=False)
    double_position = Column(String(10))
    is_evening = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    timetable = relationship("Timetable", back_populates="slots")
    topic = relationship("Topic")
    subtopic = relationship("Subtopic")