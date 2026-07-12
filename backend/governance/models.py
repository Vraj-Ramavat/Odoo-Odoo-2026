from django.db import models


class ESGPolicy(models.Model):
    """ESG Policy document with acknowledgement tracking."""
    PRIORITY_CHOICES = [
        ('mandatory', 'Mandatory'),
        ('recommended', 'Recommended'),
        ('optional', 'Optional'),
    ]
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('archived', 'Archived'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    company = models.ForeignKey(
        'core.Company',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='policies',
    )
    document_file = models.FileField(upload_to='policies/', null=True, blank=True)
    category = models.CharField(max_length=50, choices=[
        ('environmental', 'Environmental'), ('social', 'Social'),
        ('governance', 'Governance'), ('general', 'General'),
    ], default='general')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='mandatory')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    effective_date = models.DateField()
    review_date = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(
        'accounts.User', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='created_policies',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-effective_date']
        verbose_name_plural = 'ESG Policies'

    def __str__(self):
        return self.title

    @property
    def acknowledgement_rate(self):
        total = self.acknowledgements.count()
        acked = self.acknowledgements.filter(acknowledged=True).count()
        return round(acked / total * 100, 1) if total else 0


class PolicyAcknowledgement(models.Model):
    """Tracks whether an employee has acknowledged a policy."""
    company = models.ForeignKey(
        'core.Company',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='policy_acknowledgements',
    )
    policy = models.ForeignKey(
        ESGPolicy, on_delete=models.CASCADE, related_name='acknowledgements',
    )
    employee = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name='policy_acknowledgements',
    )
    acknowledged = models.BooleanField(default=False)
    acknowledged_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['policy', 'employee']

    def __str__(self):
        status = 'Acknowledged' if self.acknowledged else 'Pending'
        return f"{self.employee} -> {self.policy} [{status}]"


class Audit(models.Model):
    """ESG Audit record."""
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]
    TYPE_CHOICES = [
        ('internal', 'Internal'),
        ('external', 'External'),
    ]

    title = models.CharField(max_length=255)
    company = models.ForeignKey(
        'core.Company',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='audits',
    )
    audit_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='internal')
    department = models.ForeignKey(
        'core.Department', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='audits',
    )
    auditor = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    scheduled_date = models.DateField()
    completed_date = models.DateField(null=True, blank=True)
    findings = models.TextField(blank=True)
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-scheduled_date']

    def __str__(self):
        return f"{self.title} ({self.status})"


class ComplianceIssue(models.Model):
    """Compliance issue linked to an audit."""
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    company = models.ForeignKey(
        'core.Company',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='compliance_issues',
    )
    audit = models.ForeignKey(
        Audit, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='issues',
    )
    department = models.ForeignKey(
        'core.Department', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='compliance_issues',
    )
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    assigned_to = models.ForeignKey(
        'accounts.User', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='assigned_issues',
    )
    due_date = models.DateField(null=True, blank=True)
    resolved_date = models.DateField(null=True, blank=True)
    is_overdue = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} [{self.severity}/{self.status}]"
