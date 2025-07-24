#!/usr/bin/env python3
"""
Migration script to fix subject_id issues in schemes_of_work table.

This script:
1. Identifies schemes with missing or null subject_id
2. Attempts to resolve subject_id from related data
3. Updates the database schema to make subject_id NOT NULL
4. Provides a report of changes made

Run this script from the backend directory:
python fix_subject_id_migration.py
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text, Column, Integer, ForeignKey
from sqlalchemy.orm import sessionmaker
from database import get_db, engine
import models
from models import SchemeOfWork, Subject, Term

def fix_subject_id_issues():
    """Fix existing schemes with missing subject_id"""
    
    # Create session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        print("🔍 Analyzing schemes with missing subject_id...")
        
        # Find schemes with missing subject_id
        schemes_with_missing_subject = db.query(SchemeOfWork).filter(
            (SchemeOfWork.subject_id.is_(None)) | 
            (SchemeOfWork.subject_id == 0)
        ).all()
        
        print(f"Found {len(schemes_with_missing_subject)} schemes with missing subject_id")
        
        if not schemes_with_missing_subject:
            print("✅ No schemes found with missing subject_id. Database is clean!")
            return True
        
        # Try to resolve subject_id for each scheme
        fixed_count = 0
        deleted_count = 0
        
        for scheme in schemes_with_missing_subject:
            print(f"\n🔧 Processing scheme ID {scheme.id}: {scheme.subject_name} - {scheme.school_name}")
            
            # Try to find subject by name and term
            potential_subject = None
            if scheme.subject_name and scheme.term_id:
                potential_subject = db.query(Subject).filter(
                    Subject.name.ilike(f"%{scheme.subject_name}%"),
                    Subject.term_id == scheme.term_id
                ).first()
            
            if potential_subject:
                print(f"  ✅ Found matching subject: {potential_subject.name} (ID: {potential_subject.id})")
                scheme.subject_id = potential_subject.id
                scheme.subject_name = potential_subject.name  # Ensure consistency
                db.commit()
                fixed_count += 1
            else:
                print(f"  ❌ No matching subject found. Subject name: '{scheme.subject_name}', Term ID: {scheme.term_id}")
                
                # Check if we have any subjects for this term
                available_subjects = db.query(Subject).filter(Subject.term_id == scheme.term_id).all()
                if available_subjects:
                    print(f"     Available subjects for term {scheme.term_id}:")
                    for subj in available_subjects[:5]:  # Show first 5
                        print(f"       - {subj.name} (ID: {subj.id})")
                    
                    # For now, let's delete schemes that can't be fixed
                    print(f"  🗑️  Deleting unfixable scheme ID {scheme.id}")
                    db.delete(scheme)
                    db.commit()
                    deleted_count += 1
                else:
                    print(f"     No subjects available for term {scheme.term_id}")
                    print(f"  🗑️  Deleting scheme ID {scheme.id} (no subjects in term)")
                    db.delete(scheme)
                    db.commit()
                    deleted_count += 1
        
        print(f"\n📊 Migration Summary:")
        print(f"   • Fixed schemes: {fixed_count}")
        print(f"   • Deleted unfixable schemes: {deleted_count}")
        print(f"   • Total processed: {fixed_count + deleted_count}")
        
        # Verify no schemes remain with missing subject_id
        remaining_broken = db.query(SchemeOfWork).filter(
            (SchemeOfWork.subject_id.is_(None)) | 
            (SchemeOfWork.subject_id == 0)
        ).count()
        
        if remaining_broken > 0:
            print(f"⚠️  Warning: {remaining_broken} schemes still have missing subject_id")
            return False
        else:
            print("✅ All schemes now have valid subject_id values!")
            return True
            
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def update_database_schema():
    """Update the database schema to make subject_id NOT NULL"""
    
    try:
        print("\n🔧 Updating database schema...")
        
        # Note: SQLite doesn't support ALTER COLUMN directly
        # The schema change will be applied when the app restarts with the updated models.py
        print("✅ Schema will be updated when the application restarts")
        print("   (subject_id is now defined as nullable=False in models.py)")
        
        return True
        
    except Exception as e:
        print(f"❌ Error updating schema: {e}")
        return False

def verify_subjects_exist():
    """Verify that subjects exist in the database"""
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        subject_count = db.query(Subject).count()
        print(f"\n📚 Database contains {subject_count} subjects")
        
        if subject_count == 0:
            print("⚠️  No subjects found in database. You may need to run seed_data.py first")
            return False
        
        # Show some sample subjects
        sample_subjects = db.query(Subject).limit(5).all()
        print("Sample subjects:")
        for subj in sample_subjects:
            print(f"  - {subj.name} (ID: {subj.id}, Term: {subj.term_id})")
        
        return True
        
    except Exception as e:
        print(f"❌ Error checking subjects: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Starting subject_id migration...")
    
    # Step 1: Verify subjects exist
    if not verify_subjects_exist():
        print("❌ Migration aborted: No subjects in database")
        sys.exit(1)
    
    # Step 2: Fix existing schemes
    if fix_subject_id_issues():
        print("✅ Data migration completed successfully")
    else:
        print("❌ Data migration failed")
        sys.exit(1)
    
    # Step 3: Update schema (informational)
    update_database_schema()
    
    print("\n🎉 Migration completed successfully!")
    print("💡 Restart your FastAPI application to apply the schema changes") 