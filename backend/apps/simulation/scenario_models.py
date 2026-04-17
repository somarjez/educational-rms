"""Models for scenario management and analysis."""
from django.db import models
from django.conf import settings
from datetime import datetime

class SavedScenario(models.Model):
    """Saved capacity analysis scenarios for comparison."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    scenario_data = models.JSONField()  # Stores the scenario result
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.user.username})"


class CapacitySnapshot(models.Model):
    """Daily snapshot of capacity metrics for trend analysis."""
    date = models.DateField(unique=True)
    overall_utilization = models.FloatField()
    total_bookings = models.IntegerField()
    total_available_slots = models.IntegerField()
    room_data = models.JSONField()  # Per-room utilization
    equipment_data = models.JSONField()  # Per-equipment usage
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date']
    
    def __str__(self):
        return f"Snapshot {self.date}: {self.overall_utilization}%"
