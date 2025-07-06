#!/usr/bin/env python3
# backend/reset_db.py
import os
import sys

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import drop_tables, create_tables
from models import School

def reset_database():
    """Reset the database by dropping and recreating all tables"""
    print("Dropping all tables...")
    drop_tables()
    
    print("Creating all tables...")
    create_tables()
    
    print("Database reset completed successfully!")

if __name__ == "__main__":
    reset_database() 