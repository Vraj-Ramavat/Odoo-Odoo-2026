from django.db import models
import json


class Challenge(models.Model):
    """Sustainability challenge with lifecycle state machine."""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('under_review', 'Under Review'),
        ('completed', 'Completed'),
        ('archived', 'Archived'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    company = models.ForeignKey(
        'core.Company',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='challenges',
    )
    category = models.ForeignKey(
        'core.Category', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='challenges',
    )
    department = models.ForeignKey(
        'core.Department', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='challenges',
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    xp_reward = models.PositiveIntegerField(default=100)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    target_value = models.DecimalField(max_digits=10, decimal_places=2, default=100)
    target_unit = models.CharField(max_length=30, default='points')
    max_participants = models.PositiveIntegerField(default=100)
    created_by = models.ForeignKey(
        'accounts.User', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='created_challenges',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} [{self.status}]"

    @property
    def participant_count(self):
        return self.participations.count()


class ChallengeParticipation(models.Model):
    """Employee participation in a challenge."""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('withdrawn', 'Withdrawn'),
    ]

    company = models.ForeignKey(
        'core.Company',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='challenge_participations',
    )
    challenge = models.ForeignKey(
        Challenge, on_delete=models.CASCADE, related_name='participations',
    )
    employee = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name='challenge_participations',
    )
    progress = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    proof_file = models.FileField(upload_to='challenge_proofs/', null=True, blank=True)
    joined_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['challenge', 'employee']
        ordering = ['-progress']

    def __str__(self):
        return f"{self.employee} -> {self.challenge} ({self.progress})"

    @property
    def progress_pct(self):
        if self.challenge.target_value == 0:
            return 0
        return min(round(float(self.progress) / float(self.challenge.target_value) * 100, 1), 100)


class EmployeeXP(models.Model):
    """Tracks total XP for an employee."""
    company = models.ForeignKey(
        'core.Company',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='employee_xps',
    )
    employee = models.OneToOneField(
        'accounts.User', on_delete=models.CASCADE, related_name='xp_record',
    )
    total_xp = models.PositiveIntegerField(default=0)
    level = models.PositiveIntegerField(default=1)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee} — {self.total_xp} XP (Lvl {self.level})"

    def add_xp(self, amount):
        self.total_xp += amount
        self.level = (self.total_xp // 500) + 1
        self.save()


class Badge(models.Model):
    """Badge with JSON-driven unlock rules."""
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    company = models.ForeignKey(
        'core.Company',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='badges',
    )
    icon = models.CharField(max_length=50, default='award')  # lucide icon name
    color = models.CharField(max_length=20, default='#10b981')
    unlock_rule = models.JSONField(default=dict, help_text='JSON rule for auto-awarding')
    # Example: {"type": "xp_threshold", "value": 500}
    # or: {"type": "challenges_completed", "value": 3}
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['title']

    def __str__(self):
        return self.title

    def check_eligibility(self, user):
        """Generic JSON-rule evaluator for badge auto-awarding."""
        rule = self.unlock_rule
        rule_type = rule.get('type', '')
        value = rule.get('value', 0)

        if rule_type == 'xp_threshold':
            xp = getattr(user, 'xp_record', None)
            return xp and xp.total_xp >= value

        if rule_type == 'challenges_completed':
            count = user.challenge_participations.filter(status='completed').count()
            return count >= value

        if rule_type == 'csr_participations':
            count = user.csr_participations.filter(status='approved').count()
            return count >= value

        if rule_type == 'consecutive_logins':
            return False  # Stub — would need login tracking

        return False


class EmployeeBadge(models.Model):
    """Badge awarded to an employee."""
    company = models.ForeignKey(
        'core.Company',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='employee_badges',
    )
    employee = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name='badges',
    )
    badge = models.ForeignKey(
        Badge, on_delete=models.CASCADE, related_name='awards',
    )
    awarded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['employee', 'badge']

    def __str__(self):
        return f"{self.employee} earned {self.badge}"


class Reward(models.Model):
    """Redeemable reward in the ESG reward catalog."""
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    company = models.ForeignKey(
        'core.Company',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='rewards',
    )
    xp_cost = models.PositiveIntegerField(default=100)
    stock = models.PositiveIntegerField(default=10)
    icon = models.CharField(max_length=50, default='gift')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['xp_cost']

    def __str__(self):
        return f"{self.title} ({self.xp_cost} XP, {self.stock} left)"


class RewardRedemption(models.Model):
    """Record of a reward redemption — uses select_for_update() in the view."""
    company = models.ForeignKey(
        'core.Company',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='reward_redemptions',
    )
    employee = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name='redemptions',
    )
    reward = models.ForeignKey(
        Reward, on_delete=models.CASCADE, related_name='redemptions',
    )
    xp_spent = models.PositiveIntegerField()
    redeemed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.employee} redeemed {self.reward}"


class DepartmentScore(models.Model):
    """Snapshot-based ESG score per department — never computed live."""
    company = models.ForeignKey(
        'core.Company',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='department_scores',
    )
    department = models.ForeignKey(
        'core.Department', on_delete=models.CASCADE, related_name='scores',
    )
    environmental_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    social_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    governance_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    total_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    period = models.DateField(help_text='First day of the scoring period')
    calculated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-period', '-total_score']
        unique_together = ['department', 'period']

    def __str__(self):
        return f"{self.department} — {self.total_score}/100 ({self.period})"
