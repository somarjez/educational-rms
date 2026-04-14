from django.db import models
from django.conf import settings
import json

class SimulationScenario(models.Model):
    SIMULATION_TYPE_CHOICES = [
        ('room_usage', 'Room Usage'),
        ('equipment_usage', 'Equipment Usage'),
        ('peak_hour', 'Peak Hour'),
        ('shortage', 'Shortage'),
        ('what_if', 'What-If Analysis'),
        ('general', 'General'),  # Legacy/default
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField()
    parameters = models.JSONField()  # arrival_rate, service_rate, etc.
    num_replications = models.IntegerField(default=1000)
    simulation_type = models.CharField(
        max_length=50, 
        choices=SIMULATION_TYPE_CHOICES, 
        default='general',
        help_text='Category of simulation (room_usage, equipment_usage, peak_hour, shortage, what_if)'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

class SimulationResult(models.Model):
    scenario = models.ForeignKey(SimulationScenario, on_delete=models.CASCADE)
    run_date = models.DateTimeField(auto_now_add=True)
    metrics = models.JSONField()  # avg_waiting_time, utilization, etc. (standard metrics)
    raw_data = models.JSONField(blank=True, null=True)
    
    # Category-specific metrics (optional, populated based on simulation_type)
    category_metrics = models.JSONField(
        blank=True, 
        null=True,
        help_text='Category-specific data: peak_hours_data, shortage_impact, time_slot_breakdown, resource_combinations'
    )
    
    def __str__(self):
        return f"Result for {self.scenario.name} - {self.run_date}"


class SimulationAuditLog(models.Model):
    ACTION_CHOICES = [
        ('run_started', 'Run Started'),
        ('run_succeeded', 'Run Succeeded'),
        ('run_failed', 'Run Failed'),
        ('backup_exported', 'Backup Exported'),
    ]

    action = models.CharField(max_length=40, choices=ACTION_CHOICES)
    level = models.CharField(max_length=20, default='info')
    message = models.TextField()
    metadata = models.JSONField(blank=True, null=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    scenario = models.ForeignKey(SimulationScenario, on_delete=models.SET_NULL, null=True, blank=True)
    result = models.ForeignKey(SimulationResult, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.action} ({self.level}) - {self.created_at}"