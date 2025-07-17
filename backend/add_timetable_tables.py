#!/usr/bin/env python3
import os
import sys

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine
from models import Base

def add_timetable_tables():
    """Add timetable tables to existing database"""
    print("🏗️ Adding timetable tables to existing database...")
    try:
        # Create all tables (including new timetable tables)
        Base.metadata.create_all(engine)
        print("✅ All tables created successfully!")
        # Verify tables were created
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        timetable_tables = ['timetables', 'timetable_slots']
        for table in timetable_tables:
            if table in tables:
                print(f"✅ {table} - Created successfully")
            else:
                print(f"❌ {table} - Failed to create")
        print("🎉 Timetable tables added successfully!")
    except Exception as e:
        print(f"❌ Error adding timetable tables: {str(e)}")
        raise

if __name__ == "__main__":
    add_timetable_tables() 