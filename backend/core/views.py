from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from accounts.permissions import IsAdminOrReadOnly, IsAdmin
from .models import Department, Category, ESGConfiguration
from .serializers import DepartmentSerializer, CategorySerializer, ESGConfigurationSerializer


class DepartmentViewSet(viewsets.ModelViewSet):
    """CRUD for departments. Admin can write; anyone authenticated can read."""
    queryset = Department.objects.select_related('head', 'parent_department').all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        # Optional filters
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search)
        return qs


class CategoryViewSet(viewsets.ModelViewSet):
    """CRUD for categories (CSR Activity / Challenge types)."""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        type_filter = self.request.query_params.get('type')
        if type_filter:
            qs = qs.filter(type=type_filter)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class ESGConfigurationView(APIView):
    """
    GET: Retrieve singleton ESG config.
    PATCH: Update config (admin only).
    """
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated()]
        return [IsAdmin()]

    def get(self, request):
        config = ESGConfiguration.get_config()
        serializer = ESGConfigurationSerializer(config)
        return Response(serializer.data)

    def patch(self, request):
        config = ESGConfiguration.get_config()
        serializer = ESGConfigurationSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
