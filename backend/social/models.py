from django.db import models


class CSRActivity(models.Model):
    """Corporate Social Responsibility activity."""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    company = models.ForeignKey(
        'core.Company',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='csr_activities',
    )
    category = models.ForeignKey(
        'core.Category', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='csr_activities',
    )
    department = models.ForeignKey(
        'core.Department', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='csr_activities',
    )
    organizer = models.ForeignKey(
        'accounts.User', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='organized_activities',
    )
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    location = models.CharField(max_length=255, blank=True)
    max_participants = models.PositiveIntegerField(default=50)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    impact_description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_date']
        verbose_name_plural = 'CSR Activities'

    def __str__(self):
        return self.title

    @property
    def participant_count(self):
        return self.participations.filter(status='approved').count()


class EmployeeParticipation(models.Model):
    """Employee participation in a CSR activity."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    company = models.ForeignKey(
        'core.Company',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='csr_participations',
    )
    activity = models.ForeignKey(
        CSRActivity, on_delete=models.CASCADE, related_name='participations',
    )
    employee = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name='csr_participations',
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    proof_file = models.FileField(upload_to='csr_proofs/', null=True, blank=True)
    proof_description = models.TextField(blank=True)
    hours_contributed = models.DecimalField(max_digits=6, decimal_places=1, default=0)
    reviewed_by = models.ForeignKey(
        'accounts.User', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='reviewed_participations',
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['activity', 'employee']
        ordering = ['-joined_at']

    def __str__(self):
        return f"{self.employee} -> {self.activity} [{self.status}]"
