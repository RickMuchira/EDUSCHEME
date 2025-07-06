#!/usr/bin/env python3
# backend/seed_data.py
import os
import sys

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import School

def seed_default_data():
    """Seed the database with default data"""
    db = SessionLocal()
    
    try:
        # Check if default school exists
        default_school = db.query(School).filter(School.code == "DEFAULT").first()
        
        if not default_school:
            print("Creating default school...")
            default_school = School(
                name="Default School",
                code="DEFAULT",
                address="123 Education Street",
                phone="+1234567890",
                email="admin@defaultschool.edu",
                is_active=True
            )
            db.add(default_school)
            db.commit()
            db.refresh(default_school)
            print(f"Default school created with ID: {default_school.id}")
        else:
            print(f"Default school already exists with ID: {default_school.id}")
            
    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_default_data() 