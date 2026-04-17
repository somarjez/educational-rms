"""Admin configuration for users app."""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserProfile


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Customize User admin interface."""
    
    list_display = (
        'username',
        'email',
        'get_full_name',
        'role',
        'department',
        'is_active',
        'date_joined'
    )
    list_filter = ('role', 'is_active', 'created_at')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Custom Fields', {
            'fields': ('role', 'department')
        }),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """Customize UserProfile admin interface."""
    
    list_display = ('user', 'phone_number', 'office_location')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('created_at', 'updated_at')
