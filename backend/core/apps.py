from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        from rest_framework import serializers

        original_init = serializers.ModelSerializer.__init__
        original_save = serializers.ModelSerializer.save

        def tenant_serializer_init(self, *args, **kwargs):
            original_init(self, *args, **kwargs)
            request = self.context.get('request')
            if request and request.user and request.user.is_authenticated and request.user.role != 'superadmin':
                company = request.user.company
                for field_name, field in list(self.fields.items()):
                    if hasattr(field, 'queryset') and field.queryset is not None:
                        if hasattr(field.queryset.model, 'company'):
                            field.queryset = field.queryset.filter(company=company)

        def tenant_serializer_save(self, **kwargs):
            request = self.context.get('request')
            if request and request.user and request.user.is_authenticated and request.user.role != 'superadmin':
                if hasattr(self.Meta, 'model') and hasattr(self.Meta.model, 'company'):
                    kwargs['company'] = request.user.company
            return original_save(self, **kwargs)

        serializers.ModelSerializer.__init__ = tenant_serializer_init
        serializers.ModelSerializer.save = tenant_serializer_save
