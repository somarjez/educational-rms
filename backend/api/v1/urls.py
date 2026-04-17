from django.urls import path, include
from .routers import router

app_name = 'api_v1'

urlpatterns = [
    path('auth/', include('apps.users.urls')),
    path('reports/', include('apps.reports.urls')),
    path('', include(router.urls)),
]
