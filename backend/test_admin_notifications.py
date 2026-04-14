#!/usr/bin/env python
"""
Test admin notifications for new pending bookings.
Run with: python test_admin_notifications.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from apps.scheduling.models import Booking, Room, TimeSlot, Notification
from datetime import date

User = get_user_model()

print("=" * 60)
print("ADMIN NOTIFICATION TEST")
print("=" * 60)

# Get admin and faculty users
approvers = User.objects.filter(role__in=['admin', 'faculty'])
print(f"\n✓ Found {approvers.count()} admin/faculty user(s)")
for user in approvers[:3]:
    print(f"  - {user.email} ({user.role})")

if approvers.count() == 0:
    print("⚠ No admins/faculty found. Cannot test admin notifications.")
    exit(1)

# Get a non-admin user
students = User.objects.exclude(role='ADMIN')
if students.count() == 0:
    print("⚠ No regular users found. Cannot create test booking.")
    exit(1)

test_student = students.first()
print(f"\n✓ Using student: {test_student.email}")

# Get room and time slot
room = Room.objects.first()
time_slot = TimeSlot.objects.first()

if not room or not time_slot:
    print("⚠ Cannot find room or time slot")
    exit(1)

print(f"✓ Using room: {room.name}")

# Check initial notification count for each admin
print("\n" + "-" * 60)
print("BEFORE: Approver notification counts")
print("-" * 60)
approver_notif_counts = {}
for user in approvers[:3]:
    count = Notification.objects.filter(user=user).count()
    approver_notif_counts[user.id] = count
    print(f"  {user.email} ({user.role}): {count} notifications")

# Create a new booking with PENDING status
print("\n" + "-" * 60)
print("Creating new PENDING booking...")
print("-" * 60)
new_booking = Booking.objects.create(
    room=room,
    user=test_student,
    time_slot=time_slot,
    date=date.today(),
    purpose="Test admin notification",
    status='PENDING',
    participants_count=3
)
print(f"✓ Created booking #{new_booking.id}")
print(f"  Room: {new_booking.room.name}")
print(f"  User: {new_booking.user.email}")
print(f"  Status: {new_booking.status}")

# Check notification count for each admin AFTER
print("\n" + "-" * 60)
print("AFTER: Approver notification counts")
print("-" * 60)
approvers_notified = 0
for user in approvers[:3]:
    new_count = Notification.objects.filter(user=user).count()
    old_count = approver_notif_counts[user.id]
    
    if new_count > old_count:
        print(f"  ✅ {user.email} ({user.role}): {old_count} → {new_count} (+{new_count - old_count})")
        approvers_notified += 1
        
        # Show the notification details
        latest_notif = Notification.objects.filter(user=user, booking=new_booking).latest('created_at')
        print(f"      └─ {latest_notif.title}")
        print(f"      └─ {latest_notif.message}")
    else:
        print(f"  ❌ {user.email} ({user.role}): {old_count} (no change)")

print("\n" + "=" * 60)
if approvers_notified > 0:
    print(f"✅ SUCCESS! Admins/Faculty were notified")
    print(f"   {approvers_notified}/{min(3, approvers.count())} approvers received notifications")
else:
    print("❌ FAILED! Admins/Faculty were not notified")
    print("   Check signals.py for errors")
print("=" * 60)

print("\n📝 Notification Flow:")
print("   1. Student/Faculty creates booking → status PENDING")
print("   2. Signal triggers automatically")
print("   3. ALL admins receive notification")
print("   4. Admin sees bell icon 🔔 with unread count")
print("   5. Admin clicks bell and approves/rejects")
print("   6. Student gets notification of approval decision")
