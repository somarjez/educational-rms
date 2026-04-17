from django.contrib import admin
from .scenario_models import SavedScenario, CapacitySnapshot

@admin.register(SavedScenario)
class SavedScenarioAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'created_at']
    list_filter = ['created_at', 'user']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(CapacitySnapshot)
class CapacitySnapshotAdmin(admin.ModelAdmin):
    list_display = ['date', 'overall_utilization', 'total_bookings']
    list_filter = ['date']
    readonly_fields = ['created_at']
