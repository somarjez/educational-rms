from django.apps import AppConfig


class SchedulingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.scheduling'
    
    def ready(self):
        """Import signals when app is ready."""
        import apps.scheduling.signals  # noqa
