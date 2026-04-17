#!/usr/bin/env python
"""Test the API endpoints that the frontend uses"""
import requests
import json

BASE_URL = 'http://localhost:8000/api/v1'

print("=" * 60)
print("Testing Frontend API Endpoints")
print("=" * 60)

# Use the test user we created earlier
print("\n1. Login as test user...")
login_data = {
    "email": "testuser123@example.com",
    "password": "TestPassword123!"
}

try:
    login_resp = requests.post(
        f'{BASE_URL}/auth/users/login/',
        json=login_data
    )
    
    if login_resp.status_code == 200:
        access_token = login_resp.json()['tokens']['access']
        print(f"   ✓ Logged in successfully")
        
        # Test /me endpoint
        print("\n2. Testing /auth/users/me/ endpoint...")
        headers = {'Authorization': f'Bearer {access_token}'}
        me_resp = requests.get(f'{BASE_URL}/auth/users/me/', headers=headers)
        print(f"   Status: {me_resp.status_code}")
        if me_resp.status_code == 200:
            print(f"   ✓ Got user data")
        
        # Test /bookings endpoint
        print("\n3. Testing /scheduling/bookings/ endpoint...")
        bookings_resp = requests.get(
            f'{BASE_URL}/scheduling/bookings/',
            headers=headers
        )
        print(f"   Status: {bookings_resp.status_code}")
        
        if bookings_resp.status_code == 200:
            data = bookings_resp.json()
            if isinstance(data, dict) and 'results' in data:
                count = len(data['results'])
                print(f"   ✓ Got paginated response with {count} bookings")
            elif isinstance(data, list):
                count = len(data)
                print(f"   ✓ Got {count} bookings (non-paginated)")
            else:
                print(f"   Response type: {type(data)}")
        else:
            print(f"   ✗ Error: {bookings_resp.status_code}")
            print(f"   {bookings_resp.text[:200]}")
        
        # Test /bookings with status filter
        print("\n4. Testing /scheduling/bookings/?status=APPROVED...")
        filtered_resp = requests.get(
            f'{BASE_URL}/scheduling/bookings/?status=APPROVED',
            headers=headers
        )
        print(f"   Status: {filtered_resp.status_code}")
        
        if filtered_resp.status_code == 200:
            data = filtered_resp.json()
            if isinstance(data, dict) and 'results' in data:
                count = len(data['results'])
                print(f"   ✓ Got {count} APPROVED bookings (paginated)")
            elif isinstance(data, list):
                count = len(data)
                print(f"   ✓ Got {count} APPROVED bookings")
            else:
                print(f"   Response keys: {list(data.keys()) if isinstance(data, dict) else 'array'}")
        
    else:
        print(f"   ✗ Login failed: {login_resp.status_code}")
        
except Exception as e:
    print(f"   Error: {e}")

print("\n" + "=" * 60)
