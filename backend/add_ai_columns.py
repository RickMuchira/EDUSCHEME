#!/usr/bin/env python3
import sqlite3
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///./eduscheme.db"

def check_column_exists(connection, table_name, column_name):
    """Check if a column exists in a table"""
    try:
        result = connection.execute(text(f"PRAGMA table_info({table_name})"))
        columns = [row[1] for row in result.fetchall()]
        return column_name in columns
    except Exception as e:
        print(f"Error checking column {column_name} in {table_name}: {e}")
        return False

def add_ai_columns():
    """Add AI generation columns to schemes_of_work table"""
    print("🔄 Adding AI generation columns to schemes_of_work table...")
    
    engine = create_engine(DATABASE_URL)
    
    with engine.begin() as connection:  # Use begin() for auto-commit
        # Check existing columns
        result = connection.execute(text("PRAGMA table_info(schemes_of_work)"))
        existing_columns = [row[1] for row in result.fetchall()]
        print(f"Existing columns: {existing_columns}")
        
        # Define the columns we want to add
        columns_to_add = [
            ("generated_content", "TEXT"),
            ("ai_model_used", "VARCHAR(100)"),
            ("generation_metadata", "TEXT"),
            ("generation_date", "DATETIME"),
            ("generation_version", "INTEGER DEFAULT 1"),
            ("is_ai_generated", "BOOLEAN DEFAULT FALSE")
        ]
        
        # Add missing columns
        for column_name, column_type in columns_to_add:
            if column_name not in existing_columns:
                try:
                    sql = f"ALTER TABLE schemes_of_work ADD COLUMN {column_name} {column_type}"
                    connection.execute(text(sql))
                    print(f"✅ Added column: {column_name}")
                except Exception as e:
                    print(f"❌ Error adding column {column_name}: {e}")
            else:
                print(f"✅ Column {column_name} already exists")
        
        # Verify the columns were added
        print("\n🔍 Verifying added columns...")
        result = connection.execute(text("PRAGMA table_info(schemes_of_work)"))
        all_columns = [row[1] for row in result.fetchall()]
        print(f"All columns after migration: {all_columns}")
        
        return True

def auto_fix_null_subject_ids(default_subject_id=None):
    """Automatically assign a subject_id to all schemes with NULL subject_id."""
    print("🔄 Fixing schemes with NULL subject_id...")
    
    engine = create_engine(DATABASE_URL)
    
    with engine.begin() as connection:  # Use begin() for auto-commit
        # Check for schemes with NULL subject_id
        schemes_result = connection.execute(text("SELECT id, school_name, subject_name FROM schemes_of_work WHERE subject_id IS NULL"))
        schemes = schemes_result.fetchall()
        
        if not schemes:
            print("✅ No schemes with NULL subject_id found.")
            return True
            
        print(f"Found {len(schemes)} schemes with NULL subject_id:")
        for scheme in schemes:
            print(f"  - Scheme ID: {scheme[0]}, School: {scheme[1]}, Subject: {scheme[2]}")
        
        # Get a default subject_id if not provided
        if default_subject_id is None:
            subject_result = connection.execute(text("SELECT id, name FROM subjects ORDER BY id ASC LIMIT 1"))
            subject = subject_result.fetchone()
            if not subject:
                print("❌ No subjects found in the database. Cannot assign default subject_id.")
                return False
            default_subject_id = subject[0]
            print(f"ℹ️ Using first subject_id in database: {default_subject_id} ({subject[1]})")
        else:
            print(f"ℹ️ Using provided default subject_id: {default_subject_id}")
        
        # Update all schemes with NULL subject_id
        update_count = 0
        for scheme in schemes:
            try:
                connection.execute(
                    text("UPDATE schemes_of_work SET subject_id = :subject_id WHERE id = :scheme_id"),
                    {"subject_id": default_subject_id, "scheme_id": scheme[0]}
                )
                print(f"  ✅ Updated scheme {scheme[0]} with subject_id {default_subject_id}")
                update_count += 1
            except Exception as e:
                print(f"  ❌ Failed to update scheme {scheme[0]}: {e}")
        
        print(f"✅ Successfully updated {update_count} schemes with subject_id {default_subject_id}")
        return True

def fix_null_subject_ids():
    """Find all schemes with NULL subject_id and prompt to assign a valid subject_id."""
    engine = create_engine(DATABASE_URL)
    
    with engine.begin() as connection:
        schemes_result = connection.execute(text("SELECT id, school_name, subject_name FROM schemes_of_work WHERE subject_id IS NULL"))
        schemes = schemes_result.fetchall()
        
        if not schemes:
            print("✅ No schemes with NULL subject_id found.")
            return
            
        print(f"Found {len(schemes)} schemes with NULL subject_id:")
        for scheme in schemes:
            print(f"  Scheme ID: {scheme[0]}, School: {scheme[1]}, Subject Name: {scheme[2]}")
            # Prompt admin for subject_id
            try:
                subject_id = int(input(f"Enter valid subject_id for scheme {scheme[0]} (or 0 to skip): "))
            except Exception:
                print("Invalid input, skipping.")
                continue
            if subject_id > 0:
                connection.execute(
                    text("UPDATE schemes_of_work SET subject_id = :subject_id WHERE id = :scheme_id"),
                    {"subject_id": subject_id, "scheme_id": scheme[0]}
                )
                print(f"  Updated scheme {scheme[0]} with subject_id {subject_id}")
            else:
                print(f"  Skipped scheme {scheme[0]}")
        print("✅ Finished updating schemes with NULL subject_id.")

if __name__ == "__main__":
    print("🚀 Starting database migration...")
    
    # First, add AI columns if needed
    try:
        add_ai_columns()
        print("✅ AI columns migration completed")
    except Exception as e:
        print(f"❌ AI columns migration failed: {e}")
    
    # Then, automatically fix NULL subject_ids
    print("\n🔧 Fixing NULL subject_ids automatically...")
    try:
        auto_fix_null_subject_ids()
        print("✅ Subject ID fix completed")
    except Exception as e:
        print(f"❌ Subject ID fix failed: {e}")
    
    print("\n🎉 Database migration completed!") 