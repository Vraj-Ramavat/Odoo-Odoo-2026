from rest_framework import serializers
from django.utils import timezone
from .models import (
    EmissionFactor, CarbonTransaction, EnvironmentalGoal,
    PurchaseRecord, ManufacturingRecord, ExpenseRecord, FleetRecord,
)


class EmissionFactorSerializer(serializers.ModelSerializer):
    scope_display = serializers.CharField(source='get_scope_display', read_only=True)

    class Meta:
        model = EmissionFactor
        fields = [
            'id', 'activity_type', 'scope', 'scope_display', 'unit',
            'factor_value', 'source', 'effective_from', 'effective_to',
            'is_active', 'created_at',
        ]

    def create(self, validated_data):
        """
        Versioning enforcement: if an active factor exists for the same
        activity_type, retire it (set effective_to) before creating the new one.
        """
        activity_type = validated_data.get('activity_type')
        effective_from = validated_data.get('effective_from')

        # Retire any active factors for the same activity_type
        active_factors = EmissionFactor.objects.filter(
            activity_type=activity_type,
            is_active=True,
        )
        for old_factor in active_factors:
            old_factor.effective_to = effective_from
            old_factor.is_active = False
            old_factor.save(update_fields=['effective_to', 'is_active'])

        return super().create(validated_data)


class CarbonTransactionSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    emission_factor_name = serializers.CharField(source='emission_factor.activity_type', read_only=True)
    emission_factor_unit = serializers.CharField(source='emission_factor.unit', read_only=True)
    scope = serializers.CharField(source='emission_factor.scope', read_only=True)
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = CarbonTransaction
        fields = [
            'id', 'department', 'department_name', 'emission_factor',
            'emission_factor_name', 'emission_factor_unit', 'scope',
            'source_type', 'source_reference_id', 'description',
            'activity_quantity', 'calculated_emissions_kgco2e',
            'transaction_date', 'is_auto_calculated',
            'created_by', 'created_by_name', 'created_at',
        ]
        read_only_fields = ['calculated_emissions_kgco2e', 'created_by', 'created_at']

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return 'System'


class EnvironmentalGoalSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True, default='Organization-wide')
    metric_type_display = serializers.CharField(source='get_metric_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    progress_pct = serializers.ReadOnlyField()

    class Meta:
        model = EnvironmentalGoal
        fields = [
            'id', 'title', 'department', 'department_name',
            'metric_type', 'metric_type_display',
            'target_value', 'baseline_value', 'current_value', 'unit',
            'deadline', 'status', 'status_display', 'progress_pct',
            'created_at', 'updated_at',
        ]


# ---- Stub ERP serializers ----

class ERPRecordBaseSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        abstract = True


class PurchaseRecordSerializer(ERPRecordBaseSerializer):
    class Meta:
        model = PurchaseRecord
        fields = ['id', 'department', 'department_name', 'description',
                  'activity_type', 'quantity', 'unit', 'date', 'vendor', 'created_at']


class ManufacturingRecordSerializer(ERPRecordBaseSerializer):
    class Meta:
        model = ManufacturingRecord
        fields = ['id', 'department', 'department_name', 'description',
                  'activity_type', 'quantity', 'unit', 'date', 'product_line', 'created_at']


class ExpenseRecordSerializer(ERPRecordBaseSerializer):
    class Meta:
        model = ExpenseRecord
        fields = ['id', 'department', 'department_name', 'description',
                  'activity_type', 'quantity', 'unit', 'date', 'expense_category', 'created_at']


class FleetRecordSerializer(ERPRecordBaseSerializer):
    class Meta:
        model = FleetRecord
        fields = ['id', 'department', 'department_name', 'description',
                  'activity_type', 'quantity', 'unit', 'date', 'vehicle_id', 'created_at']


# ---- Dashboard aggregation serializers ----

class CarbonSummarySerializer(serializers.Serializer):
    """Aggregated carbon data for dashboard."""
    total_emissions = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_transactions = serializers.IntegerField()
    scope_1 = serializers.DecimalField(max_digits=14, decimal_places=2)
    scope_2 = serializers.DecimalField(max_digits=14, decimal_places=2)
    scope_3 = serializers.DecimalField(max_digits=14, decimal_places=2)
    by_department = serializers.ListField()
    by_month = serializers.ListField()
    recent_transactions = CarbonTransactionSerializer(many=True)
