#!/usr/bin/env python3
# backend/add_timetable_tables.py
"""
Script to add timetable tables to existing database
Run this after adding the timetable models to models.py
"""
import os
import sys

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, create_tables
from base import Base
from timetable.models import Timetable, TimetableSlot, TimetableAnalytics, TimetableTemplate, TimetableShare
from models import *  # Register all models, including Subject

def add_timetable_tables():
    """Add timetable tables to existing database"""
    print("🏗️ Adding timetable tables to existing database...")
    
    try:
        print("Creating all tables (including timetable tables and dependencies)...")
        Base.metadata.create_all(engine)
        print("✅ All tables created successfully!")
        
        print("\n🎉 Timetable tables added successfully!")
        print("📊 Your database now supports timetable functionality")
        
        # Verify tables were created
        print("\n🔍 Verifying tables...")
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        timetable_tables = [
            'timetables', 'timetable_slots', 'timetable_analytics', 
            'timetable_templates', 'timetable_shares'
        ]
        
        for table in timetable_tables:
            if table in tables:
                print(f"✅ {table} - Created successfully")
            else:
                print(f"❌ {table} - Failed to create")
        
        print(f"\n📈 Total tables in database: {len(tables)}")
        print("Available tables:", ", ".join(sorted(tables)))
        
    except Exception as e:
        print(f"❌ Error adding timetable tables: {str(e)}")
        raise

def verify_existing_tables():
    """Verify existing tables are intact"""
    print("\n🔍 Verifying existing tables...")
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    existing_tables = [
        'schools', 'school_levels', 'form_grades', 'terms', 
        'subjects', 'topics', 'subtopics', 'admin_users'
    ]
    
    for table in existing_tables:
        if table in tables:
            print(f"✅ {table} - Exists")
        else:
            print(f"⚠️ {table} - Missing")

if __name__ == "__main__":
    print("🚀 EduScheme Timetable Tables Migration")
    print("=" * 50)
    
    # Verify existing tables first
    verify_existing_tables()
    
    # Add new timetable tables
    add_timetable_tables()
    
    print("\n✨ Migration completed!")
    print("You can now use the timetable functionality with database persistence.") 