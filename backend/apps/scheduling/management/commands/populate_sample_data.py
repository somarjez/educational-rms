import random
from datetime import date, timedelta
from collections import defaultdict

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.scheduling.models import Booking, Room, Equipment, RoomEquipment, TimeSlot

class Command(BaseCommand):
    help = 'Populate sample rooms/equipment and generate user-targeted mock bookings'

    def add_arguments(self, parser):
        parser.add_argument('--user-id', type=int, default=3, help='User ID to assign generated bookings')
        parser.add_argument('--year', type=int, default=2026, help='Target year for generated bookings')
        parser.add_argument(
            '--months',
            type=str,
            default='3,4,5,8,9,10,11,12',
            help='Comma-separated month numbers to populate (example: 3,4,5,8,9,10,11,12)'
        )
        parser.add_argument('--min-per-month', type=int, default=20, help='Minimum bookings per target month')
        parser.add_argument('--max-per-month', type=int, default=40, help='Maximum bookings per target month')
        parser.add_argument(
            '--bookings-only',
            action='store_true',
            help='Skip room/equipment creation and only generate booking schedules',
        )
        parser.add_argument(
            '--academic-calendar',
            action='store_true',
            help='Generate Jan-May and Aug-Dec classroom schedules with 5-6 class days per week',
        )
        parser.add_argument(
            '--classroom-only',
            action='store_true',
            help='Generate schedules only in CLASSROOM rooms',
        )
        parser.add_argument(
            '--replace-user-months',
            action='store_true',
            help='Delete all existing bookings for user in target months before generating schedule',
        )
        parser.add_argument(
            '--mixed-utilization',
            action='store_true',
            help='Academic mode: classroom-heavy plus scheduled LAB/STUDY_ROOM/CONFERENCE usage blocks',
        )
        parser.add_argument(
            '--reset-tagged',
            action='store_true',
            help='Delete previously generated tagged bookings for this user/year before repopulating',
        )

    @staticmethod
    def _parse_months(raw_months):
        months = []
        for part in (raw_months or '').split(','):
            part = part.strip()
            if not part:
                continue
            value = int(part)
            if value < 1 or value > 12:
                raise CommandError(f'Invalid month value: {value}. Use values from 1 to 12.')
            months.append(value)
        if not months:
            raise CommandError('No valid months provided.')
        return sorted(set(months))

    @staticmethod
    def _month_end(year, month):
        if month == 12:
            return date(year, 12, 31)
        return date(year, month + 1, 1) - timedelta(days=1)

    @staticmethod
    def _slot_label(slot):
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

    def _build_booking_note(self, tag, room, slot):
        return (
            f"{tag} | "
            f"building={room.building or 'N/A'} | "
            f"floor={room.floor or 'N/A'} | "
            f"room_type={room.room_type} | "
            f"description={(room.description or 'N/A')} | "
            f"equipment={self._room_equipment_summary(room)} | "
            f"timeslot={self._slot_label(slot)}"
        )

    def _populate_academic_calendar_bookings(
        self,
        user_id,
        year,
        reset_tagged,
        classroom_only=True,
        replace_user_months=False,
        mixed_utilization=False,
    ):
        user_model = get_user_model()
        try:
            user = user_model.objects.get(id=user_id)
        except user_model.DoesNotExist as exc:
            raise CommandError(f'User with id={user_id} not found.') from exc

        months = [1, 2, 3, 4, 5, 8, 9, 10, 11, 12]
        rooms_qs = Room.objects.filter(is_active=True)
        if classroom_only and not mixed_utilization:
            rooms_qs = rooms_qs.filter(room_type='CLASSROOM')
        rooms = list(rooms_qs.order_by('id'))
        rooms_by_type = defaultdict(list)
        for room in rooms:
            rooms_by_type[room.room_type].append(room)
        slots = [
            slot for slot in TimeSlot.objects.filter(is_active=True).order_by('start_time')
            if 'lunch' not in (slot.name or '').lower()
        ]

        if not rooms:
            raise CommandError('No active classroom rooms found. Please create classroom rooms first.')
        if not slots:
            raise CommandError('No active timeslots found. Please create timeslots first.')

        tag = f'ACADEMIC_CALENDAR_USER_{user_id}_{year}'
        purpose_pool = [
            'Regular Class Session',
            'Lecture and Discussion',
            'Laboratory Theory Session',
            'Course Consultation',
            'Assessment and Review',
            'Project Presentation Class',
            'Departmental Class Meeting',
        ]
        exam_purpose_pool = [
            'Midterm Examination',
            'Final Examination',
            'Comprehensive Assessment',
            'Practical Skills Evaluation',
        ]
        event_purpose_pool = [
            'Department Academic Event',
            'Student Organization Event',
            'University Seminar',
            'Research Colloquium',
        ]
        meeting_purpose_pool = [
            'Faculty Meeting',
            'Curriculum Planning Meeting',
            'Department Coordination Meeting',
            'Adviser Consultation Block',
        ]

        deleted_count = 0
        replaced_count = 0
        month_set = set(months)
        if replace_user_months:
            replaced_count, _ = Booking.objects.filter(
                user_id=user_id,
                date__year=year,
                date__month__in=month_set,
            ).delete()
        if reset_tagged:
            deleted_count, _ = Booking.objects.filter(
                user_id=user_id,
                date__year=year,
                notes__startswith=tag,
            ).delete()

        created_count = 0
        skipped_conflicts = 0
        month_counts = {}
        week_day_counts = {}
        room_equipment_cache = {room.id: self._room_equipment_summary(room) for room in rooms}

        for month in months:
            start = date(year, month, 1)
            end = self._month_end(year, month)
            month_rng = random.Random(f'academic-{user_id}-{year}-{month}-v1')

            blocked = set(
                Booking.objects.filter(
                    date__gte=start,
                    date__lte=end,
                    status__in=['APPROVED', 'CONFIRMED'],
                ).values_list('date', 'room_id', 'time_slot_id')
            )

            weekdays_by_week = defaultdict(list)
            current = start
            while current <= end:
                # Monday-Saturday only to model a 5-6 day class week.
                if current.weekday() <= 5:
                    week_key = current.isocalendar()[:2]
                    weekdays_by_week[week_key].append(current)
                current += timedelta(days=1)

            selected_days = []
            for week_key, week_days in sorted(weekdays_by_week.items()):
                target_days = 6 if month_rng.random() < 0.45 else 5
                target_days = min(target_days, len(week_days))
                selected_days.extend(month_rng.sample(week_days, target_days))

            selected_days = sorted(set(selected_days))
            week_day_counts[month] = len(selected_days)

            # Weekly high-utilization days: at least one day/week where all rooms can be used.
            high_utilization_days = set()
            selected_by_week = defaultdict(list)
            for d in selected_days:
                selected_by_week[d.isocalendar()[:2]].append(d)
            for _, week_days in selected_by_week.items():
                high_utilization_days.add(month_rng.choice(week_days))

            # Monthly event days (1-2 days) to emulate seminars and department activities.
            event_days = set()
            if selected_days:
                preferred = [d for d in selected_days if d.weekday() in {2, 4}]  # Wed/Fri
                source_days = preferred if preferred else selected_days
                event_pick_count = min(2, len(source_days))
                event_days.update(month_rng.sample(source_days, event_pick_count))

            month_new = []
            for class_day in selected_days:
                is_midterm_period = (month in {3, 10} and 10 <= class_day.day <= 21)
                is_finals_period = (month in {5, 12} and class_day.day >= 18)
                is_high_utilization_day = class_day in high_utilization_days
                is_event_day = class_day in event_days

                # Baseline class load plus exam/event pressure.
                day_sessions = month_rng.randint(7, 12)
                if is_midterm_period:
                    day_sessions += month_rng.randint(3, 6)
                if is_finals_period:
                    day_sessions += month_rng.randint(4, 7)
                if is_event_day:
                    day_sessions += 2
                if is_high_utilization_day:
                    day_sessions = max(day_sessions, len(rooms))

                day_candidates = []
                candidates_by_type = defaultdict(list)
                candidates_by_room = defaultdict(list)
                for room in rooms:
                    for slot in slots:
                        key = (class_day, room.id, slot.id)
                        if key in blocked:
                            continue
                        item = (key, room, slot)
                        day_candidates.append(item)
                        candidates_by_type[room.room_type].append(item)
                        candidates_by_room[room.id].append(item)

                if not day_candidates:
                    continue

                month_rng.shuffle(day_candidates)

                selected = []
                selected_keys = set()

                def pick_from_pool(pool, count):
                    if count <= 0 or not pool:
                        return
                    month_rng.shuffle(pool)
                    for item in pool:
                        if len(selected) >= day_sessions or count <= 0:
                            break
                        if item[0] in selected_keys:
                            continue
                        selected.append(item)
                        selected_keys.add(item[0])
                        count -= 1

                if mixed_utilization:
                    weekday = class_day.weekday()
                    classroom_target = max(1, int(day_sessions * 0.6))
                    lab_target = int(day_sessions * 0.2) + (1 if weekday in {1, 3} else 0)  # Tue/Thu lab focus
                    conference_target = int(day_sessions * 0.1) + (1 if weekday in {2, 4} else 0)  # Wed/Fri meetings
                    study_target = max(1, int(day_sessions * 0.08))
                    auditorium_target = 1 if (weekday == 0 and month_rng.random() < 0.35) else 0

                    # On high-utilization days, use at least one slot for every room when possible.
                    if is_high_utilization_day:
                        for room in rooms:
                            room_pool = candidates_by_room.get(room.id, [])
                            if not room_pool:
                                continue
                            month_rng.shuffle(room_pool)
                            pick = room_pool[0]
                            if pick[0] in selected_keys:
                                continue
                            selected.append(pick)
                            selected_keys.add(pick[0])

                    pick_from_pool(candidates_by_type.get('CLASSROOM', []), classroom_target)
                    pick_from_pool(candidates_by_type.get('LAB', []), lab_target)
                    pick_from_pool(candidates_by_type.get('CONFERENCE', []), conference_target)
                    pick_from_pool(candidates_by_type.get('STUDY_ROOM', []), study_target)
                    pick_from_pool(candidates_by_type.get('AUDITORIUM', []), auditorium_target)

                    if len(selected) < day_sessions:
                        pick_from_pool(day_candidates, day_sessions - len(selected))
                else:
                    selected = day_candidates[:day_sessions]
                    selected_keys = {item[0] for item in selected}

                if len(selected) < day_sessions:
                    skipped_conflicts += (day_sessions - len(selected))

                for key, room, slot in selected:
                    blocked.add(key)
                    participants = max(5, min(room.capacity, int(room.capacity * month_rng.uniform(0.45, 0.9))))
                    slot_label = self._slot_label(slot)
                    room_label = f"{room.name} ({room.building or 'N/A'} {room.floor or ''})".strip()

                    if is_midterm_period or is_finals_period:
                        purpose = month_rng.choice(exam_purpose_pool)
                    elif is_event_day and room.room_type in {'CONFERENCE', 'AUDITORIUM'}:
                        purpose = month_rng.choice(event_purpose_pool)
                    elif room.room_type == 'CONFERENCE' and class_day.weekday() == 4:
                        purpose = month_rng.choice(meeting_purpose_pool)
                    else:
                        purpose = month_rng.choice(purpose_pool)

                    month_new.append(Booking(
                        room=room,
                        user=user,
                        time_slot=slot,
                        date=class_day,
                        purpose=f"{purpose} | {room_label} | {slot_label}",
                        status='CONFIRMED',
                        priority=month_rng.choice(['MEDIUM', 'HIGH']),
                        participants_count=participants,
                        notes=(
                            f"{tag} | "
                            f"building={room.building or 'N/A'} | "
                            f"floor={room.floor or 'N/A'} | "
                            f"room_type={room.room_type} | "
                            f"description={(room.description or 'N/A')} | "
                            f"equipment={room_equipment_cache.get(room.id, 'None listed')} | "
                            f"timeslot={slot_label}"
                        ),
                    ))

            if month_new:
                Booking.objects.bulk_create(month_new, batch_size=500)
            month_counts[month] = len(month_new)
            created_count += len(month_new)

        self.stdout.write(self.style.SUCCESS('✓ Academic calendar booking population complete'))
        self.stdout.write(f'  Tag: {tag}')
        self.stdout.write(f'  Replaced existing user rows in target months: {replaced_count}')
        self.stdout.write(f'  Deleted tagged rows: {deleted_count}')
        self.stdout.write(f'  Created rows: {created_count}')
        self.stdout.write(f'  Skipped due to conflicts/capacity: {skipped_conflicts}')
        self.stdout.write(f'  Class days generated per month: {week_day_counts}')
        self.stdout.write(f'  Booking counts by month: {month_counts}')

    def _populate_bookings(self, user_id, year, months, min_per_month, max_per_month, reset_tagged):
        user_model = get_user_model()
        try:
            user = user_model.objects.get(id=user_id)
        except user_model.DoesNotExist as exc:
            raise CommandError(f'User with id={user_id} not found.') from exc

        rooms = list(Room.objects.filter(is_active=True).order_by('id'))
        slots = [
            slot for slot in TimeSlot.objects.filter(is_active=True).order_by('start_time')
            if 'lunch' not in (slot.name or '').lower()
        ]

        if not rooms:
            raise CommandError('No active rooms found. Create rooms first.')
        if not slots:
            raise CommandError('No active timeslots found. Create timeslots first.')

        room_equipment_cache = {room.id: self._room_equipment_summary(room) for room in rooms}

        tag = f'MOCK_DATA_USER_{user_id}_{year}_MONTHS_{"-".join(str(m) for m in months)}'
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

        deleted_count = 0
        if reset_tagged:
            deleted_count, _ = Booking.objects.filter(
                user_id=user_id,
                date__year=year,
                notes__startswith=tag,
            ).delete()

        created_count = 0
        conflict_skips = 0
        month_counts = {}
        month_targets = {}

        for month in months:
            start = date(year, month, 1)
            end = self._month_end(year, month)
            weekdays = []
            day = start
            while day <= end:
                if day.weekday() < 5:
                    weekdays.append(day)
                day += timedelta(days=1)

            if not weekdays:
                month_counts[month] = 0
                continue

            def current_month_count():
                return Booking.objects.filter(
                    user_id=user_id,
                    date__year=year,
                    date__month=month,
                    notes__startswith=tag,
                ).count()

            rng = random.Random(f'{user_id}-{year}-{month}-populate-sample-v1')
            target_for_month = rng.randint(min_per_month, max_per_month)
            target_for_month = max(target_for_month, len(rooms))
            month_targets[month] = target_for_month
            existing_count = current_month_count()
            needed = max(0, target_for_month - existing_count)

            if needed > 0:
                blocked = set(
                    Booking.objects.filter(
                        date__gte=start,
                        date__lte=end,
                        status__in=['APPROVED', 'CONFIRMED'],
                    ).values_list('date', 'room_id', 'time_slot_id')
                )
                already_tagged = set(
                    Booking.objects.filter(
                        user=user,
                        date__gte=start,
                        date__lte=end,
                        notes__startswith=tag,
                    ).values_list('date', 'room_id', 'time_slot_id')
                )

                candidates = []
                for current_day in weekdays:
                    for room in rooms:
                        for slot in slots:
                            key = (current_day, room.id, slot.id)
                            if key in blocked or key in already_tagged:
                                continue
                            candidates.append((key, current_day, room, slot))

                rng.shuffle(candidates)

                # Ensure each room has at least one booking in the month when possible.
                selected = []
                selected_keys = set()
                by_room = {}
                for item in candidates:
                    _, _, room, _ = item
                    by_room.setdefault(room.id, []).append(item)

                for room in rooms:
                    if len(selected) >= needed:
                        break
                    room_candidates = by_room.get(room.id, [])
                    if not room_candidates:
                        continue
                    pick = room_candidates[0]
                    selected.append(pick)
                    selected_keys.add(pick[0])

                if len(selected) < needed:
                    for item in candidates:
                        if len(selected) >= needed:
                            break
                        if item[0] in selected_keys:
                            continue
                        selected.append(item)
                        selected_keys.add(item[0])

                if len(selected) < needed:
                    conflict_skips += (needed - len(selected))

                new_bookings = []
                for _, current_day, room, slot in selected:
                    participants = max(5, min(room.capacity, int(room.capacity * rng.uniform(0.35, 0.85))))
                    room_label = f"{room.name} ({room.building or 'N/A'} {room.floor or ''})".strip()
                    slot_label = self._slot_label(slot)
                    new_bookings.append(Booking(
                        room=room,
                        user=user,
                        time_slot=slot,
                        date=current_day,
                        purpose=f"{rng.choice(purpose_pool)} | {room_label} | {slot_label}",
                        status='CONFIRMED',
                        priority=rng.choice(['MEDIUM', 'HIGH']),
                        participants_count=participants,
                        notes=(
                            f"{tag} | "
                            f"building={room.building or 'N/A'} | "
                            f"floor={room.floor or 'N/A'} | "
                            f"room_type={room.room_type} | "
                            f"description={(room.description or 'N/A')} | "
                            f"equipment={room_equipment_cache.get(room.id, 'None listed')} | "
                            f"timeslot={slot_label}"
                        ),
                    ))
                if new_bookings:
                    Booking.objects.bulk_create(new_bookings, batch_size=500)
                    created_count += len(new_bookings)

            month_counts[month] = current_month_count()

        self.stdout.write(self.style.SUCCESS('✓ Booking population complete'))
        self.stdout.write(f'  Tag: {tag}')
        self.stdout.write(f'  Deleted tagged rows: {deleted_count}')
        self.stdout.write(f'  Created rows: {created_count}')
        self.stdout.write(f'  Conflict skips: {conflict_skips}')
        self.stdout.write(f'  Month targets: {month_targets}')
        self.stdout.write(f'  Month counts: {month_counts}')

    def handle(self, *args, **options):
        user_id = options['user_id']
        year = options['year']
        months = self._parse_months(options['months'])
        min_per_month = max(1, int(options['min_per_month']))
        max_per_month = max(min_per_month, int(options['max_per_month']))
        reset_tagged = bool(options['reset_tagged'])
        bookings_only = bool(options['bookings_only'])
        academic_calendar = bool(options['academic_calendar'])
        classroom_only = bool(options['classroom_only'])
        replace_user_months = bool(options['replace_user_months'])
        mixed_utilization = bool(options['mixed_utilization'])

        if academic_calendar:
            with transaction.atomic():
                self._populate_academic_calendar_bookings(
                    user_id=user_id,
                    year=year,
                    reset_tagged=reset_tagged,
                    classroom_only=True if not classroom_only else classroom_only,
                    replace_user_months=replace_user_months,
                    mixed_utilization=mixed_utilization,
                )
            self.stdout.write(self.style.SUCCESS('✓ Sample data populated successfully!'))
            return

        if not bookings_only:
            # Create equipment
            equipment_data = [
                {'name': 'Projector', 'quantity': 10},
                {'name': 'Whiteboard', 'quantity': 15},
                {'name': 'Computers', 'quantity': 50},
                {'name': 'Microphone', 'quantity': 20},
                {'name': 'Camera', 'quantity': 8},
            ]

            equipment_objs = {}
            for eq_data in equipment_data:
                eq, created = Equipment.objects.get_or_create(
                    name=eq_data['name'],
                    defaults={'quantity': eq_data['quantity']}
                )
                equipment_objs[eq_data['name']] = eq
                if created:
                    self.stdout.write(f"Created equipment: {eq.name}")
                else:
                    self.stdout.write(f"Equipment already exists: {eq.name}")

            # Create rooms
            rooms_data = [
                {
                    'name': 'Lab A101',
                    'room_type': 'LAB',
                    'capacity': 30,
                    'floor': '1',
                    'building': 'Building A',
                    'equipment_list': ['Computers', 'Projector', 'Whiteboard']
                },
                {
                    'name': 'Lab B202',
                    'room_type': 'LAB',
                    'capacity': 25,
                    'floor': '2',
                    'building': 'Building B',
                    'equipment_list': ['Computers', 'Whiteboard', 'Camera']
                },
                {
                    'name': 'Conference Room C303',
                    'room_type': 'CONFERENCE',
                    'capacity': 15,
                    'floor': '3',
                    'building': 'Building C',
                    'equipment_list': ['Projector', 'Microphone', 'Camera']
                },
                {
                    'name': 'Classroom D101',
                    'room_type': 'CLASSROOM',
                    'capacity': 40,
                    'floor': '1',
                    'building': 'Building D',
                    'equipment_list': ['Projector', 'Whiteboard']
                },
                {
                    'name': 'Study Room E201',
                    'room_type': 'STUDY_ROOM',
                    'capacity': 8,
                    'floor': '2',
                    'building': 'Building E',
                    'equipment_list': ['Whiteboard']
                },
            ]

            for room_data in rooms_data:
                equipment_list = room_data.pop('equipment_list')
                room, created = Room.objects.get_or_create(
                    name=room_data['name'],
                    defaults=room_data
                )

                if created:
                    self.stdout.write(f"Created room: {room.name}")
                else:
                    self.stdout.write(f"Room already exists: {room.name}")

                # Assign equipment to room
                for eq_name in equipment_list:
                    if eq_name in equipment_objs:
                        _, created = RoomEquipment.objects.get_or_create(
                            room=room,
                            equipment=equipment_objs[eq_name],
                            defaults={'quantity': 1}
                        )
                        if created:
                            self.stdout.write(f"  Assigned {eq_name} to {room.name}")

        with transaction.atomic():
            self._populate_bookings(
                user_id=user_id,
                year=year,
                months=months,
                min_per_month=min_per_month,
                max_per_month=max_per_month,
                reset_tagged=reset_tagged,
            )

        self.stdout.write(self.style.SUCCESS('✓ Sample data populated successfully!'))
