# backend/models.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.types import TypeDecorator, Text as SQLText
from datetime import datetime
import json

Base = declarative_base()

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
    # Note: forms_grades relationship removed since FormGrade now references SchoolLevel directly

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