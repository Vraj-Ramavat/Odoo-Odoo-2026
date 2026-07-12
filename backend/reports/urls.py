from django.urls import path
from .views import (
    environmental_report, social_report,
    governance_report, summary_report, custom_report,
)

urlpatterns = [
    path('environmental/', environmental_report, name='environmental-report'),
    path('social/', social_report, name='social-report'),
    path('governance/', governance_report, name='governance-report'),
    path('summary/', summary_report, name='summary-report'),
    path('custom/', custom_report, name='custom-report'),
]
