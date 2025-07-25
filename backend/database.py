# backend/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Database configuration for SQLite
# Use relative path for cross-platform compatibility
DATABASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_PATH = os.path.join(DATABASE_DIR, "eduscheme.db")
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"


# SQLite-specific engine configuration
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # SQLite specific
    echo=False  # Set to True for SQL logging in development
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Database initialization
def create_tables():
    """Create all tables in the database"""
    from models import Base
    Base.metadata.create_all(bind=engine)

def drop_tables():
    """Drop all tables (use with caution!)"""
    from models import Base
    Base.metadata.drop_all(bind=engine)