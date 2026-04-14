"""Serializers for scheduling app."""
from rest_framework import serializers
from django.db import models as django_models
from ..models import Booking, Room, TimeSlot, Equipment, Waitlist, Notification
from django.contrib.auth import get_user_model

User = get_user_model()


class EquipmentSerializer(serializers.ModelSerializer):
    """Serializer for Equipment model."""
    assigned_quantity = serializers.SerializerMethodField()
    available_quantity = serializers.SerializerMethodField()
    
    class Meta:
        model = Equipment
        fields = ['id', 'name', 'category', 'description', 'quantity', 'assigned_quantity', 
                  'available_quantity', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'assigned_quantity', 'available_quantity', 'created_at', 'updated_at']
    
    def get_assigned_quantity(self, obj):
        """Get total quantity assigned to rooms"""
        if hasattr(obj, 'assigned_total'):
            return int(obj.assigned_total or 0)
        return obj.get_distribution().aggregate(
            total=django_models.Sum('quantity')
        )['total'] or 0
    
    def get_available_quantity(self, obj):
        """Get available quantity not yet assigned"""
        if hasattr(obj, 'available_total'):
            return int(obj.available_total or 0)
        return obj.get_available_quantity()


class TimeSlotSerializer(serializers.ModelSerializer):
    """Serializer for TimeSlot model."""
    
    class Meta:
        model = TimeSlot
        fields = ['id', 'name', 'slot_type', 'start_time', 'end_time', 'is_active', 
                  'days_of_week', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class RoomSerializer(serializers.ModelSerializer):
    """Serializer for Room model."""
    equipment = EquipmentSerializer(many=True, read_only=True)
    equipment_ids = serializers.PrimaryKeyRelatedField(
        many=True, 
        write_only=True, 
        queryset=Equipment.objects.all(),
        source='equipment',
        required=False
    )
    
    class Meta:
        model = Room
        fields = [
            'id', 'name', 'room_type', 'capacity', 'floor', 'building',
            'description', 'equipment', 'equipment_ids', 'features',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class RoomListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for room lists."""
    equipment_count = serializers.SerializerMethodField()
    
    def get_equipment_count(self, obj):
        """Count equipment items from RoomEquipment through model"""
        if hasattr(obj, 'equipment_count'):
            return int(obj.equipment_count or 0)
        return obj.room_equipment.count()
    
    class Meta:
        model = Room
        fields = ['id', 'name', 'room_type', 'capacity', 'floor', 'building', 
                  'equipment_count', 'is_active']


class BookingSerializer(serializers.ModelSerializer):
    """Serializer for Booking model."""
    
    room_name = serializers.CharField(source='room.name', read_only=True)
    room_details = RoomListSerializer(source='room', read_only=True)
    user_name = serializers.SerializerMethodField()
    user_email = serializers.EmailField(source='user.email', read_only=True)
    time_slot_details = TimeSlotSerializer(source='time_slot', read_only=True)
    approved_by_name = serializers.SerializerMethodField()
    
    def get_user_name(self, obj):
        if hasattr(obj.user, 'get_full_name') and obj.user.get_full_name():
            return obj.user.get_full_name()
        return obj.user.email
    
    def get_approved_by_name(self, obj):
        if obj.approved_by:
            if hasattr(obj.approved_by, 'get_full_name') and obj.approved_by.get_full_name():
                return obj.approved_by.get_full_name()
            return obj.approved_by.email
        return None
    
    class Meta:
        model = Booking
        fields = [
            'id', 'room', 'room_name', 'room_details', 'user', 'user_name', 'user_email',
            'time_slot', 'time_slot_details', 'date', 'end_date', 'purpose', 
            'status', 'priority', 'participants_count', 'is_recurring', 
            'recurrence_pattern', 'recurrence_end_date', 'parent_booking',
            'conflict_override', 'override_reason', 'approved_by', 'approved_by_name',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Validate booking data."""
        # Check capacity
        if data.get('participants_count', 0) > data['room'].capacity:
            raise serializers.ValidationError(
                f"Participants count ({data['participants_count']}) exceeds room capacity ({data['room'].capacity})"
            )
        
        # Check date validity
        if data.get('end_date') and data['end_date'] < data['date']:
            raise serializers.ValidationError("End date cannot be before start date")
        
        return data


class BookingCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating bookings."""

    def validate(self, data):
        date = data.get('date')
        time_slot = data.get('time_slot')

        if date and time_slot and time_slot.days_of_week:
            try:
                slot_days = [int(d) for d in time_slot.days_of_week]
            except (TypeError, ValueError):
                slot_days = []

            if slot_days and date.weekday() not in slot_days:
                raise serializers.ValidationError(
                    "Selected time slot is not available on this day."
                )

        return data
    
    class Meta:
        model = Booking
        fields = [
            'room', 'user', 'time_slot', 'date', 'end_date', 'purpose',
            'priority', 'participants_count', 'is_recurring', 'recurrence_pattern',
            'recurrence_end_date', 'conflict_override', 'override_reason', 'notes'
        ]


class BookingUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating bookings."""

    def validate(self, data):
        date = data.get('date')
        time_slot = data.get('time_slot')

        if date and time_slot and time_slot.days_of_week:
            try:
                slot_days = [int(d) for d in time_slot.days_of_week]
            except (TypeError, ValueError):
                slot_days = []

            if slot_days and date.weekday() not in slot_days:
                raise serializers.ValidationError(
                    "Selected time slot is not available on this day."
                )

        return data
    
    class Meta:
        model = Booking
        fields = [
            'room', 'time_slot', 'date', 'end_date', 'purpose', 'status',
            'priority', 'participants_count', 'is_recurring', 'recurrence_pattern',
            'recurrence_end_date', 'conflict_override', 'override_reason', 
            'approved_by', 'notes'
        ]
        read_only_fields = ['user']


class BookingApprovalSerializer(serializers.ModelSerializer):
    """Serializer for approving/rejecting bookings."""
    
    class Meta:
        model = Booking
        fields = ['status', 'notes', 'approved_by']
        read_only_fields = ['approved_by']


class WaitlistSerializer(serializers.ModelSerializer):
    """Serializer for Waitlist model."""
    
    room_name = serializers.CharField(source='room.name', read_only=True)
    user_name = serializers.SerializerMethodField()
    user_email = serializers.EmailField(source='user.email', read_only=True)
    time_slot_details = TimeSlotSerializer(source='time_slot', read_only=True)
    
    def get_user_name(self, obj):
        if hasattr(obj.user, 'get_full_name') and obj.user.get_full_name():
            return obj.user.get_full_name()
        return obj.user.email
    
    class Meta:
        model = Waitlist
        fields = [
            'id', 'room', 'room_name', 'user', 'user_name', 'user_email',
            'time_slot', 'time_slot_details', 'date', 'purpose', 'priority',
            'participants_count', 'is_fulfilled', 'fulfilled_booking',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'is_fulfilled', 'fulfilled_booking', 'created_at', 'updated_at']


class CalendarEventSerializer(serializers.Serializer):
    """Serializer for calendar view events."""
    id = serializers.IntegerField()
    title = serializers.CharField()
    start = serializers.DateTimeField()
    end = serializers.DateTimeField()
    resource_id = serializers.IntegerField()
    resource_name = serializers.CharField()
    status = serializers.CharField()
    user_name = serializers.CharField()
    participants_count = serializers.IntegerField()
    purpose = serializers.CharField()
    priority = serializers.CharField()
    is_recurring = serializers.BooleanField()


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model."""
    
    booking_details = BookingSerializer(source='booking', read_only=True)
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'booking', 'booking_details', 'notification_type',
            'notification_type_display', 'title', 'message', 'is_read', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at']
