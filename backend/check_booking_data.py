#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.scheduling.models import Booking

b = Booking.objects.first()
if b:
    print('Sample booking fields:')
    print(f'ID: {b.id}')
    print(f'Room: {b.room.name}')
    print(f'User: {b.user.get_full_name() or b.user.email}')
    print(f'Date: {b.date}')
    print(f'Time Slot: {b.time_slot.start_time} - {b.time_slot.end_time}')
    print(f'Purpose: {b.purpose}')
    print(f'Status: {b.status}')
    print(f'Priority: {b.priority}')
    print(f'Participants: {b.participants_count}')
    print(f'Is Recurring: {b.is_recurring}')
    print(f'Notes: {b.notes}')
else:
    print('No bookings found')
