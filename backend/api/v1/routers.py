from rest_framework.routers import DefaultRouter
from apps.users.api.views import UserViewSet, UserProfileViewSet
from apps.scheduling.api.viewsets import (
    BookingViewSet, RoomViewSet, TimeSlotViewSet,
    EquipmentViewSet, WaitlistViewSet, NotificationViewSet
)
from apps.scheduling.api.equipment_config_viewsets import EquipmentConfigViewSet
from apps.simulation.api.views import SimulationViewSet
from apps.simulation.api.capacity_analysis import CapacityAnalysisViewSet

router = DefaultRouter()

# Auth endpoints
router.register(r'auth/users', UserViewSet, basename='user')
router.register(r'auth/profiles', UserProfileViewSet, basename='profile')

# Scheduling endpoints
router.register(r'scheduling/bookings', BookingViewSet, basename='booking')
router.register(r'scheduling/rooms', RoomViewSet, basename='room')
router.register(r'scheduling/timeslots', TimeSlotViewSet, basename='timeslot')
router.register(r'scheduling/equipment', EquipmentViewSet, basename='equipment')
router.register(r'scheduling/waitlist', WaitlistViewSet, basename='waitlist')
router.register(r'scheduling/notifications', NotificationViewSet, basename='notification')

# Equipment Configuration endpoints
router.register(r'equipment-config', EquipmentConfigViewSet, basename='equipment-config')

# Simulation endpoints
router.register(r'simulation', SimulationViewSet, basename='simulation')

# Capacity Analysis endpoints
router.register(r'capacity', CapacityAnalysisViewSet, basename='capacity')

urlpatterns = router.urls
