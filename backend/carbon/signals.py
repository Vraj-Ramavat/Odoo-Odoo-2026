"""
Auto Emission Calculation signal handler.
When an ERP record (Purchase/Manufacturing/Expense/Fleet) is saved,
automatically creates a CarbonTransaction if:
  1. ESGConfiguration.auto_emission_calculation is enabled
  2. A matching active EmissionFactor exists for the activity_type
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from decimal import Decimal

from core.models import ESGConfiguration
from .models import (
    EmissionFactor, CarbonTransaction,
    PurchaseRecord, ManufacturingRecord, ExpenseRecord, FleetRecord,
)

SOURCE_TYPE_MAP = {
    'PurchaseRecord': 'purchase',
    'ManufacturingRecord': 'manufacturing',
    'ExpenseRecord': 'expense',
    'FleetRecord': 'fleet',
}


def auto_create_carbon_transaction(sender, instance, created, **kwargs):
    """
    Signal-driven auto emission calculation (Section 3.1 of plan).
    Fires on every ERP record save when toggle is enabled.
    """
    company = getattr(instance.department, 'company', None)
    config = ESGConfiguration.get_config(company=company)
    if not config.auto_emission_calculation:
        return

    # Find matching active emission factor for this tenant company
    factor = EmissionFactor.get_active_factor(
        activity_type=instance.activity_type,
        date=instance.date,
        company=company,
    )
    if factor is None:
        return  # No matching factor — skip silently

    source_type = SOURCE_TYPE_MAP.get(sender.__name__, 'manual')
    source_ref = f"{sender.__name__}:{instance.pk}"

    # Prevent duplicate: check if we already have a transaction for this source
    if CarbonTransaction.objects.filter(
        source_reference_id=source_ref,
        source_type=source_type,
    ).exists():
        if not created:
            # Update existing transaction on re-save
            txn = CarbonTransaction.objects.get(
                source_reference_id=source_ref,
                source_type=source_type,
            )
            txn.activity_quantity = instance.quantity
            txn.emission_factor = factor
            txn.transaction_date = instance.date
            txn.department = instance.department
            txn.company = company
            txn.save()
        return

    CarbonTransaction.objects.create(
        company=company,
        department=instance.department,
        emission_factor=factor,
        source_type=source_type,
        source_reference_id=source_ref,
        description=f"Auto: {instance.description}",
        activity_quantity=instance.quantity,
        calculated_emissions_kgco2e=Decimal(str(instance.quantity)) * Decimal(str(factor.factor_value)),
        transaction_date=instance.date,
        is_auto_calculated=True,
    )


# Register signal for all ERP models
for model_class in [PurchaseRecord, ManufacturingRecord, ExpenseRecord, FleetRecord]:
    post_save.connect(auto_create_carbon_transaction, sender=model_class)
