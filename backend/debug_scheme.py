#!/usr/bin/env python3
"""
Debug script to check scheme and subject data
"""
import sqlite3
import json
import sys
import os
from pathlib import Path

# Add the project root to the path so we can import from backend
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

db_path = project_root / "eduscheme.db"

def check_schemes():
    """Check all schemes in the database"""
    print("🔍 CHECKING SCHEMES")
    print("=" * 50)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT id, school_name, subject_name, subject_id, 
                   school_level_id, form_grade_id, term_id, user_id
            FROM schemes_of_work
            ORDER BY created_at DESC
            LIMIT 10
        """)
        
        schemes = cursor.fetchall()
        
        if schemes:
            print(f"Found {len(schemes)} schemes:")
            for scheme in schemes:
                print(f"  ID: {scheme[0]}")
                print(f"  School: {scheme[1]}")
                print(f"  Subject: {scheme[2]}")
                print(f"  Subject ID: {scheme[3]} {'❌ MISSING!' if not scheme[3] else '✅'}")
                print(f"  School Level ID: {scheme[4]}")
                print(f"  Form Grade ID: {scheme[5]}")
                print(f"  Term ID: {scheme[6]}")
                print(f"  User ID: {scheme[7]}")
                print("-" * 30)
        else:
            print("❌ No schemes found!")
            
    except Exception as e:
        print(f"❌ Error checking schemes: {e}")
    finally:
        conn.close()

def check_subjects():
    """Check subjects in the database"""
    print("\n🔍 CHECKING SUBJECTS")
    print("=" * 50)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT id, name, code, term_id, is_active
            FROM subjects
            WHERE is_active = 1
            ORDER BY id
            LIMIT 10
        """)
        
        subjects = cursor.fetchall()
        
        if subjects:
            print(f"Found {len(subjects)} active subjects:")
            for subject in subjects:
                print(f"  ID: {subject[0]} | Name: {subject[1]} | Code: {subject[2]} | Term ID: {subject[3]}")
        else:
            print("❌ No active subjects found!")
            
    except Exception as e:
        print(f"❌ Error checking subjects: {e}")
    finally:
        conn.close()

def check_topics_for_subject(subject_id):
    """Check topics for a specific subject"""
    print(f"\n🔍 CHECKING TOPICS FOR SUBJECT {subject_id}")
    print("=" * 50)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT id, title, subject_id, is_active
            FROM topics
            WHERE subject_id = ? AND is_active = 1
            ORDER BY display_order
        """, (subject_id,))
        
        topics = cursor.fetchall()
        
        if topics:
            print(f"Found {len(topics)} topics for subject {subject_id}:")
            for topic in topics:
                print(f"  ID: {topic[0]} | Title: {topic[1]} | Subject ID: {topic[2]}")
        else:
            print(f"❌ No topics found for subject {subject_id}!")
            
    except Exception as e:
        print(f"❌ Error checking topics: {e}")
    finally:
        conn.close()

def check_users():
    """Check users in the database"""
    print("\n🔍 CHECKING USERS")
    print("=" * 50)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT id, email, name, google_id, is_active
            FROM users
            ORDER BY created_at DESC
            LIMIT 5
        """)
        
        users = cursor.fetchall()
        
        if users:
            print(f"Found {len(users)} users:")
            for user in users:
                print(f"  ID: {user[0]} | Email: {user[1]} | Name: {user[2]} | Google ID: {user[3]}")
        else:
            print("❌ No users found!")
            
    except Exception as e:
        print(f"❌ Error checking users: {e}")
    finally:
        conn.close()

def fix_scheme_subject_id(scheme_id, subject_id):
    """Fix a scheme's missing subject_id"""
    print(f"\n🔧 FIXING SCHEME {scheme_id} WITH SUBJECT {subject_id}")
    print("=" * 50)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            UPDATE schemes_of_work 
            SET subject_id = ?
            WHERE id = ?
        """, (subject_id, scheme_id))
        
        conn.commit()
        
        if cursor.rowcount > 0:
            print(f"✅ Successfully updated scheme {scheme_id} with subject_id {subject_id}")
        else:
            print(f"❌ No scheme found with ID {scheme_id}")
            
    except Exception as e:
        print(f"❌ Error fixing scheme: {e}")
    finally:
        conn.close()

def batch_fix_invalid_subject_ids():
    """Fix all schemes with invalid subject_ids by mapping them to valid subjects based on subject_name"""
    print("\n🔧 BATCH FIXING INVALID SUBJECT IDS")
    print("=" * 50)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Get all schemes with their current subject_id and subject_name
        cursor.execute("""
            SELECT id, subject_id, subject_name, school_level_id, form_grade_id, term_id
            FROM schemes_of_work
            ORDER BY id
        """)
        schemes = cursor.fetchall()
        
        # Get all valid subjects
        cursor.execute("""
            SELECT id, name, term_id
            FROM subjects
            WHERE is_active = 1
            ORDER BY id
        """)
        subjects = cursor.fetchall()
        
        print(f"Found {len(schemes)} schemes and {len(subjects)} valid subjects")
        
        fixed_count = 0
        
        for scheme in schemes:
            scheme_id, current_subject_id, subject_name, school_level_id, form_grade_id, term_id = scheme
            
            # Check if current subject_id exists
            valid_subject = None
            for subject in subjects:
                if subject[0] == current_subject_id:
                    valid_subject = subject
                    break
            
            if not valid_subject:
                # Find a matching subject by name
                matching_subject = None
                for subject in subjects:
                    if subject[1].lower() == subject_name.lower():
                        matching_subject = subject
                        break
                
                if not matching_subject:
                    # If no exact name match, try to find the closest match
                    if subject_name.lower() in ['mathematics', 'math']:
                        for subject in subjects:
                            if 'mathematics' in subject[1].lower() or 'math' in subject[1].lower():
                                matching_subject = subject
                                break
                    elif subject_name.lower() in ['english']:
                        for subject in subjects:
                            if 'english' in subject[1].lower():
                                matching_subject = subject
                                break
                    elif subject_name.lower() in ['kiswahili']:
                        for subject in subjects:
                            if 'kiswahili' in subject[1].lower():
                                matching_subject = subject
                                break
                    elif subject_name.lower() in ['religious education', 'religion']:
                        for subject in subjects:
                            if 'religious' in subject[1].lower():
                                matching_subject = subject
                                break
                
                if matching_subject:
                    new_subject_id = matching_subject[0]
                    print(f"🔧 Fixing scheme {scheme_id}: '{subject_name}' (invalid ID {current_subject_id}) → '{matching_subject[1]}' (ID {new_subject_id})")
                    
                    # Update the scheme
                    cursor.execute("""
                        UPDATE schemes_of_work 
                        SET subject_id = ?, subject_name = ?
                        WHERE id = ?
                    """, (new_subject_id, matching_subject[1], scheme_id))
                    
                    fixed_count += 1
                else:
                    print(f"⚠️  Could not find matching subject for scheme {scheme_id}: '{subject_name}' (ID {current_subject_id})")
            else:
                print(f"✅ Scheme {scheme_id}: '{subject_name}' (ID {current_subject_id}) is already valid")
        
        conn.commit()
        print(f"\n🎉 Fixed {fixed_count} schemes with invalid subject_ids!")
        
        if fixed_count > 0:
            print("\n📋 Updated schemes:")
            cursor.execute("""
                SELECT id, subject_id, subject_name, school_name
                FROM schemes_of_work
                ORDER BY id
            """)
            updated_schemes = cursor.fetchall()
            
            for scheme in updated_schemes:
                print(f"  Scheme {scheme[0]}: {scheme[2]} (ID {scheme[1]}) - {scheme[3]}")
        
    except Exception as e:
        print(f"❌ Error during batch fix: {e}")
        conn.rollback()
    finally:
        conn.close()

def main():
    print("🚀 EDUScheme Database Diagnostic Tool")
    print("=" * 60)
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == "fix" and len(sys.argv) == 4:
            scheme_id = int(sys.argv[2])
            subject_id = int(sys.argv[3])
            fix_scheme_subject_id(scheme_id, subject_id)
        elif command == "check_topics" and len(sys.argv) == 3:
            subject_id = int(sys.argv[2])
            check_topics_for_subject(subject_id)
        elif command == "batch_fix":
            batch_fix_invalid_subject_ids()
        else:
            print("Usage:")
            print("  python debug_scheme.py                    # Run full diagnostic")
            print("  python debug_scheme.py fix <scheme_id> <subject_id>  # Fix specific scheme")
            print("  python debug_scheme.py check_topics <subject_id>     # Check topics for subject")
            print("  python debug_scheme.py batch_fix                     # Fix all invalid subject_ids")
            return
    else:
        # Run full diagnostic
        check_users()
        check_schemes()
        check_subjects()
        
        # Check topics for first few subjects
        for subject_id in [1, 2, 3]:
            check_topics_for_subject(subject_id)
        
        print("=" * 60)
        print("📋 DIAGNOSTIC COMPLETE")
        print()
        print("If you see schemes with missing subject_id, you can fix them by:")
        print("1. Note the scheme ID that needs fixing")
        print("2. Choose an appropriate subject ID from the subjects list")
        print("3. Run: python debug_scheme.py fix <scheme_id> <subject_id>")
        print("4. Or run: python debug_scheme.py batch_fix")
        print("=" * 60)

if __name__ == "__main__":
    main() 