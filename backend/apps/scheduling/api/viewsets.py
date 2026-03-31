"""Views for scheduling app."""
from rest_framework import viewsets, status, filters
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count, Sum, F, IntegerField, ExpressionWrapper
from django.db.models.functions import Coalesce
from django.utils import timezone
from datetime import datetime, timedelta, time
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError

from ..models import Booking, Room, TimeSlot, Equipment, Waitlist
from .serializers import (
    BookingSerializer, BookingCreateSerializer, BookingUpdateSerializer,
    BookingApprovalSerializer, RoomSerializer, RoomListSerializer,
    TimeSlotSerializer, EquipmentSerializer, WaitlistSerializer,
    CalendarEventSerializer
)
from api.permissions import IsAdminUser, IsFacultyOrAdmin


class BookingPagination(PageNumberPagination):
    """Default booking pagination for responsive booking list rendering."""
    page_size = 15
    page_size_query_param = 'page_size'
    max_page_size = 100


class EquipmentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing equipment."""
    queryset = Equipment.objects.all()
    serializer_class = EquipmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'category', 'description']
    ordering_fields = ['name', 'quantity', 'created_at']
    ordering = ['name']
    
    def get_permissions(self):
        """Admin only for create, update, delete."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def get_queryset(self):
        """Filter equipment based on parameters."""
        queryset = Equipment.objects.annotate(
            assigned_total=Coalesce(Sum('equipment_rooms__quantity'), 0),
            available_total=ExpressionWrapper(
                F('quantity') - Coalesce(Sum('equipment_rooms__quantity'), 0),
                output_field=IntegerField()
            ),
        )

        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__iexact=category)

        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        return queryset


class RoomViewSet(viewsets.ModelViewSet):
    """ViewSet for managing rooms/labs."""
    queryset = Room.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'building', 'room_type']
    ordering_fields = ['name', 'capacity', 'room_type', 'created_at']
    ordering = ['name']
    
    def get_serializer_class(self):
        """Use lightweight serializer for list view."""
        if self.action == 'list':
            return RoomListSerializer
        return RoomSerializer
    
    def get_permissions(self):
        """Admin only for create, update, delete."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """Filter queryset based on parameters."""
        queryset = Room.objects.all()
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Filter by room type
        room_type = self.request.query_params.get('room_type')
        if room_type:
            queryset = queryset.filter(room_type=room_type)
        
        # Filter by minimum capacity
        min_capacity = self.request.query_params.get('min_capacity')
        if min_capacity:
            queryset = queryset.filter(capacity__gte=int(min_capacity))
        
        # Filter by equipment
        equipment_id = self.request.query_params.get('equipment_id')
        if equipment_id:
            queryset = queryset.filter(room_equipment__equipment__id=equipment_id)

        # Filter by equipment category
        equipment_category = self.request.query_params.get('equipment_category')
        if equipment_category:
            queryset = queryset.filter(room_equipment__equipment__category__iexact=equipment_category)

        # Filter by availability and/or date
        date_str = self.request.query_params.get('date')
        availability = self.request.query_params.get('availability')
        if date_str:
            try:
                target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                raise ValidationError('Invalid date format. Use YYYY-MM-DD')

            booked_room_ids = Booking.objects.filter(
                date=target_date,
                status__in=['APPROVED', 'CONFIRMED']
            ).values_list('room_id', flat=True)

            if availability:
                availability_value = availability.lower()
                if availability_value in ['true', 'available', 'yes', '1']:
                    queryset = queryset.exclude(id__in=booked_room_ids)
                elif availability_value in ['false', 'unavailable', 'no', '0']:
                    queryset = queryset.filter(id__in=booked_room_ids)
            else:
                queryset = queryset.filter(id__in=booked_room_ids)
        
        # Optimize queries - prefetch room_equipment for list view
        if self.action == 'list':
            queryset = queryset.annotate(
                equipment_count=Count('room_equipment', distinct=True)
            ).prefetch_related('room_equipment')
        else:
            queryset = queryset.prefetch_related('room_equipment__equipment')

        return queryset.distinct()
    
    @action(detail=True, methods=['get'])
    def availability(self, request, pk=None):
        """Get room availability for a specific date."""
        room = self.get_object()
        date_str = request.query_params.get('date')
        
        if not date_str:
            return Response(
                {'error': 'Date parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get all time slots
        time_slots = TimeSlot.objects.filter(is_active=True)
        weekday = target_date.weekday()
        
        # Get bookings for this room on this date
        bookings = Booking.objects.filter(
            room=room,
            date=target_date,
            status__in=['APPROVED', 'CONFIRMED']
        ).values_list('time_slot_id', flat=True)
        
        availability = []
        for slot in time_slots:
            slot_days = []
            if slot.days_of_week:
                try:
                    slot_days = [int(d) for d in slot.days_of_week]
                except (TypeError, ValueError):
                    slot_days = []

            if slot_days and weekday not in slot_days:
                continue

            availability.append({
                'time_slot': TimeSlotSerializer(slot).data,
                'is_available': slot.id not in bookings
            })
        
        return Response(availability)
    
    @action(detail=True, methods=['post'])
    def add_equipment(self, request, pk=None):
        """Add equipment to a room."""
        room = self.get_object()
        equipment_ids = request.data.get('equipment_ids', [])
        
        equipment_objects = Equipment.objects.filter(id__in=equipment_ids)
        room.equipment.add(*equipment_objects)
        
        return Response(RoomSerializer(room).data)
    
    @action(detail=True, methods=['post'])
    def remove_equipment(self, request, pk=None):
        """Remove equipment from a room."""
        room = self.get_object()
        equipment_ids = request.data.get('equipment_ids', [])
        
        equipment_objects = Equipment.objects.filter(id__in=equipment_ids)
        room.equipment.remove(*equipment_objects)
        
        return Response(RoomSerializer(room).data)


class TimeSlotViewSet(viewsets.ModelViewSet):
    """ViewSet for managing time slots."""
    queryset = TimeSlot.objects.all()
    serializer_class = TimeSlotSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['start_time', 'end_time', 'slot_type']
    ordering = ['start_time']
    
    def get_permissions(self):
        """Admin only for create, update, delete."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """Filter queryset based on parameters."""
        queryset = TimeSlot.objects.all()
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Filter by slot type
        slot_type = self.request.query_params.get('slot_type')
        if slot_type:
            queryset = queryset.filter(slot_type=slot_type)
        
        return queryset


class BookingViewSet(viewsets.ModelViewSet):
    """ViewSet for managing bookings."""
    queryset = Booking.objects.all()
    permission_classes = [IsAuthenticated]
    pagination_class = BookingPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['purpose', 'room__name', 'user__email']
    ordering_fields = ['date', 'created_at', 'priority', 'status']
    ordering = ['-date', '-time_slot__start_time']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return BookingCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return BookingUpdateSerializer
        elif self.action in ['approve', 'reject']:
            return BookingApprovalSerializer
        return BookingSerializer
    
    def get_permissions(self):
        """Permission based on action."""
        if self.action in ['approve', 'reject', 'override_conflict', 'bulk_cancel', 'bulk_delete']:
            return [IsAdminUser()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """Filter queryset based on user role and parameters."""
        user = self.request.user
        queryset = Booking.objects.select_related('room', 'user', 'time_slot', 'approved_by')
        
        # Admin sees all, others see only their bookings
        if not user.role.upper().upper() == 'ADMIN':
            queryset = queryset.filter(user=user)
        
        # Filter by status
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by room
        room_id = self.request.query_params.get('room_id')
        if room_id:
            queryset = queryset.filter(room_id=room_id)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        # Filter by user (admin only)
        user_id = self.request.query_params.get('user_id')
        if user_id and user.role == 'ADMIN':
            queryset = queryset.filter(user_id=user_id)
        
        # Filter recurring bookings
        is_recurring = self.request.query_params.get('is_recurring')
        if is_recurring is not None:
            queryset = queryset.filter(is_recurring=is_recurring.lower() == 'true')
        
        return queryset
    
    def perform_create(self, serializer):
        """Create booking with additional logic."""
        user = self.request.user
        
        # If not admin and trying to override conflict, reject
        if serializer.validated_data.get('conflict_override') and user.role != 'ADMIN':
            raise ValidationError("Only admins can override conflicts")
        
        # Set user if not provided
        if 'user' not in serializer.validated_data:
            serializer.validated_data['user'] = user
        
        try:
            booking = serializer.save()
            
            # Don't create recurring instances immediately
            # They will be created when the booking is approved
            
        except DjangoValidationError as e:
            raise ValidationError(str(e))
    
    def _create_recurring_instances(self, parent_booking):
        """Create recurring booking instances."""
        current_date = parent_booking.date
        end_date = parent_booking.recurrence_end_date
        pattern = parent_booking.recurrence_pattern
        
        instances = []
        while current_date <= end_date:
            # Calculate next date based on pattern
            if pattern == 'DAILY':
                current_date += timedelta(days=1)
            elif pattern == 'WEEKLY':
                current_date += timedelta(weeks=1)
            elif pattern == 'BIWEEKLY':
                current_date += timedelta(weeks=2)
            elif pattern == 'MONTHLY':
                # Add one month
                month = current_date.month + 1
                year = current_date.year
                if month > 12:
                    month = 1
                    year += 1
                current_date = current_date.replace(year=year, month=month)
            else:
                break
            
            if current_date <= end_date:
                # Check for conflicts
                conflict_exists = Booking.objects.filter(
                    room=parent_booking.room,
                    date=current_date,
                    time_slot=parent_booking.time_slot,
                    status__in=['APPROVED', 'CONFIRMED']
                ).exists()
                
                if not conflict_exists or parent_booking.conflict_override:
                    instance = Booking.objects.create(
                        room=parent_booking.room,
                        user=parent_booking.user,
                        time_slot=parent_booking.time_slot,
                        date=current_date,
                        purpose=parent_booking.purpose,
                        status=parent_booking.status,
                        priority=parent_booking.priority,
                        participants_count=parent_booking.participants_count,
                        is_recurring=True,
                        parent_booking=parent_booking,
                        conflict_override=parent_booking.conflict_override,
                        notes=parent_booking.notes
                    )
                    instances.append(instance)
        
        return instances
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a booking request."""
        booking = self.get_object()
        
        if booking.status != 'PENDING':
            return Response(
                {'error': 'Only pending bookings can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking.status = 'APPROVED'
        booking.approved_by = request.user
        booking.notes = request.data.get('notes', booking.notes)
        booking.save()
        
        # If this is a recurring booking without a parent, create all instances
        if booking.is_recurring and not booking.parent_booking and booking.recurrence_end_date:
            self._create_recurring_instances(booking)
        
        # Check and fulfill waitlist if this was a cancellation replacement
        self._check_waitlist(booking.room, booking.date, booking.time_slot)
        
        return Response(BookingSerializer(booking).data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a booking request."""
        booking = self.get_object()
        
        if booking.status != 'PENDING':
            return Response(
                {'error': 'Only pending bookings can be rejected'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking.status = 'REJECTED'
        booking.approved_by = request.user
        booking.notes = request.data.get('notes', booking.notes)
        booking.save()
        
        # No need to handle instances - they don't exist yet for pending recurring bookings
        
        return Response(BookingSerializer(booking).data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a booking."""
        booking = self.get_object()
        user = request.user
        
        # Check permissions
        if booking.user != user and user.role != 'ADMIN':
            return Response(
                {'error': 'You do not have permission to cancel this booking'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if booking.status in ['CANCELLED', 'COMPLETED']:
            return Response(
                {'error': f'Cannot cancel a {booking.status.lower()} booking'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking.status = 'CANCELLED'
        booking.notes = request.data.get('notes', booking.notes)
        booking.save()
        
        # Cancel recurring instances if this is a parent booking
        if booking.is_recurring and not booking.parent_booking:
            cancel_all = request.data.get('cancel_all_recurring', False)
            if cancel_all:
                Booking.objects.filter(parent_booking=booking).update(status='CANCELLED')
        
        # Check waitlist
        self._check_waitlist(booking.room, booking.date, booking.time_slot)
        
        return Response(BookingSerializer(booking).data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def override_conflict(self, request, pk=None):
        """Override conflict detection for a booking."""
        booking = self.get_object()
        
        override_reason = request.data.get('override_reason', '')
        if not override_reason:
            return Response(
                {'error': 'Override reason is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking.conflict_override = True
        booking.override_reason = override_reason
        booking.approved_by = request.user
        booking.save()
        
        return Response(BookingSerializer(booking).data)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def bulk_cancel(self, request):
        """Bulk cancel bookings."""
        booking_ids = request.data.get('booking_ids', [])
        notes = request.data.get('notes', 'Bulk cancelled by admin')
        
        if not booking_ids:
            return Response(
                {'error': 'booking_ids list is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        updated = Booking.objects.filter(
            id__in=booking_ids
        ).exclude(
            status__in=['CANCELLED', 'COMPLETED']
        ).update(
            status='CANCELLED',
            notes=notes
        )
        
        return Response({
            'message': f'Successfully cancelled {updated} bookings',
            'cancelled_count': updated
        })

    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def bulk_delete(self, request):
        """Bulk delete cancelled bookings."""
        booking_ids = request.data.get('booking_ids', [])
        
        if not booking_ids:
            return Response(
                {'error': 'booking_ids list is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Only delete cancelled bookings
        deleted_count, _ = Booking.objects.filter(
            id__in=booking_ids,
            status='CANCELLED'
        ).delete()
        
        return Response({
            'message': f'Successfully deleted {deleted_count} bookings',
            'deleted_count': deleted_count
        })
    
    @action(detail=False, methods=['get'])
    def calendar(self, request):
        """Get bookings for calendar view."""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        # Try to get room_ids from comma-separated parameter first
        room_ids = request.query_params.get('room_ids')
        if room_ids:
            # Handle comma-separated format
            room_ids = [int(rid.strip()) for rid in room_ids.split(',') if rid.strip()]
        else:
            # Fallback to array format and convert to integers
            room_ids = request.query_params.getlist('room_ids[]')
            if room_ids:
                try:
                    room_ids = [int(rid) for rid in room_ids if rid]
                except (ValueError, TypeError):
                    room_ids = []
        
        if not start_date or not end_date:
            return Response(
                {'error': 'start_date and end_date are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Build query
        queryset = Booking.objects.filter(
            date__gte=start_date,
            date__lte=end_date
        ).select_related('room', 'user', 'time_slot')
        
        if room_ids:
            queryset = queryset.filter(room_id__in=room_ids)
        
        # Transform to calendar events
        events = []
        for booking in queryset:
            # Combine date and time
            start_datetime = datetime.combine(booking.date, booking.time_slot.start_time)
            end_datetime = datetime.combine(booking.date, booking.time_slot.end_time)
            
            user_name = booking.user.get_full_name() if hasattr(booking.user, 'get_full_name') and booking.user.get_full_name() else booking.user.email
            
            events.append({
                'id': booking.id,
                'title': f"{booking.room.name} - {user_name}",
                'start': start_datetime.isoformat(),
                'end': end_datetime.isoformat(),
                'resource_id': booking.room.id,
                'resource_name': booking.room.name,
                'status': booking.status,
                'user_name': user_name,
                'participants_count': booking.participants_count,
                'purpose': booking.purpose,
                'priority': booking.priority,
                'is_recurring': booking.is_recurring
            })
        
        return Response(events)
    
    @action(detail=True, methods=['patch'])
    def drag_update(self, request, pk=None):
        """Update booking when dragged to new time/date."""
        booking = self.get_object()
        user = request.user
        
        # Only admin can drag any booking
        if user.role != 'ADMIN' and booking.user != user:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        new_date = request.data.get('date')
        new_time_slot_id = request.data.get('time_slot_id')
        new_room_id = request.data.get('room_id')
        
        if new_date:
            booking.date = new_date
        if new_time_slot_id:
            booking.time_slot_id = new_time_slot_id
        if new_room_id:
            booking.room_id = new_room_id
        
        # Check for conflicts
        if user.role != 'ADMIN':
            conflicts = Booking.objects.filter(
                room=booking.room,
                date=booking.date,
                time_slot=booking.time_slot,
                status__in=['APPROVED', 'CONFIRMED']
            ).exclude(pk=booking.pk)
            
            if conflicts.exists():
                return Response(
                    {'error': 'This time slot is already booked'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        booking.save()
        return Response(BookingSerializer(booking).data)
    
    def _check_waitlist(self, room, date, time_slot):
        """Check waitlist and auto-approve if slot available."""
        waitlist_entries = Waitlist.objects.filter(
            room=room,
            date=date,
            time_slot=time_slot,
            is_fulfilled=False
        ).order_by('-priority', 'created_at')
        
        if waitlist_entries.exists():
            entry = waitlist_entries.first()
            # Create booking from waitlist
            booking = Booking.objects.create(
                room=entry.room,
                user=entry.user,
                time_slot=entry.time_slot,
                date=entry.date,
                purpose=entry.purpose,
                status='APPROVED',
                priority=entry.priority,
                participants_count=entry.participants_count,
                notes=f"Auto-approved from waitlist: {entry.notes}"
            )
            entry.is_fulfilled = True
            entry.fulfilled_booking = booking
            entry.save()


class WaitlistViewSet(viewsets.ModelViewSet):
    """ViewSet for managing waitlists."""
    queryset = Waitlist.objects.all()
    serializer_class = WaitlistSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['priority', 'created_at', 'date']
    ordering = ['-priority', 'created_at']
    
    def get_permissions(self):
        """Permission based on action."""
        if self.action in ['prioritize', 'bulk_fulfill']:
            return [IsAdminUser()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """Filter queryset based on user role."""
        user = self.request.user
        queryset = Waitlist.objects.select_related('room', 'user', 'time_slot', 'fulfilled_booking')
        
        # Admin sees all, others see only their entries
        if user.role != 'ADMIN':
            queryset = queryset.filter(user=user)
        
        # Filter by fulfilled status
        is_fulfilled = self.request.query_params.get('is_fulfilled')
        if is_fulfilled is not None:
            queryset = queryset.filter(is_fulfilled=is_fulfilled.lower() == 'true')
        
        # Filter by room
        room_id = self.request.query_params.get('room_id')
        if room_id:
            queryset = queryset.filter(room_id=room_id)
        
        return queryset
    
    def perform_create(self, serializer):
        """Create waitlist entry."""
        if 'user' not in serializer.validated_data:
            serializer.save(user=self.request.user)
        else:
            serializer.save()
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def prioritize(self, request, pk=None):
        """Change priority of a waitlist entry."""
        entry = self.get_object()
        new_priority = request.data.get('priority')
        
        if not new_priority:
            return Response(
                {'error': 'Priority is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        entry.priority = new_priority
        entry.save()
        
        return Response(WaitlistSerializer(entry).data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def fulfill(self, request, pk=None):
        """Manually fulfill a waitlist entry by creating a booking."""
        entry = self.get_object()
        
        if entry.is_fulfilled:
            return Response(
                {'error': 'This waitlist entry is already fulfilled'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if slot is available
        conflicts = Booking.objects.filter(
            room=entry.room,
            date=entry.date,
            time_slot=entry.time_slot,
            status__in=['APPROVED', 'CONFIRMED']
        ).exists()
        
        if conflicts:
            return Response(
                {'error': 'Time slot is not available'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create booking
        booking = Booking.objects.create(
            room=entry.room,
            user=entry.user,
            time_slot=entry.time_slot,
            date=entry.date,
            purpose=entry.purpose,
            status='APPROVED',
            priority=entry.priority,
            participants_count=entry.participants_count,
            approved_by=request.user,
            notes=f"Fulfilled from waitlist: {entry.notes}"
        )
        
        entry.is_fulfilled = True
        entry.fulfilled_booking = booking
        entry.save()
        
        return Response({
            'waitlist': WaitlistSerializer(entry).data,
            'booking': BookingSerializer(booking).data
        })
