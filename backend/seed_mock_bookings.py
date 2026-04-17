import random
from datetime import date, timedelta

from django.db import transaction
from django.db.models import Count
from django.db.models.functions import ExtractMonth

from apps.scheduling.models import Booking, Room, RoomEquipment, TimeSlot
from apps.users.models import User

TARGET_USER_ID = 3
TARGET_MONTHS = {3, 4, 5, 8, 9, 10, 11, 12}
SEED_TAG = 'MOCK_DATA_2026_MAR-MAY_AUG-DEC'
RESET_EXISTING_TAGGED = True
MIN_BOOKINGS_PER_MONTH = 20


def _format_slot(slot):
    return f"{slot.name} ({slot.start_time.strftime('%H:%M')}-{slot.end_time.strftime('%H:%M')})"


def _room_equipment_summary(room):
    assignments = list(
        RoomEquipment.objects.filter(room=room)
        .select_related('equipment')
        .order_by('equipment__name')
    )
    if assignments:
        return ', '.join(
            f"{item.equipment.name} x{item.quantity}" for item in assignments
        )

    features = room.features or []
    if features:
        return ', '.join(features)

    return 'None listed'


def _build_notes(room, slot):
    return (
        f"{SEED_TAG} | "
        f"building={room.building or 'N/A'} | "
        f"floor={room.floor or 'N/A'} | "
        f"room_type={room.room_type} | "
        f"description={(room.description or 'N/A')} | "
        f"equipment={_room_equipment_summary(room)} | "
        f"timeslot={_format_slot(slot)}"
    )


def run():
    user = User.objects.get(id=TARGET_USER_ID)
    rooms = list(Room.objects.filter(is_active=True).order_by('id'))
    slots = [
        s for s in TimeSlot.objects.filter(is_active=True).order_by('start_time')
        if 'lunch' not in (s.name or '').lower()
    ]

    if not rooms:
        raise RuntimeError('No active rooms found.')
    if not slots:
        raise RuntimeError('No active time slots found.')

    start = date(2026, 3, 1)
    end = date(2026, 12, 31)

    created = 0
    skipped_due_to_conflict = 0
    by_month = {m: 0 for m in sorted(TARGET_MONTHS)}

    deleted_existing = 0
    if RESET_EXISTING_TAGGED:
        deleted_existing, _ = Booking.objects.filter(
            user_id=TARGET_USER_ID,
            notes__startswith=SEED_TAG,
        ).delete()

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

    with transaction.atomic():
        current = start
        while current <= end:
            if current.month in TARGET_MONTHS and current.weekday() < 5:
                day_rng = random.Random(f"{TARGET_USER_ID}-{current.isoformat()}-seed-v2")
                month_bias = 0.46 if current.month in {3, 4, 5} else 0.58
                if day_rng.random() < month_bias:
                    bookings_today = 1 + (1 if day_rng.random() < 0.4 else 0)
                    used_pairs = set()

                    for _ in range(bookings_today):
                        room = day_rng.choice(rooms)
                        slot = day_rng.choice(slots)
                        pair = (room.id, slot.id)

                        if pair in used_pairs:
                            continue
                        used_pairs.add(pair)

                        # Keep idempotency for this seed set.
                        if Booking.objects.filter(
                            user_id=TARGET_USER_ID,
                            room=room,
                            date=current,
                            time_slot=slot,
                            notes__startswith=SEED_TAG,
                        ).exists():
                            continue

                        # Avoid collisions with already approved/confirmed bookings.
                        if Booking.objects.filter(
                            room=room,
                            date=current,
                            time_slot=slot,
                            status__in=['APPROVED', 'CONFIRMED'],
                        ).exists():
                            skipped_due_to_conflict += 1
                            continue

                        participants = max(
                            5,
                            min(room.capacity, int(room.capacity * day_rng.uniform(0.35, 0.85))),
                        )

                        room_label = f"{room.name} ({room.building or 'N/A'} {room.floor or ''})".strip()
                        slot_label = _format_slot(slot)
                        Booking.objects.create(
                            room=room,
                            user=user,
                            time_slot=slot,
                            date=current,
                            purpose=f"{day_rng.choice(purpose_pool)} | {room_label} | {slot_label}",
                            status='CONFIRMED',
                            priority=day_rng.choice(['MEDIUM', 'HIGH']),
                            participants_count=participants,
                            notes=_build_notes(room, slot),
                        )
                        created += 1
                        by_month[current.month] += 1

            current += timedelta(days=1)

        # Hard minimum per month: top up until each target month has at least MIN_BOOKINGS_PER_MONTH.
        for month in sorted(TARGET_MONTHS):
            month_start = date(2026, month, 1)
            month_end = date(2026, month + 1, 1) - timedelta(days=1) if month < 12 else date(2026, 12, 31)

            def month_count():
                return Booking.objects.filter(
                    user_id=TARGET_USER_ID,
                    date__year=2026,
                    date__month=month,
                    notes__startswith=SEED_TAG,
                ).count()

            weekday_dates = []
            d = month_start
            while d <= month_end:
                if d.weekday() < 5:
                    weekday_dates.append(d)
                d += timedelta(days=1)

            topup_rng = random.Random(f"{TARGET_USER_ID}-{month}-topup-v2")
            attempts = 0
            max_attempts = 6000

            while month_count() < MIN_BOOKINGS_PER_MONTH and attempts < max_attempts:
                attempts += 1

                current_day = topup_rng.choice(weekday_dates)
                room = topup_rng.choice(rooms)
                slot = topup_rng.choice(slots)

                if Booking.objects.filter(
                    user_id=TARGET_USER_ID,
                    room=room,
                    date=current_day,
                    time_slot=slot,
                    notes__startswith=SEED_TAG,
                ).exists():
                    continue

                if Booking.objects.filter(
                    room=room,
                    date=current_day,
                    time_slot=slot,
                    status__in=['APPROVED', 'CONFIRMED'],
                ).exists():
                    skipped_due_to_conflict += 1
                    continue

                participants = max(
                    5,
                    min(room.capacity, int(room.capacity * topup_rng.uniform(0.35, 0.85))),
                )

                room_label = f"{room.name} ({room.building or 'N/A'} {room.floor or ''})".strip()
                slot_label = _format_slot(slot)

                Booking.objects.create(
                    room=room,
                    user=user,
                    time_slot=slot,
                    date=current_day,
                    purpose=f"{topup_rng.choice(purpose_pool)} | {room_label} | {slot_label}",
                    status='CONFIRMED',
                    priority=topup_rng.choice(['MEDIUM', 'HIGH']),
                    participants_count=participants,
                    notes=_build_notes(room, slot),
                )
                created += 1

            by_month[month] = month_count()

    monthly_counts = list(
        Booking.objects.filter(user_id=TARGET_USER_ID)
        .annotate(month=ExtractMonth('date'))
        .values('month')
        .annotate(count=Count('id'))
        .order_by('month')
    )

    print('Seed complete for user_id=3')
    print('Deleted prior tagged records:', deleted_existing)
    print('Created bookings:', created)
    print('Skipped due to room/time conflicts:', skipped_due_to_conflict)
    print('Created by month:', by_month)
    print('All user monthly counts:', monthly_counts)
    print('User total bookings:', Booking.objects.filter(user_id=TARGET_USER_ID).count())


run()
