#!/usr/bin/env python3
import os
import sys
from sqlalchemy import text

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine

def add_ai_columns():
    """Add AI generation columns to schemes_of_work table"""
    print("🔄 Adding AI generation columns to schemes_of_work table...")
    
    try:
        with engine.connect() as connection:
            result = connection.execute(text("PRAGMA table_info(schemes_of_work)"))
            existing_columns = [row[1] for row in result]
            
            print(f"📋 Current columns: {existing_columns}")
            
            required_columns = {
                'generated_content': 'JSON',
                'ai_model_used': 'TEXT',
                'generation_metadata': 'JSON',
                'generation_date': 'DATETIME',
                'generation_version': 'INTEGER DEFAULT 1',
                'is_ai_generated': 'BOOLEAN DEFAULT FALSE'
            }
            
            columns_added = 0
            
            for column_name, column_type in required_columns.items():
                if column_name not in existing_columns:
                    try:
                        sql = f"ALTER TABLE schemes_of_work ADD COLUMN {column_name} {column_type}"
                        print(f"➕ Adding column: {column_name}")
                        connection.execute(text(sql))
                        connection.commit()
                        print(f"✅ Successfully added: {column_name}")
                        columns_added += 1
                    except Exception as e:
                        print(f"❌ Error adding {column_name}: {str(e)}")
                else:
                    print(f"✅ Column {column_name} already exists")
            
            if columns_added > 0:
                print(f"🎉 Successfully added {columns_added} AI generation columns!")
            else:
                print("✅ All AI generation columns already exist!")
                
            result = connection.execute(text("PRAGMA table_info(schemes_of_work)"))
            final_columns = [row[1] for row in result]
            
            ai_columns = [col for col in final_columns if col in required_columns.keys()]
            print(f"🤖 AI columns present: {ai_columns}")
            
            return len(ai_columns) == len(required_columns)
                
    except Exception as e:
        print(f"❌ Error setting up columns: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Starting database migration...")
    if add_ai_columns():
        print("🎉 Database is ready for AI scheme generation!")
    else:
        print("❌ Migration failed") 