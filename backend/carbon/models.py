from django.db import models
from django.core.exceptions import ValidationError


class EmissionFactor(models.Model):
    """
    Carbon emission factors used during calculations.
    VERSIONED: never mutate in place — creating a new factor for an activity
    type that already has an active one sets effective_to on the old one.
    """
    SCOPE_CHOICES = [
        ('1', 'Scope 1 - Direct'),
        ('2', 'Scope 2 - Indirect (Energy)'),
        ('3', 'Scope 3 - Indirect (Other)'),
    ]

    activity_type = models.CharField(max_length=100)  # e.g. "Electricity - Grid", "Diesel - Fleet"
    company = models.ForeignKey(
        'core.Company',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='emission_factors',
    )
    scope = models.CharField(max_length=10, choices=SCOPE_CHOICES)
    unit = models.CharField(max_length=30)  # kWh, litre, kg, km
    factor_value = models.DecimalField(max_digits=12, decimal_places=6)  # kgCO2e per unit
    source = models.CharField(max_length=255, blank=True)  # e.g. "DEFRA 2025", "EPA eGRID"
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)  # null = still active
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-effective_from', 'activity_type']

    def __str__(self):
        status = "Active" if self.is_active else f"Expired {self.effective_to}"
        return f"{self.activity_type} ({self.scope}) — {self.factor_value} kgCO2e/{self.unit} [{status}]"

    @classmethod
    def get_active_factor(cls, activity_type, date=None, company=None):
        """Look up the active emission factor for an activity type at a given date."""
        from django.utils import timezone
        if date is None:
            date = timezone.now().date()
        qs = cls.objects.filter(
            activity_type=activity_type,
            is_active=True,
            effective_from__lte=date,
        )
        if company:
            qs = qs.filter(company=company)
        return qs.filter(
            models.Q(effective_to__isnull=True) | models.Q(effective_to__gte=date)
        ).order_by('-effective_from').first()


class EnvironmentalGoal(models.Model):
    """Sustainability targets per department or organization-wide."""
    METRIC_TYPE_CHOICES = [
        ('carbon_reduction_pct', 'Carbon Reduction %'),
        ('renewable_energy_pct', 'Renewable Energy %'),
        ('waste_reduction_pct', 'Waste Reduction %'),
        ('water_reduction_pct', 'Water Reduction %'),
        ('energy_efficiency', 'Energy Efficiency'),
    ]
    STATUS_CHOICES = [
        ('on_track', 'On Track'),
        ('at_risk', 'At Risk'),
        ('missed', 'Missed'),
        ('achieved', 'Achieved'),
    ]

    title = models.CharField(max_length=255)
    company = models.ForeignKey(
        'core.Company',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='environmental_goals',
    )
    department = models.ForeignKey(
        'core.Department', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='environmental_goals',
    )
    metric_type = models.CharField(max_length=50, choices=METRIC_TYPE_CHOICES)
    target_value = models.DecimalField(max_digits=10, decimal_places=2)
    baseline_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    current_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    unit = models.CharField(max_length=30, default='%')
    deadline = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='on_track')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['deadline']

    def __str__(self):
        return f"{self.title} — {self.current_value}/{self.target_value}"

    @property
    def progress_pct(self):
        if self.target_value == 0:
            return 0
        return min(round(float(self.current_value) / float(self.target_value) * 100, 1), 100)


class CarbonTransaction(models.Model):
    """Stores calculated emissions from ERP operations or manual entry."""
    SOURCE_TYPE_CHOICES = [
        ('purchase', 'Purchase'),
        ('manufacturing', 'Manufacturing'),
        ('expense', 'Expense'),
        ('fleet', 'Fleet'),
        ('manual', 'Manual Entry'),
    ]

    company = models.ForeignKey(
        'core.Company',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='carbon_transactions',
    )
    department = models.ForeignKey(
        'core.Department', on_delete=models.CASCADE,
        related_name='carbon_transactions',
    )
    emission_factor = models.ForeignKey(
        EmissionFactor, on_delete=models.PROTECT,  # PROTECT: never delete a factor with linked transactions
        related_name='transactions',
    )
    source_type = models.CharField(max_length=20, choices=SOURCE_TYPE_CHOICES)
    source_reference_id = models.CharField(max_length=100, null=True, blank=True)
    description = models.CharField(max_length=255, blank=True)
    activity_quantity = models.DecimalField(max_digits=14, decimal_places=4)
    calculated_emissions_kgco2e = models.DecimalField(max_digits=14, decimal_places=4)
    transaction_date = models.DateField()
    is_auto_calculated = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        'accounts.User', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='carbon_transactions',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-transaction_date', '-created_at']

    def __str__(self):
        return f"{self.source_type}: {self.calculated_emissions_kgco2e} kgCO2e on {self.transaction_date}"

    def save(self, *args, **kwargs):
        # Auto-compute emissions = quantity * factor_value
        if self.emission_factor_id:
            from decimal import Decimal
            qty = Decimal(str(self.activity_quantity))
            fv = Decimal(str(self.emission_factor.factor_value))
            self.calculated_emissions_kgco2e = qty * fv
        super().save(*args, **kwargs)


# ============================================================
# Stub ERP Models — minimal models so auto-calc signal has
# something real to attach to. In a real ERP these would be
# full Purchase Orders, Manufacturing Orders, etc.
# ============================================================

class ERPRecord(models.Model):
    """Abstract base for stub ERP records."""
    department = models.ForeignKey(
        'core.Department', on_delete=models.CASCADE,
    )
    description = models.CharField(max_length=255)
    activity_type = models.CharField(
        max_length=100,
        help_text='Must match an EmissionFactor activity_type for auto-calc',
    )
    quantity = models.DecimalField(max_digits=14, decimal_places=4)
    unit = models.CharField(max_length=30)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True
        ordering = ['-date']


class PurchaseRecord(ERPRecord):
    """Stub: Purchase orders (e.g. raw materials, supplies)."""
    vendor = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"Purchase: {self.description} ({self.quantity} {self.unit})"


class ManufacturingRecord(ERPRecord):
    """Stub: Manufacturing operations."""
    product_line = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"Manufacturing: {self.description} ({self.quantity} {self.unit})"


class ExpenseRecord(ERPRecord):
    """Stub: Business expenses (e.g. utility bills, travel)."""
    expense_category = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"Expense: {self.description} ({self.quantity} {self.unit})"


class FleetRecord(ERPRecord):
    """Stub: Fleet/vehicle operations."""
    vehicle_id = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return f"Fleet: {self.description} ({self.quantity} {self.unit})"
