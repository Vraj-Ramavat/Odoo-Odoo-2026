"""
Odoo Integration Webhook
========================
External entry point for ERP systems (Odoo, SAP, etc.) to push
transaction data that auto-creates carbon emission records.
"""
from datetime import date, datetime
from decimal import Decimal

from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from core.models import Department
from carbon.models import EmissionFactor, CarbonTransaction


class OdooWebhookSerializer(serializers.Serializer):
    source_type = serializers.ChoiceField(
        choices=['purchase', 'manufacturing', 'expense', 'fleet'],
    )
    source_reference_id = serializers.CharField(max_length=100)
    department_code = serializers.CharField(max_length=20)
    activity_type = serializers.CharField(max_length=100)
    quantity = serializers.DecimalField(max_digits=14, decimal_places=2)
    date = serializers.DateField()


@api_view(['POST'])
@permission_classes([AllowAny])  # Webhook — auth via API key in production
def odoo_webhook(request):
    """
    POST /api/integrations/odoo/webhook/

    Accepts ERP transaction data, looks up the department and active
    emission factor, then creates a CarbonTransaction with auto-calculated
    emissions — the same logic as the internal post_save signal.
    """
    serializer = OdooWebhookSerializer(data=request.data)
    serializer.validate_or_raise = True

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data

    # Look up department by code
    try:
        department = Department.objects.get(code=data['department_code'])
    except Department.DoesNotExist:
        return Response(
            {'error': f"Department with code '{data['department_code']}' not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Look up active emission factor by activity_type + date + company
    factor = EmissionFactor.get_active_factor(data['activity_type'], data['date'], company=department.company)
    if not factor:
        return Response(
            {'error': f"No active emission factor for '{data['activity_type']}' on {data['date']}"},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Compute emissions
    qty = Decimal(str(data['quantity']))
    fv = Decimal(str(factor.factor_value))
    emissions = qty * fv

    # Create transaction
    txn = CarbonTransaction.objects.create(
        company=department.company,
        department=department,
        emission_factor=factor,
        source_type=data['source_type'],
        source_reference_id=data['source_reference_id'],
        description=f"Odoo Webhook: {data['activity_type']} ({data['source_reference_id']})",
        activity_quantity=qty,
        calculated_emissions_kgco2e=emissions,
        transaction_date=data['date'],
        is_auto_calculated=True,
    )

    return Response({
        'status': 'success',
        'transaction_id': txn.id,
        'emissions_kgco2e': str(txn.calculated_emissions_kgco2e),
        'emission_factor_used': str(factor),
        'message': f'Carbon transaction created: {emissions:.2f} kgCO2e',
    }, status=status.HTTP_201_CREATED)
