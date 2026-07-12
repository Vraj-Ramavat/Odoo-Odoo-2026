from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'departments', views.DepartmentViewSet)
router.register(r'categories', views.CategoryViewSet)
router.register(r'products', views.ProductViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('config/', views.ESGConfigurationView.as_view(), name='esg-config'),
    path('superadmin/dashboard/', views.superadmin_dashboard, name='superadmin-dashboard'),
]
