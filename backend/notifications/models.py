from django.db import models


class Notification(models.Model):
    """User notification — bell icon inbox."""
    TYPE_CHOICES = [
        ('info', 'Info'),
        ('success', 'Success'),
        ('warning', 'Warning'),
        ('badge', 'Badge Earned'),
        ('compliance', 'Compliance'),
        ('challenge', 'Challenge'),
        ('reward', 'Reward'),
    ]

    company = models.ForeignKey(
        'core.Company',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    recipient = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name='notifications',
    )
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='info')
    title = models.CharField(max_length=255)
    message = models.TextField(blank=True)
    is_read = models.BooleanField(default=False)
    link = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.notification_type}] {self.title} -> {self.recipient}"
