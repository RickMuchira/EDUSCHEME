from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, DECIMAL, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()

class Timetable(Base):
    __tablename__ = "timetables"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, nullable=False)  # Link to your existing users
    subject_id = Column(Integer, nullable=False)  # Link to your existing subjects
    name = Column(String(255), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    slots = relationship("TimetableSlot", back_populates="timetable", cascade="all, delete-orphan")
    analytics = relationship("TimetableAnalytics", back_populates="timetable", cascade="all, delete-orphan")

class TimetableSlot(Base):
    __tablename__ = "timetable_slots"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    timetable_id = Column(String, ForeignKey("timetables.id", ondelete="CASCADE"), nullable=False)
    day_of_week = Column(String(10), nullable=False)  # MON, TUE, WED, THU, FRI
    time_slot = Column(String(10), nullable=False)    # 7:00, 7:40, 8:20, etc.
    period_number = Column(Integer, nullable=False)   # 1, 2, 3, etc.
    is_double_lesson = Column(Boolean, default=False)
    double_position = Column(String(10))              # 'top' or 'bottom'
    is_evening = Column(Boolean, default=False)       # After 4 PM
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    timetable = relationship("Timetable", back_populates="slots")

class TimetableTemplate(Base):
    __tablename__ = "timetable_templates"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    template_data = Column(Text)  # JSON string storing slot configuration
    is_public = Column(Boolean, default=False)
    usage_count = Column(Integer, default=0)
    tags = Column(String(500))  # Comma-separated tags like "beginner,balanced"
    created_at = Column(DateTime, default=datetime.utcnow)

class TimetableAnalytics(Base):
    __tablename__ = "timetable_analytics"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    timetable_id = Column(String, ForeignKey("timetables.id", ondelete="CASCADE"), nullable=False)
    total_sessions = Column(Integer)
    total_hours = Column(DECIMAL(4,2))
    single_lessons = Column(Integer, default=0)
    double_lessons = Column(Integer, default=0)
    evening_lessons = Column(Integer, default=0)
    workload_level = Column(String(20))  # light, optimal, heavy, overloaded
    pattern_type = Column(String(50))    # Pattern name
    efficiency_score = Column(Integer)   # 0-100 score
    daily_distribution = Column(Text)    # JSON string of daily counts
    recorded_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    timetable = relationship("Timetable", back_populates="analytics")

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