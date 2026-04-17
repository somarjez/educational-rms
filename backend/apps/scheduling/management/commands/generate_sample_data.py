"""
Management command to populate the database with sample data for modeling and simulation.

Usage:
    python manage.py generate_sample_data
    python manage.py generate_sample_data --clear  # Clear existing data first
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta
import random

from apps.scheduling.models import Room, Equipment, RoomEquipment, TimeSlot, Booking, Waitlist
from apps.users.models import User
from apps.simulation.models import SimulationScenario, SimulationResult


class Command(BaseCommand):
    help = 'Generate sample data for modeling and simulation purposes'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before generating new data',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.clear_data()

        self.stdout.write(self.style.WARNING('Starting sample data generation...'))
        
        # Create users first
        users = self.create_users()
        self.stdout.write(self.style.SUCCESS(f'✓ Created {len(users)} users'))
        
        # Create rooms
        rooms = self.create_rooms()
        self.stdout.write(self.style.SUCCESS(f'✓ Created {len(rooms)} rooms'))
        
        # Create equipment
        equipment = self.create_equipment()
        self.stdout.write(self.style.SUCCESS(f'✓ Created {len(equipment)} equipment items'))
        
        # Assign equipment to rooms
        self.assign_equipment_to_rooms(rooms, equipment)
        self.stdout.write(self.style.SUCCESS('✓ Assigned equipment to rooms'))
        
        # Create time slots
        time_slots = self.create_time_slots()
        self.stdout.write(self.style.SUCCESS(f'✓ Created {len(time_slots)} time slots'))
        
        # Create bookings
        bookings = self.create_bookings(users, rooms, time_slots)
        self.stdout.write(self.style.SUCCESS(f'✓ Created {len(bookings)} bookings'))
        
        # Create waitlist entries
        waitlist = self.create_waitlist(users, rooms, time_slots)
        self.stdout.write(self.style.SUCCESS(f'✓ Created {len(waitlist)} waitlist entries'))
        
        # Create simulation scenarios
        scenarios = self.create_simulation_scenarios()
        self.stdout.write(self.style.SUCCESS(f'✓ Created {len(scenarios)} simulation scenarios'))
        
        self.stdout.write(self.style.SUCCESS('\n✅ Sample data generation completed successfully!'))
        self.print_summary(users, rooms, equipment, bookings, waitlist, scenarios)

    def clear_data(self):
        """Clear existing data"""
        self.stdout.write(self.style.WARNING('Clearing existing data...'))
        
        Booking.objects.all().delete()
        Waitlist.objects.all().delete()
        RoomEquipment.objects.all().delete()
        TimeSlot.objects.all().delete()
        Room.objects.all().delete()
        Equipment.objects.all().delete()
        SimulationResult.objects.all().delete()
        SimulationScenario.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()
        
        self.stdout.write(self.style.SUCCESS('✓ Data cleared'))

    def create_users(self):
        """Create sample users"""
        users = []
        
        # Admin users
        for i in range(2):
            user, created = User.objects.get_or_create(
                username=f'admin{i+1}',
                defaults={
                    'email': f'admin{i+1}@rms.edu',
                    'first_name': f'Admin',
                    'last_name': f'User{i+1}',
                    'role': User.Role.ADMIN,
                    'department': 'Administration',
                    'is_staff': True,
                    'is_superuser': False,
                }
            )
            if created:
                user.set_password('admin123')
                user.save()
            users.append(user)
        
        # Faculty users
        faculty_departments = ['Engineering', 'Science', 'Computer Science', 'Mathematics', 'Physics']
        for i in range(5):
            dept = faculty_departments[i % len(faculty_departments)]
            user, created = User.objects.get_or_create(
                username=f'faculty{i+1}',
                defaults={
                    'email': f'faculty{i+1}@rms.edu',
                    'first_name': f'Faculty',
                    'last_name': f'Prof{i+1}',
                    'role': User.Role.FACULTY,
                    'department': dept,
                }
            )
            if created:
                user.set_password('faculty123')
                user.save()
            users.append(user)
        
        # Student users
        for i in range(15):
            user, created = User.objects.get_or_create(
                username=f'student{i+1}',
                defaults={
                    'email': f'student{i+1}@rms.edu',
                    'first_name': f'Student',
                    'last_name': f'User{i+1}',
                    'role': User.Role.STUDENT,
                    'department': 'General Studies',
                }
            )
            if created:
                user.set_password('student123')
                user.save()
            users.append(user)
        
        return users

    def create_rooms(self):
        """Create sample rooms"""
        rooms_data = [
            # Computer Labs
            {
                'name': 'Computer Lab 101',
                'room_type': 'LAB',
                'capacity': 30,
                'floor': '1',
                'building': 'Engineering Building',
                'description': 'Modern computer lab with dual monitors',
                'features': ['Projector', 'Whiteboard', 'Computers', 'WiFi']
            },
            {
                'name': 'Computer Lab 102',
                'room_type': 'LAB',
                'capacity': 25,
                'floor': '1',
                'building': 'Engineering Building',
                'description': 'Programming lab with development tools',
                'features': ['Projector', 'Computers', 'WiFi', 'Networking Equipment']
            },
            {
                'name': 'Computer Lab 201',
                'room_type': 'LAB',
                'capacity': 28,
                'floor': '2',
                'building': 'Science Building',
                'description': 'Advanced computing lab',
                'features': ['Projector', 'Computers', 'High-Performance Network', 'WiFi']
            },
            
            # Classrooms
            {
                'name': 'Classroom A101',
                'room_type': 'CLASSROOM',
                'capacity': 40,
                'floor': '1',
                'building': 'Main Building',
                'description': 'Standard classroom',
                'features': ['Projector', 'Whiteboard', 'WiFi']
            },
            {
                'name': 'Classroom A102',
                'room_type': 'CLASSROOM',
                'capacity': 50,
                'floor': '1',
                'building': 'Main Building',
                'description': 'Larger classroom',
                'features': ['Projector', 'Whiteboard', 'WiFi', 'Interactive Display']
            },
            {
                'name': 'Classroom B101',
                'room_type': 'CLASSROOM',
                'capacity': 35,
                'floor': '1',
                'building': 'Building B',
                'description': 'Seminar classroom',
                'features': ['Whiteboard', 'WiFi']
            },
            {
                'name': 'Classroom B102',
                'room_type': 'CLASSROOM',
                'capacity': 45,
                'floor': '1',
                'building': 'Building B',
                'description': 'Lecture hall',
                'features': ['Projector', 'Whiteboard', 'WiFi', 'Recording Equipment']
            },
            
            # Conference Rooms
            {
                'name': 'Conference Room 1',
                'room_type': 'CONFERENCE',
                'capacity': 12,
                'floor': '3',
                'building': 'Main Building',
                'description': 'Small meeting room',
                'features': ['Projector', 'Video Conference', 'WiFi']
            },
            {
                'name': 'Conference Room 2',
                'room_type': 'CONFERENCE',
                'capacity': 20,
                'floor': '3',
                'building': 'Main Building',
                'description': 'Medium meeting room',
                'features': ['Projector', 'Video Conference', 'WiFi', 'Whiteboard']
            },
            
            # Auditorium
            {
                'name': 'Main Auditorium',
                'room_type': 'AUDITORIUM',
                'capacity': 200,
                'floor': '1',
                'building': 'Main Building',
                'description': 'Large capacity auditorium',
                'features': ['Projector', 'Sound System', 'Video Conference', 'Recording Equipment', 'WiFi']
            },
            
            # Study Rooms
            {
                'name': 'Study Room 1',
                'room_type': 'STUDY_ROOM',
                'capacity': 8,
                'floor': '2',
                'building': 'Library Building',
                'description': 'Small group study room',
                'features': ['Whiteboard', 'WiFi']
            },
            {
                'name': 'Study Room 2',
                'room_type': 'STUDY_ROOM',
                'capacity': 8,
                'floor': '2',
                'building': 'Library Building',
                'description': 'Small group study room',
                'features': ['Whiteboard', 'WiFi']
            },
            {
                'name': 'Study Room 3',
                'room_type': 'STUDY_ROOM',
                'capacity': 10,
                'floor': '3',
                'building': 'Library Building',
                'description': 'Medium study room',
                'features': ['Whiteboard', 'Projector', 'WiFi']
            },
        ]
        
        rooms = []
        for room_data in rooms_data:
            room, created = Room.objects.get_or_create(
                name=room_data['name'],
                defaults=room_data
            )
            rooms.append(room)
        
        return rooms

    def create_equipment(self):
        """Create sample equipment"""
        equipment_data = [
            {'name': 'Projector', 'category': 'Audio-Visual', 'quantity': 15, 'description': 'Standard classroom projector'},
            {'name': 'Interactive Whiteboard', 'category': 'Interactive', 'quantity': 8, 'description': 'Smart interactive whiteboard'},
            {'name': 'Document Camera', 'category': 'Audio-Visual', 'quantity': 5, 'description': 'For document projection'},
            {'name': 'Microphone System', 'category': 'Audio', 'quantity': 10, 'description': 'Wireless microphone with speakers'},
            {'name': 'Video Conference Kit', 'category': 'Communication', 'quantity': 6, 'description': 'Complete video conferencing solution'},
            {'name': 'Laptop Cart', 'category': 'Computing', 'quantity': 4, 'description': 'Mobile laptop charging and storage cart'},
            {'name': 'Smartboard', 'category': 'Interactive', 'quantity': 3, 'description': 'Advanced smart board system'},
            {'name': 'Oscilloscope', 'category': 'Lab Equipment', 'quantity': 10, 'description': 'Digital oscilloscope for electronics lab'},
            {'name': 'Multimeter', 'category': 'Lab Equipment', 'quantity': 20, 'description': 'Digital multimeter set'},
            {'name': 'Microscope', 'category': 'Lab Equipment', 'quantity': 12, 'description': 'Binocular microscope'},
            {'name': 'Power Supply', 'category': 'Lab Equipment', 'quantity': 15, 'description': 'Adjustable power supply unit'},
            {'name': 'Function Generator', 'category': 'Lab Equipment', 'quantity': 8, 'description': 'Signal function generator'},
        ]
        
        equipment = []
        for eq_data in equipment_data:
            eq, created = Equipment.objects.get_or_create(
                name=eq_data['name'],
                defaults=eq_data
            )
            equipment.append(eq)
        
        return equipment

    def assign_equipment_to_rooms(self, rooms, equipment):
        """Assign equipment to rooms"""
        room_equipment_assignments = {
            'Computer Lab 101': ['Projector', 'Laptop Cart', 'Microphone System'],
            'Computer Lab 102': ['Projector', 'Smartboard', 'Video Conference Kit'],
            'Computer Lab 201': ['Projector', 'Interactive Whiteboard', 'Microphone System'],
            'Classroom A101': ['Projector', 'Document Camera'],
            'Classroom A102': ['Projector', 'Interactive Whiteboard', 'Microphone System'],
            'Classroom B101': ['Projector', 'Document Camera'],
            'Classroom B102': ['Projector', 'Smartboard', 'Microphone System'],
            'Conference Room 1': ['Projector', 'Video Conference Kit'],
            'Conference Room 2': ['Projector', 'Video Conference Kit', 'Smartboard'],
            'Main Auditorium': ['Projector', 'Microphone System', 'Video Conference Kit'],
            'Study Room 1': ['Projector'],
            'Study Room 2': ['Projector'],
            'Study Room 3': ['Projector', 'Interactive Whiteboard'],
        }
        
        equipment_map = {eq.name: eq for eq in equipment}
        
        for room in rooms:
            if room.name in room_equipment_assignments:
                for eq_name in room_equipment_assignments[room.name]:
                    if eq_name in equipment_map:
                        RoomEquipment.objects.get_or_create(
                            room=room,
                            equipment=equipment_map[eq_name],
                            defaults={'quantity': 1}
                        )

    def create_time_slots(self):
        """Create standard time slots for the day"""
        slots_data = [
            {'name': 'Period 1', 'start_time': '08:00', 'end_time': '09:00', 'days_of_week': [0, 1, 2, 3, 4]},
            {'name': 'Period 2', 'start_time': '09:00', 'end_time': '10:00', 'days_of_week': [0, 1, 2, 3, 4]},
            {'name': 'Period 3', 'start_time': '10:00', 'end_time': '11:00', 'days_of_week': [0, 1, 2, 3, 4]},
            {'name': 'Period 4', 'start_time': '11:00', 'end_time': '12:00', 'days_of_week': [0, 1, 2, 3, 4]},
            {'name': 'Lunch Break', 'start_time': '12:00', 'end_time': '13:00', 'days_of_week': [0, 1, 2, 3, 4]},
            {'name': 'Period 5', 'start_time': '13:00', 'end_time': '14:00', 'days_of_week': [0, 1, 2, 3, 4]},
            {'name': 'Period 6', 'start_time': '14:00', 'end_time': '15:00', 'days_of_week': [0, 1, 2, 3, 4]},
            {'name': 'Period 7', 'start_time': '15:00', 'end_time': '16:00', 'days_of_week': [0, 1, 2, 3, 4]},
            {'name': 'Period 8', 'start_time': '16:00', 'end_time': '17:00', 'days_of_week': [0, 1, 2, 3, 4]},
            {'name': 'Evening 1', 'start_time': '17:00', 'end_time': '18:00', 'days_of_week': [0, 1, 2, 3, 4]},
            {'name': 'Evening 2', 'start_time': '18:00', 'end_time': '19:00', 'days_of_week': [0, 1, 2, 3, 4]},
        ]
        
        time_slots = []
        for slot_data in slots_data:
            start_time = datetime.strptime(slot_data['start_time'], '%H:%M').time()
            end_time = datetime.strptime(slot_data['end_time'], '%H:%M').time()
            
            slot, created = TimeSlot.objects.get_or_create(
                name=slot_data['name'],
                defaults={
                    'start_time': start_time,
                    'end_time': end_time,
                    'days_of_week': slot_data['days_of_week'],
                }
            )
            time_slots.append(slot)
        
        return time_slots

    def create_bookings(self, users, rooms, time_slots):
        """Create sample bookings"""
        bookings = []
        today = timezone.now().date()
        
        # Generate bookings for the next 30 days
        faculty = [u for u in users if u.role == User.Role.FACULTY]
        students = [u for u in users if u.role == User.Role.STUDENT]
        
        statuses = ['CONFIRMED', 'APPROVED', 'PENDING']
        purposes = [
            'Lecture',
            'Laboratory Work',
            'Group Project',
            'Examination',
            'Seminar',
            'Tutorial',
            'Presentation',
            'Study Session',
            'Meeting',
            'Workshop'
        ]
        
        for day_offset in range(30):
            booking_date = today + timedelta(days=day_offset)
            
            # Skip weekends
            if booking_date.weekday() >= 5:
                continue
            
            # Create 3-7 bookings per day
            num_bookings = random.randint(3, 7)
            
            for _ in range(num_bookings):
                room = random.choice(rooms)
                slot = random.choice(time_slots)
                
                # 70% by faculty, 30% by students
                user = random.choice(faculty) if random.random() < 0.7 else random.choice(students)
                
                try:
                    booking, created = Booking.objects.get_or_create(
                        room=room,
                        user=user,
                        time_slot=slot,
                        date=booking_date,
                        defaults={
                            'purpose': random.choice(purposes),
                            'status': random.choice(statuses),
                            'priority': random.choice(['LOW', 'MEDIUM', 'HIGH']),
                            'participants_count': random.randint(5, min(50, room.capacity)),
                        }
                    )
                    if created:
                        bookings.append(booking)
                except Exception as e:
                    # Silently skip duplicate or invalid bookings
                    pass
        
        return bookings

    def create_waitlist(self, users, rooms, time_slots):
        """Create sample waitlist entries"""
        waitlist_entries = []
        today = timezone.now().date()
        
        faculty = [u for u in users if u.role == User.Role.FACULTY]
        students = [u for u in users if u.role == User.Role.STUDENT]
        
        purposes = [
            'Lecture',
            'Laboratory Work',
            'Group Project',
            'Examination',
            'Seminar',
        ]
        
        # Create waitlist entries for the next 15 days
        for day_offset in range(15):
            waitlist_date = today + timedelta(days=day_offset)
            
            if waitlist_date.weekday() >= 5:
                continue
            
            # Create 0-3 waitlist entries per day
            num_entries = random.randint(0, 3)
            
            for _ in range(num_entries):
                room = random.choice(rooms)
                slot = random.choice(time_slots)
                user = random.choice(faculty) if random.random() < 0.6 else random.choice(students)
                
                try:
                    waitlist_entry, created = Waitlist.objects.get_or_create(
                        room=room,
                        user=user,
                        time_slot=slot,
                        date=waitlist_date,
                        defaults={
                            'purpose': random.choice(purposes),
                            'priority': random.choice(['MEDIUM', 'HIGH', 'URGENT']),
                            'participants_count': random.randint(5, min(50, room.capacity)),
                            'is_fulfilled': random.choice([True, False]),
                        }
                    )
                    if created:
                        waitlist_entries.append(waitlist_entry)
                except Exception:
                    pass
        
        return waitlist_entries

    def create_simulation_scenarios(self):
        """Create sample simulation scenarios"""
        scenarios_data = [
            {
                'name': 'Base Case - Current Capacity',
                'description': 'Simulation based on current room and equipment capacity',
                'parameters': {
                    'enrollment_multiplier': 1.0,
                    'additional_rooms': 0,
                    'booking_duration_hours': 1.0,
                    'peak_hours': [10, 11, 14, 15],
                }
            },
            {
                'name': 'Growth Scenario - 20% Enrollment Increase',
                'description': 'What if enrollment increases by 20%',
                'parameters': {
                    'enrollment_multiplier': 1.2,
                    'additional_rooms': 0,
                    'booking_duration_hours': 1.0,
                    'peak_hours': [10, 11, 14, 15],
                }
            },
            {
                'name': 'Growth Scenario - 30% Enrollment Increase',
                'description': 'What if enrollment increases by 30%',
                'parameters': {
                    'enrollment_multiplier': 1.3,
                    'additional_rooms': 1,
                    'booking_duration_hours': 1.0,
                    'peak_hours': [10, 11, 14, 15],
                }
            },
            {
                'name': 'Shortage Scenario - 1 Lab Closed',
                'description': 'Impact of closing one computer lab',
                'parameters': {
                    'enrollment_multiplier': 1.0,
                    'rooms_closed': 1,
                    'closed_room_type': 'LAB',
                    'booking_duration_hours': 1.0,
                }
            },
            {
                'name': 'Expansion Scenario - 2 New Rooms',
                'description': 'Adding 2 new classrooms',
                'parameters': {
                    'enrollment_multiplier': 1.15,
                    'additional_rooms': 2,
                    'additional_room_type': 'CLASSROOM',
                    'booking_duration_hours': 1.0,
                }
            },
            {
                'name': 'Peak Hour Stress Test',
                'description': 'Concentrated demand during peak hours only',
                'parameters': {
                    'enrollment_multiplier': 1.5,
                    'peak_hours_only': True,
                    'peak_hours': [10, 11, 14, 15, 16],
                    'booking_duration_hours': 1.0,
                }
            },
            {
                'name': 'Extended Hours Scenario',
                'description': 'What if facilities open until 8 PM',
                'parameters': {
                    'enrollment_multiplier': 1.0,
                    'additional_hours_start': 17,
                    'additional_hours_end': 20,
                    'booking_duration_hours': 1.0,
                }
            },
        ]
        
        scenarios = []
        for scenario_data in scenarios_data:
            scenario, created = SimulationScenario.objects.get_or_create(
                name=scenario_data['name'],
                defaults={
                    'description': scenario_data['description'],
                    'parameters': scenario_data['parameters'],
                    'num_replications': 1000,
                }
            )
            scenarios.append(scenario)
        
        return scenarios

    def print_summary(self, users, rooms, equipment, bookings, waitlist, scenarios):
        """Print summary of generated data"""
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('DATA GENERATION SUMMARY'))
        self.stdout.write('='*60)
        
        user_summary = {
            'Admins': len([u for u in users if u.role == User.Role.ADMIN]),
            'Faculty': len([u for u in users if u.role == User.Role.FACULTY]),
            'Students': len([u for u in users if u.role == User.Role.STUDENT]),
        }
        
        room_summary = {}
        for room in rooms:
            room_type = room.get_room_type_display()
            room_summary[room_type] = room_summary.get(room_type, 0) + 1
        
        self.stdout.write('\n📊 USERS:')
        for role, count in user_summary.items():
            self.stdout.write(f'   {role}: {count}')
        
        self.stdout.write('\n🏫 ROOMS:')
        for room_type, count in room_summary.items():
            self.stdout.write(f'   {room_type}: {count}')
        
        self.stdout.write(f'\n🖥️  EQUIPMENT: {len(equipment)} types')
        
        self.stdout.write(f'\n📅 BOOKINGS: {len(bookings)} total')
        booking_status = {}
        for booking in bookings:
            booking_status[booking.status] = booking_status.get(booking.status, 0) + 1
        for status, count in booking_status.items():
            self.stdout.write(f'   {status}: {count}')
        
        self.stdout.write(f'\n⏳ WAITLIST: {len(waitlist)} entries')
        
        self.stdout.write(f'\n🧪 SIMULATION SCENARIOS: {len(scenarios)}')
        for scenario in scenarios:
            self.stdout.write(f'   • {scenario.name}')
        
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('✨ All data generated successfully!\n'))
