"""
Management command to check and create booking reminders and overdue alerts.
Run with: python manage.py check_bookings_and_create_alerts
Or schedule with Celery/APScheduler for periodic execution.
"""
from django.core.management.base import BaseCommand
from apps.scheduling.signals import check_and_create_reminders, check_and_create_overdue_alerts
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Check for upcoming bookings and create reminders/overdue alerts'

    def handle(self, *args, **options):
        self.stdout.write('Starting booking alert checks...')
        
        try:
            # Check reminders
            reminder_count = check_and_create_reminders()
            self.stdout.write(
                self.style.SUCCESS(f'✓ Created {reminder_count} reminder notifications')
            )
            logger.info(f'Created {reminder_count} reminder notifications')
            
            # Check overdue
            overdue_count = check_and_create_overdue_alerts()
            self.stdout.write(
                self.style.SUCCESS(f'✓ Created {overdue_count} overdue alerts')
            )
            logger.info(f'Created {overdue_count} overdue alerts')
            
            total = reminder_count + overdue_count
            self.stdout.write(
                self.style.SUCCESS(f'\n✓ Total notifications created: {total}')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Error: {str(e)}')
            )
            logger.error(f'Error in check_bookings_and_create_alerts: {str(e)}')
