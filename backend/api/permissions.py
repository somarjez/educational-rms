"""API permissions module."""
from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """Permission class for admin users only."""
    
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_admin()
        )


class IsFacultyOrAdmin(permissions.BasePermission):
    """Permission class for faculty and admin users."""
    
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.is_faculty() or request.user.is_admin())
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """Permission class to check if user is owner or admin."""
    
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'user'):
            user_field = obj.user
        elif hasattr(obj, 'created_by'):
            user_field = obj.created_by
        else:
            return False
        
        return bool(
            request.user == user_field or
            request.user.is_admin()
        )
