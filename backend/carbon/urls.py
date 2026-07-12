from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'emission-factors', views.EmissionFactorViewSet)
router.register(r'transactions', views.CarbonTransactionViewSet)
router.register(r'goals', views.EnvironmentalGoalViewSet)
router.register(r'erp/purchases', views.PurchaseRecordViewSet)
router.register(r'erp/manufacturing', views.ManufacturingRecordViewSet)
router.register(r'erp/expenses', views.ExpenseRecordViewSet)
router.register(r'erp/fleet', views.FleetRecordViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', views.EnvironmentalDashboardView.as_view(), name='environmental-dashboard'),
]
