from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
from .models import Booking, Notification
import logging

logger = logging.getLogger(__name__)


@receiver(pre_save, sender=Booking)
def track_booking_status_change(sender, instance, **kwargs):
    """Track the original status before it changes."""
    if instance.pk:
        try:
            original = Booking.objects.get(pk=instance.pk)
            instance._old_status = original.status
        except Booking.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None


@receiver(post_save, sender=Booking)
def create_booking_notification(sender, instance, created, **kwargs):
    """Create notifications for booking status changes and new pending bookings."""
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    old_status = getattr(instance, '_old_status', None)
    
    # For new bookings set to PENDING - notify all admins and faculty
    if created and instance.status == 'PENDING':
        try:
            # Get all admin and faculty users (who can approve bookings)
            approvers = User.objects.filter(role__in=['admin', 'faculty'])
            user_name = instance.user.get_full_name() or instance.user.email
            
            for approver in approvers:
                Notification.objects.create(
                    user=approver,
                    booking=instance,
                    notification_type='STATUS_ALERT',
                    title=f'New Booking Request for {instance.room.name}',
                    message=f'{user_name} submitted a booking for {instance.room.name} on {instance.date}. Please review and approve/reject.'
                )
            logger.info(f"Notifications created for new booking {instance.id} - {approvers.count()} admins/faculty notified")
        except Exception as e:
            logger.error(f"Error notifying admins about new booking {instance.id}: {str(e)}")
        return
    
    # For status changes - notify booking owner
    if old_status and old_status != instance.status:
        try:
            # Create notification for user whose booking status changed
            Notification.create_status_alert(
                booking=instance,
                user=instance.user,
                old_status=old_status,
                new_status=instance.status
            )
            logger.info(f"Notification created for booking {instance.id}: {old_status} → {instance.status}")
                
        except Exception as e:
            logger.error(f"Error creating notification for booking {instance.id}: {str(e)}")


def check_and_create_reminders():
    """
    Check for upcoming bookings (next 24 hours) and create reminders.
    This should be called by a management command or celery task.
    """
    from django.utils.timezone import now
    
    tomorrow = now().date() + timedelta(days=1)
    today = now().date()
    
    # Find bookings for tomorrow that are APPROVED or CONFIRMED
    upcoming_bookings = Booking.objects.filter(
        date=tomorrow,
        status__in=['APPROVED', 'CONFIRMED']
    )
    
    reminder_count = 0
    for booking in upcoming_bookings:
        # Check if reminder already exists
        existing_reminder = Notification.objects.filter(
            booking=booking,
            user=booking.user,
            notification_type='REMINDER',
            created_at__date=today  # Only check reminders created today
        ).exists()
        
        if not existing_reminder:
            try:
                Notification.create_reminder(booking, booking.user, days_until=1)
                reminder_count += 1
                logger.info(f"Reminder created for booking {booking.id}")
            except Exception as e:
                logger.error(f"Error creating reminder for booking {booking.id}: {str(e)}")
    
    return reminder_count


def check_and_create_overdue_alerts():
    """
    Check for bookings that are past their date and not completed.
    This should be called by a management command or celery task.
    """
    from django.utils.timezone import now
    
    today = now().date()
    
    # Find bookings that were scheduled for yesterday or earlier with CONFIRMED/APPROVED status
    overdue_bookings = Booking.objects.filter(
        date__lt=today,
        status__in=['APPROVED', 'CONFIRMED']
    )
    
    alert_count = 0
    for booking in overdue_bookings:
        # Check if overdue alert already exists
        existing_alert = Notification.objects.filter(
            booking=booking,
            user=booking.user,
            notification_type='OVERDUE_ALERT'
        ).exists()
        
        if not existing_alert:
            try:
                Notification.create_overdue_alert(booking, booking.user)
                alert_count += 1
                logger.info(f"Overdue alert created for booking {booking.id}")
            except Exception as e:
                logger.error(f"Error creating overdue alert for booking {booking.id}: {str(e)}")
    
    return alert_count
