from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from accounts.permissions import IsAdminOrReadOnly, IsAdmin
from .models import Department, Category, ESGConfiguration, Product
from .serializers import DepartmentSerializer, CategorySerializer, ESGConfigurationSerializer, ProductSerializer


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


from core.tenancy import TenantModelViewSetMixin

class ProductViewSet(TenantModelViewSetMixin, viewsets.ModelViewSet):
    """CRUD for products (Product ESG Profiles). Admin can write; anyone authenticated can read."""
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search)
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
        config = ESGConfiguration.get_config(company=request.user.company)
        serializer = ESGConfigurationSerializer(config)
        return Response(serializer.data)

    def patch(self, request):
        config = ESGConfiguration.get_config(company=request.user.company)
        serializer = ESGConfigurationSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Avg
from django.utils import timezone
from datetime import date, timedelta
from accounts.models import User
from core.models import Company, Department
from carbon.models import CarbonTransaction
from governance.models import ComplianceIssue
from gamification.models import DepartmentScore

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def superadmin_dashboard(request):
    """
    Super Admin platform-level overview dashboard.
    """
    user = request.user
    if user.role != 'superadmin':
        return Response({'detail': 'Only Super Admins can access this resource.'}, status=status.HTTP_403_FORBIDDEN)

    # 1. Global KPIs
    total_companies = Company.objects.count()
    total_users = User.objects.exclude(role='superadmin').count()
    total_departments = Department.objects.count()
    total_emissions = CarbonTransaction.objects.aggregate(total=Sum('calculated_emissions_kgco2e'))['total'] or 0

    # 2. Company Details Overview
    companies_data = []
    companies = Company.objects.all()
    for company in companies:
        comp_users = User.objects.filter(company=company).count()
        comp_depts = Department.objects.filter(company=company).count()
        comp_emissions = CarbonTransaction.objects.filter(company=company).aggregate(total=Sum('calculated_emissions_kgco2e'))['total'] or 0
        comp_issues = ComplianceIssue.objects.filter(company=company).exclude(status__in=['resolved', 'closed']).count()
        
        # Get company average ESG score for latest period
        latest_score = DepartmentScore.objects.filter(company=company).aggregate(avg=Avg('total_score'))['avg'] or 0

        companies_data.append({
            'id': company.id,
            'name': company.name,
            'code': company.code,
            'users_count': comp_users,
            'departments_count': comp_depts,
            'total_emissions_kgco2e': round(float(comp_emissions), 1),
            'open_issues_count': comp_issues,
            'average_score': round(float(latest_score), 1),
            'created_at': company.created_at.strftime('%Y-%m-%d') if company.created_at else None,
        })

    # 3. Platform Leaderboard (Rank companies by average department score)
    leaderboard = sorted(companies_data, key=lambda x: x['average_score'], reverse=True)

    # 4. Global weekly emissions timeline (12 weeks)
    timeline = []
    today = date.today()
    for w in range(12):
        start_date = today - timedelta(weeks=w+1)
        end_date = today - timedelta(weeks=w)
        
        week_emissions = []
        for company in companies:
            emissions = CarbonTransaction.objects.filter(
                company=company,
                transaction_date__gte=start_date,
                transaction_date__lt=end_date
            ).aggregate(total=Sum('calculated_emissions_kgco2e'))['total'] or 0
            if emissions > 0:
                week_emissions.append({
                    'company_name': company.name,
                    'company_code': company.code,
                    'emissions': round(float(emissions), 1)
                })

        timeline.insert(0, {
            'week_start': start_date.strftime('%Y-%m-%d'),
            'week_end': end_date.strftime('%Y-%m-%d'),
            'companies': week_emissions,
            'total_emissions': round(float(sum(c['emissions'] for c in week_emissions)), 1)
        })

    return Response({
        'kpis': {
            'total_companies': total_companies,
            'total_users': total_users,
            'total_departments': total_departments,
            'total_emissions_kgco2e': round(float(total_emissions), 1),
        },
        'companies': companies_data,
        'leaderboard': leaderboard,
        'emissions_timeline': timeline,
    })
