#!/usr/bin/env python
"""Test the complete authentication flow"""
import requests
import json

BASE_URL = 'http://localhost:8000/api/v1'

print("=" * 60)
print("Testing Authentication Flow")
print("=" * 60)

# Step 1: Register a test user (optional, will skip if user already exists)
print("\n1. Attempting to register test user...")
register_data = {
    "username": "testuser123",
    "email": "testuser123@example.com",
    "password": "TestPassword123!",
    "password_confirm": "TestPassword123!",
    "first_name": "Test",
    "last_name": "User",
    "role": "admin"
}

try:
    register_resp = requests.post(
        f'{BASE_URL}/auth/users/register/',
        json=register_data
    )
    print(f"   Status: {register_resp.status_code}")
    if register_resp.status_code in [201, 400]:
        if 'already exists' in str(register_resp.text).lower():
            print("   → User already exists, will login instead")
        else:
            print(f"   Response: {register_resp.json()}")
except Exception as e:
    print(f"   Error: {e}")

# Step 2: Login to get tokens
print("\n2. Logging in...")
login_data = {
    "email": "testuser123@example.com",
    "password": "TestPassword123!"
}

try:
    login_resp = requests.post(
        f'{BASE_URL}/auth/users/login/',
        json=login_data
    )
    print(f"   Status: {login_resp.status_code}")
    login_json = login_resp.json()
    print(f"   Response keys: {list(login_json.keys())}")
    
    if login_resp.status_code == 200:
        access_token = login_json.get('tokens', {}).get('access')
        refresh_token = login_json.get('tokens', {}).get('refresh')
        print(f"   ✓ Access token received (length: {len(access_token) if access_token else 0})")
        print(f"   ✓ Refresh token received (length: {len(refresh_token) if refresh_token else 0})")
        
        # Step 3: Test /me endpoint with token
        print("\n3. Testing /me endpoint with Bearer token...")
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        me_resp = requests.get(
            f'{BASE_URL}/auth/users/me/',
            headers=headers
        )
        print(f"   Status: {me_resp.status_code}")
        
        if me_resp.status_code == 200:
            print(f"   ✓ Successfully retrieved user data")
            user_data = me_resp.json()
            print(f"   User: {user_data.get('email', 'N/A')} ({user_data.get('username', 'N/A')})")
            print(f"   Role: {user_data.get('role', 'N/A')}")
        else:
            print(f"   ✗ Failed: {me_resp.status_code}")
            print(f"   Response: {me_resp.text[:200]}")
    else:
        print(f"   ✗ Login failed: {login_json}")
        
except Exception as e:
    print(f"   Error: {e}")

# Step 4: Test without token (should fail)
print("\n4. Testing /me endpoint WITHOUT token (should fail with 401)...")
try:
    me_no_token = requests.get(f'{BASE_URL}/auth/users/me/')
    print(f"   Status: {me_no_token.status_code}")
    if me_no_token.status_code == 401:
        print(f"   ✓ Correctly returned 401 (Unauthorized)")
    else:
        print(f"   ✗ Unexpected status: {me_no_token.status_code}")
except Exception as e:
    print(f"   Error: {e}")

print("\n" + "=" * 60)
