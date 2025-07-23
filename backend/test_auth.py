#!/usr/bin/env python3
"""
Test script for authentication endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_user_creation():
    """Test user creation endpoint"""
    print("🧪 Testing user creation endpoint...")
    
    test_user_data = {
        "google_id": "108123456789012345678",
        "email": "testuser@gmail.com",
        "name": "Test User",
        "picture": "https://lh3.googleusercontent.com/a/default-user"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/users",
            headers={"Content-Type": "application/json"},
            json=test_user_data
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ User creation successful!")
            print(f"Response: {json.dumps(data, indent=2)}")
            return data.get("data", {}).get("id")
        else:
            print(f"❌ User creation failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error testing user creation: {str(e)}")
        return None

def test_duplicate_user_creation():
    """Test creating the same user again (should update)"""
    print("\n🧪 Testing duplicate user creation...")
    
    test_user_data = {
        "google_id": "108123456789012345678",
        "email": "testuser@gmail.com",
        "name": "Test User Updated",
        "picture": "https://lh3.googleusercontent.com/a/updated-user"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/users",
            headers={"Content-Type": "application/json"},
            json=test_user_data
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Duplicate user handling successful!")
            print(f"Message: {data.get('message')}")
            return True
        else:
            print(f"❌ Duplicate user handling failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing duplicate user: {str(e)}")
        return False

def test_health_endpoint():
    """Test health endpoint"""
    print("\n🧪 Testing health endpoint...")
    
    try:
        response = requests.get(f"{BASE_URL}/health")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Health endpoint working!")
            print(f"Service: {data.get('service')}")
            print(f"Version: {data.get('version')}")
            return True
        else:
            print(f"❌ Health endpoint failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing health endpoint: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Starting authentication endpoint tests...")
    print("=" * 50)
    
    # Test health first
    health_ok = test_health_endpoint()
    
    if health_ok:
        # Test user creation
        user_id = test_user_creation()
        
        if user_id:
            # Test duplicate user handling
            duplicate_ok = test_duplicate_user_creation()
            
            if duplicate_ok:
                print("\n" + "=" * 50)
                print("🎉 All authentication tests passed!")
                print("✅ Backend is ready for Google OAuth integration")
            else:
                print("\n" + "=" * 50)
                print("⚠️ Some tests failed - check duplicate user handling")
        else:
            print("\n" + "=" * 50)
            print("❌ User creation failed - authentication won't work")
    else:
        print("\n" + "=" * 50)
        print("❌ Backend health check failed - server may not be running")
    
    print("=" * 50) 