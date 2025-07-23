#!/usr/bin/env python3
"""
Test script to verify scheme API endpoints
"""
import requests
import json

def test_scheme_api():
    base_url = "http://127.0.0.1:8000"
    
    # Test data - using a real user and scheme from the database
    test_user_google_id = "103163391724329779791"  # Replace with a real user ID from your database
    test_scheme_ids = [1, 2, 3, 4, 5]  # Test first few schemes
    
    print("🧪 Testing Scheme API endpoints...")
    print("=" * 50)
    
    for scheme_id in test_scheme_ids:
        print(f"\n🔍 Testing scheme ID: {scheme_id}")
        
        try:
            url = f"{base_url}/api/schemes/{scheme_id}"
            params = {"user_google_id": test_user_google_id}
            
            print(f"📡 Making request to: {url}")
            print(f"📋 Parameters: {params}")
            
            response = requests.get(url, params=params)
            
            print(f"📊 Response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Success! Response data:")
                print(f"   - Scheme ID: {data.get('id')}")
                print(f"   - Subject ID: {data.get('subject_id')} (type: {type(data.get('subject_id'))})")
                print(f"   - Subject Name: {data.get('subject_name')}")
                print(f"   - School Name: {data.get('school_name')}")
                
                # Validate subject_id
                subject_id = data.get('subject_id')
                if subject_id and isinstance(subject_id, int) and subject_id > 0:
                    print(f"   ✅ Subject ID validation: PASSED")
                else:
                    print(f"   ❌ Subject ID validation: FAILED - {subject_id}")
            else:
                print(f"❌ Error response:")
                try:
                    error_data = response.json()
                    print(f"   - Detail: {error_data.get('detail')}")
                except:
                    print(f"   - Raw response: {response.text}")
                    
        except Exception as e:
            print(f"❌ Exception testing scheme {scheme_id}: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 Test completed!")

if __name__ == "__main__":
    test_scheme_api() 