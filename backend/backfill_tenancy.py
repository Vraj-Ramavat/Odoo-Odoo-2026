import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecosphere.settings')
django.setup()

from core.models import Company, Department
from accounts.models import User
from carbon.models import EmissionFactor, EnvironmentalGoal, CarbonTransaction
from social.models import CSRActivity, EmployeeParticipation
from governance.models import ESGPolicy, PolicyAcknowledgement, Audit, ComplianceIssue
from gamification.models import Challenge, ChallengeParticipation, EmployeeXP, Badge, EmployeeBadge, Reward, RewardRedemption, DepartmentScore
from notifications.models import Notification

def backfill():
    # 1. Create default company
    default_company, created = Company.objects.get_or_create(
        code='default',
        defaults={'name': 'Default Company'}
    )
    print(f"Default Company: {default_company.name} ({default_company.code}) - Created: {created}")

    models_to_backfill = [
        User, Department, EmissionFactor, EnvironmentalGoal, CarbonTransaction,
        CSRActivity, EmployeeParticipation, ESGPolicy, PolicyAcknowledgement, Audit,
        ComplianceIssue, Challenge, ChallengeParticipation, EmployeeXP, Badge,
        EmployeeBadge, Reward, RewardRedemption, DepartmentScore, Notification
    ]

    for model in models_to_backfill:
        null_company_records = model.objects.filter(company__isnull=True)
        count = null_company_records.count()
        if count > 0:
            null_company_records.update(company=default_company)
            print(f"Backfilled {count} records for model {model.__name__}")
        else:
            print(f"No null-company records for model {model.__name__}")

if __name__ == '__main__':
    backfill()
