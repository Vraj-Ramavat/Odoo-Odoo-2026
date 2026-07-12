from django.apps import AppConfig


class CarbonConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'carbon'
    verbose_name = 'Carbon & Environmental'

    def ready(self):
        import carbon.signals  # noqa: F401 — register signal handlers
