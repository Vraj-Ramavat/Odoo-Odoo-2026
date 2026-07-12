from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Only Admin users can access."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsAdminOrDeptHead(permissions.BasePermission):
    """Admin or Department Head can access."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('admin', 'dept_head')


class IsAdminOrReadOnly(permissions.BasePermission):
    """Admin can write; anyone authenticated can read."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.role == 'admin'


class IsOwnerOrAdmin(permissions.BasePermission):
    """Object owner or admin can access."""
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        # Check various owner field names
        for field in ('employee', 'owner', 'user', 'recipient'):
            if hasattr(obj, field) and getattr(obj, field) == request.user:
                return True
        return False
