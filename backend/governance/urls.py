from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ESGPolicyViewSet, PolicyAcknowledgementViewSet,
    AuditViewSet, ComplianceIssueViewSet,
)

router = DefaultRouter()
router.register(r'policies', ESGPolicyViewSet)
router.register(r'acknowledgements', PolicyAcknowledgementViewSet)
router.register(r'audits', AuditViewSet)
router.register(r'compliance-issues', ComplianceIssueViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
