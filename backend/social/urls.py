from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CSRActivityViewSet, EmployeeParticipationViewSet

router = DefaultRouter()
router.register(r'activities', CSRActivityViewSet)
router.register(r'participations', EmployeeParticipationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
