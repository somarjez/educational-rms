from django.urls import path
from rest_framework.routers import DefaultRouter
from .api.views import UserViewSet, UserProfileViewSet
from .dashboard import dashboard_stats

app_name = 'users'

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'profiles', UserProfileViewSet, basename='profile')

urlpatterns = [
    path('dashboard/stats/', dashboard_stats, name='dashboard-stats'),
] + router.urls
