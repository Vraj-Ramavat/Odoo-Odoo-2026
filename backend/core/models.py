from django.db import models


class Department(models.Model):
    """Organizational hierarchy and ESG ownership."""
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=20, unique=True)
    head = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='departments_headed',
    )
    parent_department = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='sub_departments',
    )
    employee_count = models.PositiveIntegerField(default=0)
    status = models.CharField(
        max_length=20,
        choices=[('active', 'Active'), ('inactive', 'Inactive')],
        default='active',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class Category(models.Model):
    """Shared category values used across Social and Gamification modules."""
    CATEGORY_TYPE_CHOICES = [
        ('csr', 'CSR Activity'),
        ('challenge', 'Challenge'),
    ]

    name = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=CATEGORY_TYPE_CHOICES)
    status = models.CharField(
        max_length=20,
        choices=[('active', 'Active'), ('inactive', 'Inactive')],
        default='active',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'categories'
        ordering = ['type', 'name']

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"


class ESGConfiguration(models.Model):
    """
    Singleton configuration for ESG scoring weights and feature toggles.
    Only one row should exist — use get_config() helper.
    """
    # Scoring weights (must sum to 100)
    environmental_weight = models.DecimalField(max_digits=5, decimal_places=2, default=40.00)
    social_weight = models.DecimalField(max_digits=5, decimal_places=2, default=30.00)
    governance_weight = models.DecimalField(max_digits=5, decimal_places=2, default=30.00)

    # Feature toggles
    auto_emission_calculation = models.BooleanField(
        default=True,
        help_text='When enabled, Carbon Transactions are auto-calculated from ERP records.'
    )
    evidence_required_for_csr = models.BooleanField(
        default=True,
        help_text='When enabled, CSR participation cannot be approved without proof file.'
    )
    badge_auto_award = models.BooleanField(
        default=True,
        help_text='When enabled, badges are auto-awarded when unlock rules are met.'
    )

    # Notification toggles
    notify_compliance_issue = models.BooleanField(default=True)
    notify_approval_decisions = models.BooleanField(default=True)
    notify_policy_reminders = models.BooleanField(default=True)
    notify_badge_unlocks = models.BooleanField(default=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'ESG Configuration'
        verbose_name_plural = 'ESG Configuration'

    def __str__(self):
        return 'ESG Configuration'

    def save(self, *args, **kwargs):
        # Enforce singleton: always use pk=1
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get_config(cls):
        """Get or create the singleton config row."""
        config, _ = cls.objects.get_or_create(pk=1)
        return config
