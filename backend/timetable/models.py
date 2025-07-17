from base import Base

# Add these imports at the top if not already present
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, DECIMAL
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import uuid

# Add these classes to your existing models.py file (after your existing models)

class Timetable(Base):
    __tablename__ = "timetables"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, nullable=False)  # Reference to user
    name = Column(String(255), nullable=False)
    description = Column(Text)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    subject = relationship("Subject", backref="timetables")
    slots = relationship("TimetableSlot", back_populates="timetable", cascade="all, delete-orphan")
    analytics = relationship("TimetableAnalytics", back_populates="timetable", cascade="all, delete-orphan")

class TimetableSlot(Base):
    __tablename__ = "timetable_slots"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    timetable_id = Column(String, ForeignKey("timetables.id", ondelete="CASCADE"), nullable=False)
    day_of_week = Column(String(10), nullable=False)  # MON, TUE, WED, THU, FRI
    time_slot = Column(String(10), nullable=False)    # 9:00, 10:20, etc.
    period_number = Column(Integer, nullable=False)   # 1, 2, 3, etc.
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
    subtopic_id = Column(Integer, ForeignKey("subtopics.id"), nullable=True)
    is_double_lesson = Column(Boolean, default=False)
    double_position = Column(String(10))              # 'top' or 'bottom'
    is_evening = Column(Boolean, default=False)       # After 4 PM
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    timetable = relationship("Timetable", back_populates="slots")
    subject = relationship("Subject")
    topic = relationship("Topic")
    subtopic = relationship("Subtopic")

class TimetableAnalytics(Base):
    __tablename__ = "timetable_analytics"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    timetable_id = Column(String, ForeignKey("timetables.id", ondelete="CASCADE"), nullable=False)
    total_sessions = Column(Integer, default=0)
    total_hours = Column(DECIMAL(4,2), default=0.0)
    single_lessons = Column(Integer, default=0)
    double_lessons = Column(Integer, default=0)
    evening_lessons = Column(Integer, default=0)
    workload_level = Column(String(20))               # light, optimal, heavy, overloaded
    pattern_type = Column(String(50))                 # Pattern name
    efficiency_score = Column(Integer, default=0)    # 0-100 score
    daily_distribution = Column(Text)                 # JSON string of daily counts
    recorded_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    timetable = relationship("Timetable", back_populates="analytics")

class TimetableTemplate(Base):
    __tablename__ = "timetable_templates"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    template_data = Column(Text)                      # JSON string storing slot configuration
    is_public = Column(Boolean, default=False)
    usage_count = Column(Integer, default=0)
    tags = Column(String(500))                        # Comma-separated tags
    created_at = Column(DateTime, default=datetime.utcnow)

class TimetableShare(Base):
    __tablename__ = "timetable_shares"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    timetable_id = Column(String, ForeignKey("timetables.id", ondelete="CASCADE"), nullable=False)
    shared_by_user_id = Column(Integer, nullable=False)
    share_token = Column(String(100), unique=True, nullable=False)
    is_public = Column(Boolean, default=False)
    expires_at = Column(DateTime)
    view_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)