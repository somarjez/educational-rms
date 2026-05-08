from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta

class Equipment(models.Model):
    """Equipment that can be linked to rooms"""
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=100, blank=True, default='')
    description = models.TextField(blank=True)
    quantity = models.IntegerField(default=1, help_text="Total available quantity")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} (x{self.quantity})"
    
    def get_available_quantity(self):
        """Calculate available quantity not assigned to rooms"""
        assigned = RoomEquipment.objects.filter(equipment=self).aggregate(
            total=models.Sum('quantity')
        )['total'] or 0
        return self.quantity - assigned
    
    def get_distribution(self):
        """Get distribution across all rooms"""
        return RoomEquipment.objects.filter(equipment=self).select_related('room')
    
    class Meta:
        verbose_name_plural = "Equipment"


class RoomEquipment(models.Model):
    """Through model to track equipment quantity per room"""
    room = models.ForeignKey('Room', on_delete=models.CASCADE, related_name='room_equipment')
    equipment = models.ForeignKey(Equipment, on_delete=models.CASCADE, related_name='equipment_rooms')
    quantity = models.IntegerField(default=1, help_text="Quantity of this equipment in this room")
    assigned_date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        unique_together = ['room', 'equipment']
        ordering = ['room__name', 'equipment__name']
    
    def __str__(self):
        return f"{self.equipment.name} x{self.quantity} in {self.room.name}"
    
    def clean(self):
        """Validate that we don't exceed total equipment quantity"""
        if self.quantity <= 0:
            raise ValidationError("Quantity must be greater than 0")
        
        # Check total distribution doesn't exceed available quantity
        total_assigned = RoomEquipment.objects.filter(
            equipment=self.equipment
        ).exclude(pk=self.pk).aggregate(
            total=models.Sum('quantity')
        )['total'] or 0
        
        if total_assigned + self.quantity > self.equipment.quantity:
            available = self.equipment.quantity - total_assigned
            raise ValidationError(
                f"Cannot assign {self.quantity}. Only {available} units available. "
                f"Total: {self.equipment.quantity}, Already assigned: {total_assigned}"
            )


class Room(models.Model):
    ROOM_TYPES = [
        ('LAB', 'Computer Lab'),
        ('CLASSROOM', 'Classroom'),
        ('CONFERENCE', 'Conference Room'),
        ('AUDITORIUM', 'Auditorium'),
        ('STUDY_ROOM', 'Study Room'),
    ]
    
    name = models.CharField(max_length=100, unique=True)
    room_type = models.CharField(max_length=20, choices=ROOM_TYPES)
    capacity = models.IntegerField()
    floor = models.CharField(max_length=10, blank=True)
    building = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    equipment = models.ManyToManyField(Equipment, blank=True, related_name='rooms_old')
    features = models.JSONField(default=list, blank=True, help_text="Additional features like projector, whiteboard, etc.")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.get_room_type_display()})"
    
    def get_equipment_with_quantities(self):
        """Get equipment assigned to this room with quantities"""
        return RoomEquipment.objects.filter(room=self).select_related('equipment')
    
    class Meta:
        ordering = ['name']

class TimeSlot(models.Model):
    SLOT_TYPES = [
        ('HOURLY', 'Hourly'),
        ('DAILY', 'Daily'),
        ('WEEKLY', 'Weekly'),
    ]
    
    name = models.CharField(max_length=100, help_text="e.g., Morning Slot, Period 1")
    slot_type = models.CharField(max_length=20, choices=SLOT_TYPES, default='HOURLY')
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_active = models.BooleanField(default=True)
    days_of_week = models.JSONField(default=list, blank=True, help_text="Days when this slot is available [0=Monday, 6=Sunday]")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def clean(self):
        if self.start_time >= self.end_time:
            raise ValidationError("End time must be after start time")
    
    def __str__(self):
        return f"{self.name}: {self.start_time.strftime('%H:%M')} - {self.end_time.strftime('%H:%M')}"
    
    class Meta:
        ordering = ['start_time']

class Booking(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('CONFIRMED', 'Confirmed'),
        ('CANCELLED', 'Cancelled'),
        ('COMPLETED', 'Completed'),
    ]
    
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]
    
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='bookings')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings')
    time_slot = models.ForeignKey(TimeSlot, on_delete=models.CASCADE, related_name='bookings')
    date = models.DateField()
    end_date = models.DateField(null=True, blank=True, help_text="For multi-day bookings")
    purpose = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='MEDIUM')
    participants_count = models.IntegerField()
    
    # Recurring booking fields
    is_recurring = models.BooleanField(default=False)
    recurrence_pattern = models.CharField(max_length=50, blank=True, help_text="e.g., DAILY, WEEKLY, MONTHLY")
    recurrence_end_date = models.DateField(null=True, blank=True)
    parent_booking = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='recurring_instances')
    
    # Admin override fields
    conflict_override = models.BooleanField(default=False, help_text="Admin can override conflict detection")
    override_reason = models.TextField(blank=True)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='approved_bookings')
    
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date', '-time_slot__start_time']
        indexes = [
            models.Index(fields=['date', 'room']),
            models.Index(fields=['status']),
            models.Index(fields=['user']),
            models.Index(fields=['date', 'status']),
            models.Index(fields=['purpose'], name='booking_purpose_idx'),
        ]
    
    def clean(self):
        # Check for conflicts unless override is enabled
        if not self.conflict_override:
            conflicts = Booking.objects.filter(
                room=self.room,
                date=self.date,
                time_slot=self.time_slot,
                status__in=['APPROVED', 'CONFIRMED']
            ).exclude(pk=self.pk)
            
            if conflicts.exists():
                raise ValidationError(f"This time slot is already booked for {self.room.name}")
    
    def __str__(self):
        return f"{self.room.name} - {self.date} ({self.time_slot})"

class Waitlist(models.Model):
    """Waitlist for bookings when resources are unavailable"""
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]
    
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='waitlist_entries')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='waitlist_entries')
    time_slot = models.ForeignKey(TimeSlot, on_delete=models.CASCADE, related_name='waitlist_entries')
    date = models.DateField()
    purpose = models.TextField()
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='MEDIUM')
    participants_count = models.IntegerField()
    is_fulfilled = models.BooleanField(default=False)
    fulfilled_booking = models.ForeignKey(Booking, null=True, blank=True, on_delete=models.SET_NULL, related_name='waitlist_source')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-priority', 'created_at']
        indexes = [
            models.Index(fields=['date', 'room']),
            models.Index(fields=['is_fulfilled']),
        ]
    
    def __str__(self):
        return f"Waitlist: {self.user.email} - {self.room.name} on {self.date}"


class Notification(models.Model):
    """User notification for booking status changes and reminders."""
    
    TYPE_CHOICES = [
        ('STATUS_ALERT', 'Booking Status Alert'),
        ('REMINDER', 'Booking Reminder'),
        ('OVERDUE_ALERT', 'Overdue Alert'),
        ('CONFLICT_ALERT', 'Conflict Alert'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['is_read', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.get_notification_type_display()} for {self.user.email}"
    
    @classmethod
    def create_status_alert(cls, booking, user, old_status, new_status):
        """Create a booking status change notification."""
        return cls.objects.create(
            user=user,
            booking=booking,
            notification_type='STATUS_ALERT',
            title=f'Booking Status Changed: {new_status}',
            message=f'Your booking for {booking.room.name} on {booking.date} has been {new_status.lower()}.'
        )
    
    @classmethod
    def create_reminder(cls, booking, user, days_until=1):
        """Create an upcoming booking reminder."""
        return cls.objects.create(
            user=user,
            booking=booking,
            notification_type='REMINDER',
            title=f'Upcoming Booking Reminder',
            message=f'Reminder: You have a booking for {booking.room.name} on {booking.date} at {booking.time_slot.start_time}.'
        )
    
    @classmethod
    def create_overdue_alert(cls, booking, user):
        """Create an overdue booking alert."""
        return cls.objects.create(
            user=user,
            booking=booking,
            notification_type='OVERDUE_ALERT',
            title='Booking Overdue',
            message=f'Your booking for {booking.room.name} on {booking.date} has not been marked as completed.'
        )