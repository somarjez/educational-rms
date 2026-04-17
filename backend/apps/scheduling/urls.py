"""URL configuration for scheduling app."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api.viewsets import (
    RoomViewSet, TimeSlotViewSet, BookingViewSet,
    EquipmentViewSet, WaitlistViewSet
)
from .api.equipment_config_viewsets import EquipmentConfigViewSet

app_name = 'scheduling'

router = DefaultRouter()
router.register(r'rooms', RoomViewSet, basename='room')
router.register(r'time-slots', TimeSlotViewSet, basename='timeslot')
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'equipment', EquipmentViewSet, basename='equipment')
router.register(r'waitlist', WaitlistViewSet, basename='waitlist')
router.register(r'equipment-config', EquipmentConfigViewSet, basename='equipment-config')

urlpatterns = [
    path('', include(router.urls)),
]
