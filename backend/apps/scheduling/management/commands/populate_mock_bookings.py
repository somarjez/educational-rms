from calendar import monthrange
from datetime import date, timedelta
import random

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.scheduling.models import Booking, Room, RoomEquipment, TimeSlot

User = get_user_model()


class Command(BaseCommand):
    help = 'Populate bookings for a target user/month range with realistic room metadata'

    def add_arguments(self, parser):
        parser.add_argument('--user-id', type=int, default=3, help='Target user id')
        parser.add_argument('--year', type=int, default=2026, help='Target year')
        parser.add_argument(
            '--months',
            type=str,
            default='3,4,5,8,9,10,11,12',
            help='Comma-separated months, e.g. 3,4,5,8,9,10,11,12',
        )
        parser.add_argument('--min-per-month', type=int, default=20, help='Minimum bookings for each target month')
        parser.add_argument('--tag', type=str, default='MOCK_DATA_2026_MAR-MAY_AUG-DEC', help='Tag prefix in notes')
        parser.add_argument(
            '--reset-existing-tagged',
            action='store_true',
            help='Delete existing tagged bookings for the user before seeding',
        )

    @staticmethod
    def _format_slot(slot):
        return f"{slot.name} ({slot.start_time.strftime('%H:%M')}-{slot.end_time.strftime('%H:%M')})"

    def _room_equipment_summary(self, room):
        assignments = list(
            RoomEquipment.objects.filter(room=room)
            .select_related('equipment')
            .order_by('equipment__name')
        )
        if assignments:
            return ', '.join(f"{item.equipment.name} x{item.quantity}" for item in assignments)

        features = room.features or []
        if features:
            return ', '.join(features)

        return 'None listed'

    def _build_notes(self, tag, room, slot):
        return (
            f"{tag} | "
            f"building={room.building or 'N/A'} | "
            f"floor={room.floor or 'N/A'} | "
            f"room_type={room.room_type} | "
            f"description={(room.description or 'N/A')} | "
            f"equipment={self._room_equipment_summary(room)} | "
            f"timeslot={self._format_slot(slot)}"
        )

    def handle(self, *args, **options):
        user_id = options['user_id']
        year = options['year']
        min_per_month = max(1, options['min_per_month'])
        tag = options['tag']
        reset_existing_tagged = options['reset_existing_tagged']

        try:
            months = sorted({int(m.strip()) for m in options['months'].split(',') if m.strip()})
        except ValueError as exc:
            raise CommandError(f'Invalid --months value: {exc}')

        if any(m < 1 or m > 12 for m in months):
            raise CommandError('Months must be between 1 and 12')

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise CommandError(f'User id={user_id} does not exist')

        rooms = list(Room.objects.filter(is_active=True).order_by('id'))
        slots = [
            s for s in TimeSlot.objects.filter(is_active=True).order_by('start_time')
            if 'lunch' not in (s.name or '').lower()
        ]

        if not rooms:
            raise CommandError('No active rooms found')
        if not slots:
            raise CommandError('No active non-lunch timeslots found')

        purpose_pool = [
            'Programming Class',
            'Faculty Consultation',
            'Research Group Meeting',
            'Lab Activity',
            'Department Planning',
            'Student Advising Session',
            'Capstone Review',
            'Make-up Class',
        ]

        deleted = 0
        created = 0
        conflict_skips = 0
        monthly_counts = {m: 0 for m in months}

        with transaction.atomic():
            if reset_existing_tagged:
                deleted, _ = Booking.objects.filter(user_id=user_id, notes__startswith=tag).delete()

            for month in months:
                max_day = monthrange(year, month)[1]
                weekdays = [date(year, month, d) for d in range(1, max_day + 1) if date(year, month, d).weekday() < 5]

                # Deterministic generator per user/month for repeatability.
                rng = random.Random(f'user-{user_id}-{year}-{month}-v1')
                attempts = 0
                max_attempts = 6000

                while attempts < max_attempts:
                    count = Booking.objects.filter(
                        user_id=user_id,
                        date__year=year,
                        date__month=month,
                        notes__startswith=tag,
                    ).count()

                    if count >= min_per_month:
                        monthly_counts[month] = count
                        break

                    attempts += 1
                    day = rng.choice(weekdays)
                    room = rng.choice(rooms)
                    slot = rng.choice(slots)

                    if Booking.objects.filter(
                        user_id=user_id,
                        room=room,
                        date=day,
                        time_slot=slot,
                        notes__startswith=tag,
                    ).exists():
                        continue

                    if Booking.objects.filter(
                        room=room,
                        date=day,
                        time_slot=slot,
                        status__in=['APPROVED', 'CONFIRMED'],
                    ).exists():
                        conflict_skips += 1
                        continue

                    participants = max(5, min(room.capacity, int(room.capacity * rng.uniform(0.35, 0.85))))
                    room_label = f"{room.name} ({room.building or 'N/A'} {room.floor or ''})".strip()
                    slot_label = self._format_slot(slot)

                    Booking.objects.create(
                        room=room,
                        user=user,
                        time_slot=slot,
                        date=day,
                        purpose=f"{rng.choice(purpose_pool)} | {room_label} | {slot_label}",
                        status='CONFIRMED',
                        priority=rng.choice(['MEDIUM', 'HIGH']),
                        participants_count=participants,
                        notes=self._build_notes(tag, room, slot),
                    )
                    created += 1

                monthly_counts[month] = Booking.objects.filter(
                    user_id=user_id,
                    date__year=year,
                    date__month=month,
                    notes__startswith=tag,
                ).count()

        self.stdout.write(self.style.SUCCESS('Populate complete'))
        self.stdout.write(f'user_id={user_id}, year={year}, months={months}')
        self.stdout.write(f'deleted_tagged={deleted}')
        self.stdout.write(f'created={created}')
        self.stdout.write(f'conflict_skips={conflict_skips}')
        self.stdout.write(f'monthly_tagged_counts={monthly_counts}')
