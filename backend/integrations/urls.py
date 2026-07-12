from django.urls import path
from .views import odoo_webhook

urlpatterns = [
    path('odoo/webhook/', odoo_webhook, name='odoo-webhook'),
]
