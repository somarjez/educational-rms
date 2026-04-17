from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def root_api_status(request):
    return JsonResponse({
        'message': 'Educational RMS backend is running',
        'api_base': '/api/v1/',
        'admin': '/admin/'
    })

urlpatterns = [
    path('', root_api_status, name='root-status'),
    path('admin/', admin.site.urls),
    path('api/v1/', include('api.v1.urls')),
]

