from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom User model with role-based access for EcoSphere."""

    class Role(models.TextChoices):
        SUPERADMIN = 'superadmin', 'Super Admin'
        ADMIN = 'admin', 'Admin'
        DEPT_HEAD = 'dept_head', 'Department Head'
        EMPLOYEE = 'employee', 'Employee'

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.EMPLOYEE,
    )
    company = models.ForeignKey(
        'core.Company',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='users',
    )
    department = models.ForeignKey(
        'core.Department',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='employees',
    )
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)

    class Meta:
        ordering = ['username']

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"

    @property
    def is_superadmin(self):
        return self.role == self.Role.SUPERADMIN

    @property
    def is_admin_user(self):
        return self.role == self.Role.ADMIN

    @property
    def is_dept_head(self):
        return self.role == self.Role.DEPT_HEAD

    @property
    def is_employee(self):
        return self.role == self.Role.EMPLOYEE
