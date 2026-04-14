from django.urls import path
from .views import export_report

app_name = 'reports'

urlpatterns = [
    path('export/', export_report, name='export-report'),
]
