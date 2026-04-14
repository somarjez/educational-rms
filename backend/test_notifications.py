#!/usr/bin/env python
"""
Test script to verify notification system is working.
Run with: python test_notifications.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from apps.scheduling.models import Booking, Room, TimeSlot, Notification
from django.utils import timezone
from datetime import date, time

User = get_user_model()

print("=" * 60)
print("NOTIFICATION SYSTEM TEST")
print("=" * 60)

# Check if users exist
users = User.objects.all()
print(f"\n✓ Total users in system: {users.count()}")

if users.count() == 0:
    print("⚠ No users found. Please create a user first.")
    exit(1)

test_user = users.first()
print(f"✓ Using test user: {test_user.email}")

# Check if bookings exist
bookings = Booking.objects.all()
print(f"\n✓ Total bookings: {bookings.count()}")

if bookings.count() == 0:
    print("⚠ No bookings found. Creating test booking...")
    
    # Get or create room and time slot
    room = Room.objects.first()
    time_slot = TimeSlot.objects.first()
    
    if not room or not time_slot:
        print("⚠ Cannot create test booking - no rooms or time slots found")
        exit(1)
    
    booking = Booking.objects.create(
        room=room,
        user=test_user,
        time_slot=time_slot,
        date=date.today(),
        purpose="Test notification",
        status='PENDING',
        participants_count=5
    )
    print(f"✓ Created test booking: {booking.id}")
else:
    booking = bookings.first()
    print(f"✓ Using existing booking: {booking.id}")

# Test 1: Check existing notifications
print("\n" + "-" * 60)
print("TEST 1: Check existing notifications")
print("-" * 60)
existing_notifications = Notification.objects.filter(user=test_user)
print(f"Notifications for {test_user.email}: {existing_notifications.count()}")
for notif in existing_notifications[:5]:
    print(f"  - {notif.notification_type}: {notif.title}")

# Test 2: Create a status alert notification
print("\n" + "-" * 60)
print("TEST 2: Create status alert notification")
print("-" * 60)
notification = Notification.create_status_alert(
    booking=booking,
    user=test_user,
    old_status='PENDING',
    new_status='APPROVED'
)
print(f"✓ Created notification: {notification.id}")
print(f"  Type: {notification.get_notification_type_display()}")
print(f"  Title: {notification.title}")
print(f"  Message: {notification.message}")
print(f"  Is Read: {notification.is_read}")

# Test 3: Create reminder notification
print("\n" + "-" * 60)
print("TEST 3: Create reminder notification")
print("-" * 60)
reminder = Notification.create_reminder(booking, test_user, days_until=1)
print(f"✓ Created reminder: {reminder.id}")
print(f"  Type: {reminder.get_notification_type_display()}")
print(f"  Message: {reminder.message}")

# Test 4: Create overdue alert
print("\n" + "-" * 60)
print("TEST 4: Create overdue alert notification")
print("-" * 60)
overdue = Notification.create_overdue_alert(booking, test_user)
print(f"✓ Created overdue alert: {overdue.id}")
print(f"  Type: {overdue.get_notification_type_display()}")
print(f"  Message: {overdue.message}")

# Test 5: Check API endpoint readiness
print("\n" + "-" * 60)
print("TEST 5: API Endpoint Information")
print("-" * 60)
print("Notification API Endpoints:")
print("  GET  /api/v1/scheduling/notifications/")
print("  POST /api/v1/scheduling/notifications/mark_all_read/")
print("  POST /api/v1/scheduling/notifications/{id}/mark_read/")
print("  DELETE /api/v1/scheduling/notifications/{id}/")
print("  GET  /api/v1/scheduling/notifications/unread_count/")

# Test 6: Signal test
print("\n" + "-" * 60)
print("TEST 6: Test signal on booking status change")
print("-" * 60)
initial_count = Notification.objects.filter(user=test_user, booking=booking).count()
print(f"Initial notifications for this booking: {initial_count}")

# Change booking status to test signal
booking.status = 'CONFIRMED'
booking.save()

new_count = Notification.objects.filter(user=test_user, booking=booking).count()
print(f"After status change to CONFIRMED: {new_count}")
if new_count > initial_count:
    print("✓ Signal is working! Notification created automatically.")
    new_notif = Notification.objects.filter(user=test_user, booking=booking).latest('created_at')
    print(f"  Latest: {new_notif.title}")
else:
    print("⚠ Signal may not be triggering properly")

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)
print("\nTo manually test in UI:")
print("1. Go to Dashboard (authenticated as a user)")
print("2. Look for bell icon (🔔) in top-right corner")
print("3. Click bell to open notification panel")
print("4. Existing notifications should appear")
print("\nTo trigger new notifications:")
print("  - Admin approves a pending booking → Status Alert")
print("  - Run: python manage.py check_bookings_and_create_alerts → Reminders & Overdue")
