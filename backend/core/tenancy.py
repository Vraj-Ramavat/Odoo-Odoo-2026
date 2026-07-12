from rest_framework import filters, serializers


class TenantFilterBackend(filters.BaseFilterBackend):
    """
    Filter querysets dynamically to restrict records to the requesting user's company.
    """
    def filter_queryset(self, request, queryset, view):
        user = request.user
        if not user or not user.is_authenticated:
            return queryset.none()

        # Super Admin platform bypass
        if getattr(user, 'role', None) == 'superadmin':
            return queryset

        # Filter by company ForeignKey if present on model
        if hasattr(queryset.model, 'company'):
            return queryset.filter(company=user.company)

        return queryset


class TenantSerializerMixin:
    """
    Serializer mixin to dynamically filter choices of related fields to only show
    entities belonging to the requesting user's company.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated and request.user.role != 'superadmin':
            company = request.user.company
            for field_name, field in self.fields.items():
                if hasattr(field, 'queryset'):
                    if hasattr(field.queryset.model, 'company'):
                        field.queryset = field.queryset.filter(company=company)


class TenantModelViewSetMixin:
    """
    ViewSet mixin to auto-inject company ownership when creating and updating models.
    """
    def perform_create(self, serializer):
        user = self.request.user
        if user and user.is_authenticated and user.role != 'superadmin':
            if hasattr(serializer.Meta.model, 'company'):
                serializer.save(company=user.company)
                return
        serializer.save()


def tenant_filter(request, queryset):
    """
    Function helper to manually apply tenant isolation to any arbitrary queryset.
    """
    user = request.user
    if not user or not user.is_authenticated:
        return queryset.none()
    if getattr(user, 'role', None) == 'superadmin':
        return queryset
    if hasattr(queryset.model, 'company'):
        return queryset.filter(company=user.company)
    return queryset


class TenantModelSerializer(TenantSerializerMixin, serializers.ModelSerializer):
    pass
