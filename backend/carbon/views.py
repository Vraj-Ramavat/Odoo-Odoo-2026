from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta

from accounts.permissions import IsAdminOrReadOnly, IsAdminOrDeptHead
from .models import (
    EmissionFactor, CarbonTransaction, EnvironmentalGoal,
    PurchaseRecord, ManufacturingRecord, ExpenseRecord, FleetRecord,
)
from .serializers import (
    EmissionFactorSerializer, CarbonTransactionSerializer,
    EnvironmentalGoalSerializer,
    PurchaseRecordSerializer, ManufacturingRecordSerializer,
    ExpenseRecordSerializer, FleetRecordSerializer,
)


class EmissionFactorViewSet(viewsets.ModelViewSet):
    """
    CRUD for emission factors with versioning.
    Creating a new factor for an existing activity_type retires the old one.
    """
    queryset = EmissionFactor.objects.all()
    serializer_class = EmissionFactorSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        scope = self.request.query_params.get('scope')
        if scope:
            qs = qs.filter(scope=scope)
        active_only = self.request.query_params.get('active')
        if active_only == 'true':
            qs = qs.filter(is_active=True)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(activity_type__icontains=search) | Q(source__icontains=search)
            )
        return qs

    @action(detail=False, methods=['get'])
    def activity_types(self, request):
        """List distinct activity types for dropdowns."""
        types = (
            EmissionFactor.objects
            .filter(is_active=True)
            .values_list('activity_type', flat=True)
            .distinct()
            .order_by('activity_type')
        )
        return Response(list(types))


class CarbonTransactionViewSet(viewsets.ModelViewSet):
    """CRUD for carbon transactions + filtering."""
    queryset = CarbonTransaction.objects.select_related(
        'department', 'emission_factor', 'created_by'
    ).all()
    serializer_class = CarbonTransactionSerializer
    permission_classes = [IsAdminOrDeptHead]

    def get_queryset(self):
        qs = super().get_queryset()
        dept = self.request.query_params.get('department')
        if dept:
            qs = qs.filter(department_id=dept)
        scope = self.request.query_params.get('scope')
        if scope:
            qs = qs.filter(emission_factor__scope=scope)
        source_type = self.request.query_params.get('source_type')
        if source_type:
            qs = qs.filter(source_type=source_type)
        date_from = self.request.query_params.get('date_from')
        if date_from:
            qs = qs.filter(transaction_date__gte=date_from)
        date_to = self.request.query_params.get('date_to')
        if date_to:
            qs = qs.filter(transaction_date__lte=date_to)
        return qs

    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user,
            source_type='manual',
            is_auto_calculated=False,
        )


class EnvironmentalGoalViewSet(viewsets.ModelViewSet):
    """CRUD for environmental/sustainability goals."""
    queryset = EnvironmentalGoal.objects.select_related('department').all()
    serializer_class = EnvironmentalGoalSerializer
    permission_classes = [IsAdminOrDeptHead]

    def get_queryset(self):
        qs = super().get_queryset()
        dept = self.request.query_params.get('department')
        if dept:
            qs = qs.filter(department_id=dept)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class EnvironmentalDashboardView(APIView):
    """Aggregated environmental data for the dashboard."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Date range filter
        days = int(request.query_params.get('days', 365))
        start_date = timezone.now().date() - timedelta(days=days)

        txns = CarbonTransaction.objects.filter(transaction_date__gte=start_date)

        # Total emissions
        totals = txns.aggregate(
            total_emissions=Sum('calculated_emissions_kgco2e'),
            total_transactions=Count('id'),
        )

        # By scope
        scope_data = {}
        for scope_code in ['1', '2', '3']:
            val = txns.filter(emission_factor__scope=scope_code).aggregate(
                total=Sum('calculated_emissions_kgco2e')
            )['total'] or 0
            scope_data[f'scope_{scope_code}'] = float(val)

        # By department
        by_dept = list(
            txns.values('department__name')
            .annotate(total=Sum('calculated_emissions_kgco2e'))
            .order_by('-total')[:10]
        )

        # By month (trend)
        by_month = list(
            txns.annotate(month=TruncMonth('transaction_date'))
            .values('month')
            .annotate(total=Sum('calculated_emissions_kgco2e'), count=Count('id'))
            .order_by('month')
        )
        # Format months for chart
        by_month_formatted = [
            {
                'month': item['month'].strftime('%b %Y') if item['month'] else '',
                'total': float(item['total'] or 0),
                'count': item['count'],
            }
            for item in by_month
        ]

        # Recent transactions
        recent = CarbonTransactionSerializer(
            txns.order_by('-created_at')[:5], many=True
        ).data

        # Goals summary
        goals = EnvironmentalGoal.objects.all()
        goals_summary = {
            'total': goals.count(),
            'achieved': goals.filter(status='achieved').count(),
            'on_track': goals.filter(status='on_track').count(),
            'at_risk': goals.filter(status='at_risk').count(),
        }

        # Active emission factors count
        active_factors = EmissionFactor.objects.filter(is_active=True).count()

        return Response({
            'total_emissions': float(totals['total_emissions'] or 0),
            'total_transactions': totals['total_transactions'] or 0,
            'scope_1': scope_data['scope_1'],
            'scope_2': scope_data['scope_2'],
            'scope_3': scope_data['scope_3'],
            'by_department': [
                {'name': d['department__name'], 'total': float(d['total'] or 0)}
                for d in by_dept
            ],
            'by_month': by_month_formatted,
            'recent_transactions': recent,
            'goals_summary': goals_summary,
            'active_factors': active_factors,
        })


# ---- Stub ERP ViewSets ----

class PurchaseRecordViewSet(viewsets.ModelViewSet):
    queryset = PurchaseRecord.objects.select_related('department').all()
    serializer_class = PurchaseRecordSerializer
    permission_classes = [IsAdminOrDeptHead]


class ManufacturingRecordViewSet(viewsets.ModelViewSet):
    queryset = ManufacturingRecord.objects.select_related('department').all()
    serializer_class = ManufacturingRecordSerializer
    permission_classes = [IsAdminOrDeptHead]


class ExpenseRecordViewSet(viewsets.ModelViewSet):
    queryset = ExpenseRecord.objects.select_related('department').all()
    serializer_class = ExpenseRecordSerializer
    permission_classes = [IsAdminOrDeptHead]


class FleetRecordViewSet(viewsets.ModelViewSet):
    queryset = FleetRecord.objects.select_related('department').all()
    serializer_class = FleetRecordSerializer
    permission_classes = [IsAdminOrDeptHead]
