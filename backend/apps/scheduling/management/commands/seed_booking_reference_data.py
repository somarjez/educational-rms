from datetime import time

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.scheduling.models import Room, TimeSlot


ROOMS = [
    {
        'name': 'Computer Lab 101',
        'room_type': 'LAB',
        'capacity': 30,
        'floor': '1',
        'building': 'Engineering Building',
        'description': 'Modern computer lab with dual monitors',
        'features': ['Projector', 'Whiteboard', 'Computers', 'WiFi'],
        'is_active': True,
    },
    {
        'name': 'Computer Lab 102',
        'room_type': 'LAB',
        'capacity': 25,
        'floor': '1',
        'building': 'Engineering Building',
        'description': 'Programming lab with development tools',
        'features': ['Projector', 'Computers', 'WiFi', 'Networking Equipment'],
        'is_active': True,
    },
    {
        'name': 'Computer Lab 201',
        'room_type': 'LAB',
        'capacity': 28,
        'floor': '2',
        'building': 'Science Building',
        'description': 'Advanced computing lab',
        'features': ['Projector', 'Computers', 'High-Performance Network', 'WiFi'],
        'is_active': True,
    },
    {
        'name': 'Classroom A101',
        'room_type': 'CLASSROOM',
        'capacity': 40,
        'floor': '1',
        'building': 'Main Building',
        'description': 'Standard classroom',
        'features': ['Projector', 'Whiteboard', 'WiFi'],
        'is_active': True,
    },
    {
        'name': 'Classroom A102',
        'room_type': 'CLASSROOM',
        'capacity': 50,
        'floor': '1',
        'building': 'Main Building',
        'description': 'Larger classroom',
        'features': ['Projector', 'Whiteboard', 'WiFi', 'Interactive Display'],
        'is_active': True,
    },
    {
        'name': 'Classroom B101',
        'room_type': 'CLASSROOM',
        'capacity': 35,
        'floor': '1',
        'building': 'Building B',
        'description': 'Seminar classroom',
        'features': ['Whiteboard', 'WiFi'],
        'is_active': True,
    },
    {
        'name': 'Classroom B102',
        'room_type': 'CLASSROOM',
        'capacity': 45,
        'floor': '1',
        'building': 'Building B',
        'description': 'Lecture hall',
        'features': ['Projector', 'Whiteboard', 'WiFi', 'Recording Equipment'],
        'is_active': True,
    },
    {
        'name': 'Conference Room 1',
        'room_type': 'CONFERENCE',
        'capacity': 12,
        'floor': '3',
        'building': 'Main Building',
        'description': 'Small meeting room',
        'features': ['Projector', 'Video Conference', 'WiFi'],
        'is_active': True,
    },
    {
        'name': 'Conference Room 2',
        'room_type': 'CONFERENCE',
        'capacity': 20,
        'floor': '3',
        'building': 'Main Building',
        'description': 'Medium meeting room',
        'features': ['Projector', 'Video Conference', 'WiFi', 'Whiteboard'],
        'is_active': True,
    },
    {
        'name': 'Main Auditorium',
        'room_type': 'AUDITORIUM',
        'capacity': 200,
        'floor': '1',
        'building': 'Main Building',
        'description': 'Large capacity auditorium',
        'features': ['Projector', 'Sound System', 'Video Conference', 'Recording Equipment', 'WiFi'],
        'is_active': True,
    },
    {
        'name': 'Study Room 1',
        'room_type': 'STUDY_ROOM',
        'capacity': 8,
        'floor': '2',
        'building': 'Library Building',
        'description': 'Small group study room',
        'features': ['Whiteboard', 'WiFi'],
        'is_active': True,
    },
    {
        'name': 'Study Room 2',
        'room_type': 'STUDY_ROOM',
        'capacity': 8,
        'floor': '2',
        'building': 'Library Building',
        'description': 'Small group study room',
        'features': ['Whiteboard', 'WiFi'],
        'is_active': True,
    },
    {
        'name': 'Study Room 3',
        'room_type': 'STUDY_ROOM',
        'capacity': 10,
        'floor': '3',
        'building': 'Library Building',
        'description': 'Medium study room',
        'features': ['Whiteboard', 'Projector', 'WiFi'],
        'is_active': True,
    },
]


TIME_SLOTS = [
    {
        'name': 'Period 1',
        'slot_type': 'HOURLY',
        'start_time': time(8, 0),
        'end_time': time(9, 0),
        'days_of_week': [0, 1, 2, 3, 4, 5, 6],
        'is_active': True,
    },
    {
        'name': 'Period 2',
        'slot_type': 'HOURLY',
        'start_time': time(9, 0),
        'end_time': time(10, 0),
        'days_of_week': [0, 1, 2, 3, 4, 5, 6],
        'is_active': True,
    },
    {
        'name': 'Period 3',
        'slot_type': 'HOURLY',
        'start_time': time(10, 0),
        'end_time': time(11, 0),
        'days_of_week': [0, 1, 2, 3, 4, 5, 6],
        'is_active': True,
    },
    {
        'name': 'Period 4',
        'slot_type': 'HOURLY',
        'start_time': time(11, 0),
        'end_time': time(12, 0),
        'days_of_week': [0, 1, 2, 3, 4, 5, 6],
        'is_active': True,
    },
    {
        'name': 'Period 5',
        'slot_type': 'HOURLY',
        'start_time': time(13, 0),
        'end_time': time(14, 0),
        'days_of_week': [0, 1, 2, 3, 4, 5, 6],
        'is_active': True,
    },
    {
        'name': 'Period 6',
        'slot_type': 'HOURLY',
        'start_time': time(14, 0),
        'end_time': time(15, 0),
        'days_of_week': [0, 1, 2, 3, 4, 5, 6],
        'is_active': True,
    },
]


class Command(BaseCommand):
    help = (
        'Seed minimum local room and time slot reference data used by booking dropdowns. '
        'Safe to run repeatedly.'
    )

    @transaction.atomic
    def handle(self, *args, **options):
        if not settings.DEBUG:
            self.stdout.write(self.style.WARNING('Skipping seed in non-debug environment.'))
            return

        room_created = 0
        room_existing = 0
        slot_created = 0
        slot_existing = 0
        slot_updated = 0

        for room_data in ROOMS:
            room, created = Room.objects.get_or_create(
                name=room_data['name'],
                defaults=room_data,
            )
            if created:
                room_created += 1
                continue
            room_existing += 1

        for slot_data in TIME_SLOTS:
            slot, created = TimeSlot.objects.get_or_create(
                name=slot_data['name'],
                start_time=slot_data['start_time'],
                end_time=slot_data['end_time'],
                defaults=slot_data,
            )
            if created:
                slot_created += 1
                continue

            changed_fields = []
            if slot.days_of_week != slot_data['days_of_week']:
                slot.days_of_week = slot_data['days_of_week']
                changed_fields.append('days_of_week')
            if slot.is_active != slot_data['is_active']:
                slot.is_active = slot_data['is_active']
                changed_fields.append('is_active')
            if changed_fields:
                slot.save(update_fields=changed_fields + ['updated_at'])
                slot_updated += 1

            slot_existing += 1

        self.stdout.write(self.style.SUCCESS('Local booking reference data is ready.'))
        self.stdout.write(
            f'Rooms: created={room_created}, existing={room_existing}, total={Room.objects.count()}'
        )
        self.stdout.write(
            f'Time slots: created={slot_created}, updated={slot_updated}, existing={slot_existing}, total={TimeSlot.objects.count()}'
        )