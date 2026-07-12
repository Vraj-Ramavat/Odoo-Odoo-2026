from django.contrib import admin
from .models import (
    EmissionFactor, CarbonTransaction, EnvironmentalGoal,
    PurchaseRecord, ManufacturingRecord, ExpenseRecord, FleetRecord,
)


@admin.register(EmissionFactor)
class EmissionFactorAdmin(admin.ModelAdmin):
    list_display = ['activity_type', 'scope', 'factor_value', 'unit', 'source',
                    'effective_from', 'effective_to', 'is_active']
    list_filter = ['scope', 'is_active']
    search_fields = ['activity_type', 'source']


@admin.register(CarbonTransaction)
class CarbonTransactionAdmin(admin.ModelAdmin):
    list_display = ['department', 'source_type', 'activity_quantity',
                    'calculated_emissions_kgco2e', 'transaction_date', 'is_auto_calculated']
    list_filter = ['source_type', 'is_auto_calculated', 'department']
    date_hierarchy = 'transaction_date'


@admin.register(EnvironmentalGoal)
class EnvironmentalGoalAdmin(admin.ModelAdmin):
    list_display = ['title', 'department', 'metric_type', 'target_value',
                    'current_value', 'deadline', 'status']
    list_filter = ['status', 'metric_type']


@admin.register(PurchaseRecord)
class PurchaseRecordAdmin(admin.ModelAdmin):
    list_display = ['description', 'department', 'activity_type', 'quantity', 'unit', 'date']

@admin.register(ManufacturingRecord)
class ManufacturingRecordAdmin(admin.ModelAdmin):
    list_display = ['description', 'department', 'activity_type', 'quantity', 'unit', 'date']

@admin.register(ExpenseRecord)
class ExpenseRecordAdmin(admin.ModelAdmin):
    list_display = ['description', 'department', 'activity_type', 'quantity', 'unit', 'date']

@admin.register(FleetRecord)
class FleetRecordAdmin(admin.ModelAdmin):
    list_display = ['description', 'department', 'activity_type', 'quantity', 'unit', 'date']
