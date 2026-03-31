from django.db import models
from django.conf import settings
import json

class SimulationScenario(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField()
    parameters = models.JSONField()  # arrival_rate, service_rate, etc.
    num_replications = models.IntegerField(default=1000)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

class SimulationResult(models.Model):
    scenario = models.ForeignKey(SimulationScenario, on_delete=models.CASCADE)
    run_date = models.DateTimeField(auto_now_add=True)
    metrics = models.JSONField()  # avg_waiting_time, utilization, etc.
    raw_data = models.JSONField(blank=True, null=True)
    
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