"""
EcoSphere Demo Data Seeder
==========================
Idempotent management command that wipes and repopulates the database
with realistic demo data for hackathon presentation.

Usage:  python manage.py seed_demo_data
"""
import random
from datetime import date, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import User
from core.models import Department, Category, ESGConfiguration
from carbon.models import (
    EmissionFactor, CarbonTransaction, EnvironmentalGoal,
    PurchaseRecord, ManufacturingRecord, ExpenseRecord, FleetRecord,
)
from social.models import CSRActivity, EmployeeParticipation
from governance.models import ESGPolicy, PolicyAcknowledgement, Audit, ComplianceIssue
from gamification.models import (
    Challenge, ChallengeParticipation, Badge, EmployeeBadge,
    EmployeeXP, Reward, RewardRedemption, DepartmentScore,
)
from notifications.models import Notification


class Command(BaseCommand):
    help = 'Seed the database with realistic demo data for EcoSphere hackathon demo'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('\n=== Wiping existing demo data ==='))
        self._wipe()

        self.stdout.write(self.style.WARNING('\n=== Seeding fresh demo data ==='))
        config = self._seed_config()
        departments = self._seed_departments()
        categories = self._seed_categories()
        users = self._seed_users(departments)
        employees = [u for u in users if u.role == 'employee']
        dept_heads = [u for u in users if u.role == 'dept_head']
        admin = User.objects.filter(role='admin').first()

        factors = self._seed_emission_factors()
        self._seed_carbon_transactions(departments, factors)
        goals = self._seed_environmental_goals(departments)

        self._seed_csr_activities(departments, categories, employees, dept_heads)
        self._seed_policies_and_acknowledgements(users, admin)
        self._seed_audits_and_compliance(departments, dept_heads)
        self._seed_challenges(departments, categories, employees, admin)
        self._seed_badges_and_xp(employees)
        self._seed_rewards(employees)
        self._seed_department_scores(departments)
        self._seed_notifications(users)

        self.stdout.write(self.style.SUCCESS('\n=== Demo data seeded successfully! ==='))
        self.stdout.write(self.style.SUCCESS('Login credentials:'))
        self.stdout.write('  Admin:     admin / EcoSphere2026!')
        self.stdout.write('  Dept Head: sarah.chen / EcoSphere2026!')
        self.stdout.write('  Employee:  james.wilson / EcoSphere2026!')

    def _wipe(self):
        """Clear all demo-related tables. Order matters for FK constraints."""
        Notification.objects.all().delete()
        RewardRedemption.objects.all().delete()
        EmployeeBadge.objects.all().delete()
        ChallengeParticipation.objects.all().delete()
        DepartmentScore.objects.all().delete()
        EmployeeXP.objects.all().delete()
        Reward.objects.all().delete()
        Badge.objects.all().delete()
        Challenge.objects.all().delete()
        ComplianceIssue.objects.all().delete()
        Audit.objects.all().delete()
        PolicyAcknowledgement.objects.all().delete()
        ESGPolicy.objects.all().delete()
        EmployeeParticipation.objects.all().delete()
        CSRActivity.objects.all().delete()
        EnvironmentalGoal.objects.all().delete()
        CarbonTransaction.objects.all().delete()
        PurchaseRecord.objects.all().delete()
        ManufacturingRecord.objects.all().delete()
        ExpenseRecord.objects.all().delete()
        FleetRecord.objects.all().delete()
        EmissionFactor.objects.all().delete()
        Category.objects.all().delete()
        Department.objects.all().delete()
        User.objects.all().delete()
        self.stdout.write('  Cleared all tables')

    # ------------------------------------------------------------------
    # CONFIG
    # ------------------------------------------------------------------
    def _seed_config(self):
        config, _ = ESGConfiguration.objects.update_or_create(
            pk=1,
            defaults={
                'environmental_weight': 40,
                'social_weight': 30,
                'governance_weight': 30,
                'auto_emission_calculation': True,
                'evidence_required_for_csr': True,
                'badge_auto_award': True,
                'notify_compliance_issue': True,
                'notify_approval_decisions': True,
                'notify_policy_reminders': True,
                'notify_badge_unlocks': True,
            }
        )
        self.stdout.write('  ESG Configuration set (40/30/30)')
        return config

    # ------------------------------------------------------------------
    # DEPARTMENTS
    # ------------------------------------------------------------------
    def _seed_departments(self):
        dept_data = [
            {'name': 'Engineering', 'code': 'ENG', 'employee_count': 45},
            {'name': 'Sales & Marketing', 'code': 'SAL', 'employee_count': 32},
            {'name': 'Operations', 'code': 'OPS', 'employee_count': 28},
            {'name': 'Human Resources', 'code': 'HR', 'employee_count': 15},
        ]
        depts = []
        for d in dept_data:
            dept = Department.objects.create(**d, status='active')
            depts.append(dept)
        self.stdout.write(f'  Created {len(depts)} departments')
        return depts

    # ------------------------------------------------------------------
    # CATEGORIES
    # ------------------------------------------------------------------
    def _seed_categories(self):
        cat_data = [
            ('Community Outreach', 'csr'), ('Environmental Cleanup', 'csr'),
            ('Education & Mentoring', 'csr'), ('Health & Wellness', 'csr'),
            ('Diversity & Inclusion', 'csr'),
            ('Reduce & Recycle', 'challenge'), ('Green Commute', 'challenge'),
            ('Energy Saving', 'challenge'), ('Water Conservation', 'challenge'),
            ('Zero Waste Week', 'challenge'),
        ]
        cats = []
        for name, ctype in cat_data:
            cat = Category.objects.create(name=name, type=ctype, status='active')
            cats.append(cat)
        self.stdout.write(f'  Created {len(cats)} categories')
        return cats

    # ------------------------------------------------------------------
    # USERS
    # ------------------------------------------------------------------
    def _seed_users(self, departments):
        PASSWORD = 'EcoSphere2026!'
        user_data = [
            # Admins
            {'username': 'admin', 'first_name': 'Priya', 'last_name': 'Sharma',
             'email': 'priya.sharma@ecosphere.io', 'role': 'admin', 'department': None},
            {'username': 'rahul.admin', 'first_name': 'Rahul', 'last_name': 'Kapoor',
             'email': 'rahul.kapoor@ecosphere.io', 'role': 'admin', 'department': None},
            # Dept Heads
            {'username': 'sarah.chen', 'first_name': 'Sarah', 'last_name': 'Chen',
             'email': 'sarah.chen@ecosphere.io', 'role': 'dept_head', 'department': departments[0]},
            {'username': 'michael.brooks', 'first_name': 'Michael', 'last_name': 'Brooks',
             'email': 'michael.brooks@ecosphere.io', 'role': 'dept_head', 'department': departments[1]},
            {'username': 'anika.patel', 'first_name': 'Anika', 'last_name': 'Patel',
             'email': 'anika.patel@ecosphere.io', 'role': 'dept_head', 'department': departments[2]},
            {'username': 'david.martinez', 'first_name': 'David', 'last_name': 'Martinez',
             'email': 'david.martinez@ecosphere.io', 'role': 'dept_head', 'department': departments[3]},
            # Employees
            {'username': 'james.wilson', 'first_name': 'James', 'last_name': 'Wilson',
             'email': 'james.wilson@ecosphere.io', 'role': 'employee', 'department': departments[0]},
            {'username': 'emily.zhang', 'first_name': 'Emily', 'last_name': 'Zhang',
             'email': 'emily.zhang@ecosphere.io', 'role': 'employee', 'department': departments[0]},
            {'username': 'raj.gupta', 'first_name': 'Raj', 'last_name': 'Gupta',
             'email': 'raj.gupta@ecosphere.io', 'role': 'employee', 'department': departments[0]},
            {'username': 'lisa.johnson', 'first_name': 'Lisa', 'last_name': 'Johnson',
             'email': 'lisa.johnson@ecosphere.io', 'role': 'employee', 'department': departments[1]},
            {'username': 'omar.hassan', 'first_name': 'Omar', 'last_name': 'Hassan',
             'email': 'omar.hassan@ecosphere.io', 'role': 'employee', 'department': departments[1]},
            {'username': 'sophia.lee', 'first_name': 'Sophia', 'last_name': 'Lee',
             'email': 'sophia.lee@ecosphere.io', 'role': 'employee', 'department': departments[2]},
            {'username': 'carlos.rivera', 'first_name': 'Carlos', 'last_name': 'Rivera',
             'email': 'carlos.rivera@ecosphere.io', 'role': 'employee', 'department': departments[2]},
            {'username': 'nina.kovacs', 'first_name': 'Nina', 'last_name': 'Kovacs',
             'email': 'nina.kovacs@ecosphere.io', 'role': 'employee', 'department': departments[3]},
            {'username': 'alex.thompson', 'first_name': 'Alex', 'last_name': 'Thompson',
             'email': 'alex.thompson@ecosphere.io', 'role': 'employee', 'department': departments[0]},
            {'username': 'mei.tanaka', 'first_name': 'Mei', 'last_name': 'Tanaka',
             'email': 'mei.tanaka@ecosphere.io', 'role': 'employee', 'department': departments[1]},
            {'username': 'daniel.okafor', 'first_name': 'Daniel', 'last_name': 'Okafor',
             'email': 'daniel.okafor@ecosphere.io', 'role': 'employee', 'department': departments[2]},
            {'username': 'anna.kowalski', 'first_name': 'Anna', 'last_name': 'Kowalski',
             'email': 'anna.kowalski@ecosphere.io', 'role': 'employee', 'department': departments[3]},
        ]
        users = []
        for ud in user_data:
            u = User.objects.create_user(
                username=ud['username'],
                password=PASSWORD,
                first_name=ud['first_name'],
                last_name=ud['last_name'],
                email=ud['email'],
                role=ud['role'],
                department=ud.get('department'),
            )
            if ud['role'] == 'admin':
                u.is_staff = True
                u.is_superuser = True
                u.save()
            users.append(u)

        # Assign dept heads
        for i, dept in enumerate(Department.objects.all()):
            head = User.objects.filter(role='dept_head', department=dept).first()
            if head:
                dept.head = head
                dept.save()

        self.stdout.write(f'  Created {len(users)} users (2 admins, 4 dept heads, 12 employees)')
        return users

    # ------------------------------------------------------------------
    # EMISSION FACTORS (with one superseded version for versioning demo)
    # ------------------------------------------------------------------
    def _seed_emission_factors(self):
        today = date.today()
        factors_data = [
            # Superseded version (old Electricity factor)
            {'activity_type': 'Electricity - Grid', 'scope': '2', 'unit': 'kWh',
             'factor_value': '0.453000', 'source': 'DEFRA 2024',
             'effective_from': date(2024, 1, 1), 'effective_to': date(2024, 12, 31),
             'is_active': False},
            # Current version
            {'activity_type': 'Electricity - Grid', 'scope': '2', 'unit': 'kWh',
             'factor_value': '0.417000', 'source': 'DEFRA 2025',
             'effective_from': date(2025, 1, 1), 'is_active': True},
            {'activity_type': 'Natural Gas', 'scope': '1', 'unit': 'm3',
             'factor_value': '2.020000', 'source': 'DEFRA 2025',
             'effective_from': date(2025, 1, 1), 'is_active': True},
            {'activity_type': 'Diesel - Fleet', 'scope': '1', 'unit': 'litre',
             'factor_value': '2.689000', 'source': 'DEFRA 2025',
             'effective_from': date(2025, 1, 1), 'is_active': True},
            {'activity_type': 'Petrol - Fleet', 'scope': '1', 'unit': 'litre',
             'factor_value': '2.315000', 'source': 'DEFRA 2025',
             'effective_from': date(2025, 1, 1), 'is_active': True},
            {'activity_type': 'Business Travel - Air', 'scope': '3', 'unit': 'km',
             'factor_value': '0.171000', 'source': 'DEFRA 2025',
             'effective_from': date(2025, 1, 1), 'is_active': True},
            {'activity_type': 'Waste - Landfill', 'scope': '3', 'unit': 'kg',
             'factor_value': '0.587000', 'source': 'EPA 2025',
             'effective_from': date(2025, 1, 1), 'is_active': True},
            {'activity_type': 'Water Supply', 'scope': '3', 'unit': 'm3',
             'factor_value': '0.344000', 'source': 'DEFRA 2025',
             'effective_from': date(2025, 1, 1), 'is_active': True},
        ]
        factors = []
        for fd in factors_data:
            f = EmissionFactor.objects.create(**fd)
            factors.append(f)
        self.stdout.write(f'  Created {len(factors)} emission factors (1 superseded for versioning demo)')
        return [f for f in factors if f.is_active]

    # ------------------------------------------------------------------
    # CARBON TRANSACTIONS (8 weeks of realistic history)
    # ------------------------------------------------------------------
    def _seed_carbon_transactions(self, departments, factors):
        today = date.today()
        count = 0

        # Map activity types to factors
        factor_map = {f.activity_type: f for f in factors}
        elec = factor_map.get('Electricity - Grid')
        diesel = factor_map.get('Diesel - Fleet')
        gas = factor_map.get('Natural Gas')
        air = factor_map.get('Business Travel - Air')
        waste = factor_map.get('Waste - Landfill')

        def _make_txn(**kwargs):
            """Create a CarbonTransaction — let the model save() compute emissions."""
            ef = kwargs.pop('emission_factor')
            qty = kwargs.pop('activity_quantity')
            CarbonTransaction.objects.create(
                emission_factor=ef,
                activity_quantity=qty,
                calculated_emissions_kgco2e=Decimal(str(qty)) * Decimal(str(ef.factor_value)),
                **kwargs,
            )

        for week_offset in range(8):
            week_date = today - timedelta(weeks=week_offset)
            trend_factor = 1.0 + (week_offset * 0.04)  # older = higher

            for dept in departments:
                if elec:
                    qty = round(random.uniform(8000, 18000) * trend_factor, 1)
                    _make_txn(
                        department=dept, emission_factor=elec, source_type='purchase',
                        description=f'Weekly electricity - {week_date.strftime("%b %d")}',
                        activity_quantity=qty,
                        transaction_date=week_date, is_auto_calculated=week_offset % 2 == 0,
                    )
                    count += 1

                if diesel and dept.code in ('OPS', 'SAL'):
                    qty = round(random.uniform(200, 600) * trend_factor, 1)
                    _make_txn(
                        department=dept, emission_factor=diesel, source_type='fleet',
                        description=f'Fleet fuel - {week_date.strftime("%b %d")}',
                        activity_quantity=qty,
                        transaction_date=week_date, is_auto_calculated=True,
                    )
                    count += 1

                if gas and dept.code in ('ENG', 'OPS'):
                    qty = round(random.uniform(100, 400) * trend_factor, 1)
                    _make_txn(
                        department=dept, emission_factor=gas, source_type='manufacturing',
                        description=f'Heating/process gas - {week_date.strftime("%b %d")}',
                        activity_quantity=qty,
                        transaction_date=week_date, is_auto_calculated=False,
                    )
                    count += 1

            if air and week_offset % 2 == 0:
                dept = random.choice(departments)
                qty = round(random.uniform(1500, 5000), 0)
                _make_txn(
                    department=dept, emission_factor=air, source_type='expense',
                    description=f'Business flight - Week {8 - week_offset}',
                    activity_quantity=qty,
                    transaction_date=week_date, is_auto_calculated=False,
                )
                count += 1

        self.stdout.write(f'  Created {count} carbon transactions (8 weeks, trending downward)')

    # ------------------------------------------------------------------
    # ENVIRONMENTAL GOALS
    # ------------------------------------------------------------------
    def _seed_environmental_goals(self, departments):
        today = date.today()
        goals_data = [
            {'title': 'Reduce Carbon Emissions 20% by Q4', 'department': departments[0],
             'metric_type': 'carbon_reduction_pct', 'target_value': 20,
             'current_value': Decimal('12.5'), 'baseline_value': 100,
             'status': 'on_track', 'deadline': today + timedelta(days=120)},
            {'title': 'Achieve 50% Renewable Energy', 'department': departments[2],
             'metric_type': 'renewable_energy_pct', 'target_value': 50,
             'current_value': Decimal('28'), 'baseline_value': 15,
             'status': 'at_risk', 'deadline': today + timedelta(days=60)},
            {'title': 'Zero Waste to Landfill - HR', 'department': departments[3],
             'metric_type': 'waste_reduction_pct', 'target_value': 100,
             'current_value': Decimal('100'), 'baseline_value': 0,
             'status': 'achieved', 'deadline': today - timedelta(days=10)},
            {'title': 'Water Usage Reduction 15%', 'department': None,
             'metric_type': 'water_reduction_pct', 'target_value': 15,
             'current_value': Decimal('9.2'), 'baseline_value': 100,
             'status': 'on_track', 'deadline': today + timedelta(days=200)},
        ]
        for gd in goals_data:
            EnvironmentalGoal.objects.create(**gd)
        self.stdout.write(f'  Created {len(goals_data)} environmental goals')

    # ------------------------------------------------------------------
    # CSR ACTIVITIES & PARTICIPATIONS
    # ------------------------------------------------------------------
    def _seed_csr_activities(self, departments, categories, employees, dept_heads):
        today = date.today()
        csr_cats = Category.objects.filter(type='csr')

        activities_data = [
            {'title': 'River Cleanup Drive', 'description': 'Community river bank cleanup and awareness',
             'category': csr_cats[1] if csr_cats.count() > 1 else None, 'department': departments[0],
             'organizer': dept_heads[0] if dept_heads else None,
             'start_date': today - timedelta(days=30), 'end_date': today - timedelta(days=29),
             'location': 'Green Valley Riverside', 'max_participants': 30, 'status': 'completed',
             'impact_description': '2.5 tons of waste collected, 3km of riverbank cleaned'},
            {'title': 'STEM Mentoring Program', 'description': 'Monthly mentoring for underprivileged students',
             'category': csr_cats[2] if csr_cats.count() > 2 else None, 'department': departments[0],
             'organizer': dept_heads[0] if dept_heads else None,
             'start_date': today - timedelta(days=60), 'end_date': today + timedelta(days=30),
             'location': 'City High School', 'max_participants': 20, 'status': 'active'},
            {'title': 'Blood Donation Camp', 'description': 'Annual blood donation drive',
             'category': csr_cats[3] if csr_cats.count() > 3 else None, 'department': departments[3],
             'organizer': dept_heads[3] if len(dept_heads) > 3 else None,
             'start_date': today - timedelta(days=14), 'end_date': today - timedelta(days=14),
             'location': 'Company Auditorium', 'max_participants': 100, 'status': 'completed'},
            {'title': 'Tree Plantation Drive', 'description': 'Plant 500 trees in the industrial zone',
             'category': csr_cats[0] if csr_cats.count() > 0 else None, 'department': departments[2],
             'organizer': dept_heads[2] if len(dept_heads) > 2 else None,
             'start_date': today + timedelta(days=15), 'location': 'Industrial Zone Park',
             'max_participants': 50, 'status': 'active'},
            {'title': 'Digital Literacy Workshop', 'description': 'Teaching basic computer skills to seniors',
             'category': csr_cats[2] if csr_cats.count() > 2 else None, 'department': departments[1],
             'organizer': dept_heads[1] if len(dept_heads) > 1 else None,
             'start_date': today - timedelta(days=7), 'end_date': today - timedelta(days=7),
             'location': 'Community Center', 'max_participants': 25, 'status': 'completed'},
        ]

        activities = []
        for ad in activities_data:
            act = CSRActivity.objects.create(**ad)
            activities.append(act)

        # Add participations
        for i, emp in enumerate(employees[:8]):
            act = activities[i % len(activities)]
            status = 'approved' if act.status == 'completed' else 'pending'
            EmployeeParticipation.objects.create(
                activity=act, employee=emp, status=status,
                hours_contributed=Decimal(str(random.uniform(2, 8))) if status == 'approved' else 0,
                proof_description='Participated and contributed to the event' if status == 'approved' else '',
            )

        # Ensure at least one pending approval
        if employees:
            EmployeeParticipation.objects.create(
                activity=activities[1], employee=employees[-1], status='pending',
                proof_description='Awaiting review of participation proof',
            )

        self.stdout.write(f'  Created {len(activities)} CSR activities with participations')

    # ------------------------------------------------------------------
    # POLICIES & ACKNOWLEDGEMENTS
    # ------------------------------------------------------------------
    def _seed_policies_and_acknowledgements(self, users, admin):
        today = date.today()
        policies_data = [
            {'title': 'Environmental Impact Assessment Policy', 'category': 'environmental',
             'priority': 'mandatory', 'status': 'active',
             'description': 'All projects must undergo environmental impact assessment before approval.',
             'effective_date': today - timedelta(days=90)},
            {'title': 'Anti-Bribery and Corruption Policy', 'category': 'governance',
             'priority': 'mandatory', 'status': 'active',
             'description': 'Zero tolerance policy for bribery and corrupt practices.',
             'effective_date': today - timedelta(days=180)},
            {'title': 'Workplace Diversity & Inclusion Charter', 'category': 'social',
             'priority': 'mandatory', 'status': 'active',
             'description': 'Commitment to fostering a diverse and inclusive workplace.',
             'effective_date': today - timedelta(days=60)},
            {'title': 'Green Procurement Guidelines', 'category': 'environmental',
             'priority': 'recommended', 'status': 'active',
             'description': 'Prefer suppliers with verified sustainability certifications.',
             'effective_date': today - timedelta(days=30)},
        ]

        employees = list(User.objects.filter(role='employee'))
        for pd in policies_data:
            policy = ESGPolicy.objects.create(**pd, created_by=admin)

            # Create acknowledgement records for all employees
            for emp in employees:
                # Random acknowledgement (some done, some pending)
                acknowledged = random.random() > 0.35  # ~65% acknowledged
                PolicyAcknowledgement.objects.create(
                    policy=policy, employee=emp,
                    acknowledged=acknowledged,
                    acknowledged_at=timezone.now() - timedelta(days=random.randint(1, 30)) if acknowledged else None,
                )

        self.stdout.write(f'  Created {len(policies_data)} policies with acknowledgement spread')

    # ------------------------------------------------------------------
    # AUDITS & COMPLIANCE ISSUES (with deliberate overdue issue)
    # ------------------------------------------------------------------
    def _seed_audits_and_compliance(self, departments, dept_heads):
        today = date.today()

        audits_data = [
            {'title': 'Q2 2026 Internal Environmental Audit', 'audit_type': 'internal',
             'department': departments[0], 'auditor': 'Green Compliance Ltd.',
             'status': 'completed', 'scheduled_date': today - timedelta(days=45),
             'completed_date': today - timedelta(days=40),
             'findings': 'Energy consumption above target. Recommend LED retrofit in Building C.',
             'score': Decimal('72.5')},
            {'title': 'Annual Governance Review 2026', 'audit_type': 'external',
             'department': departments[1], 'auditor': 'Deloitte ESG Advisory',
             'status': 'completed', 'scheduled_date': today - timedelta(days=60),
             'completed_date': today - timedelta(days=55),
             'findings': 'Strong policy framework. Minor gaps in supplier screening process.',
             'score': Decimal('85.0')},
            {'title': 'Operations Safety & Compliance Check', 'audit_type': 'internal',
             'department': departments[2], 'auditor': 'Internal Audit Team',
             'status': 'in_progress', 'scheduled_date': today - timedelta(days=5),
             'findings': 'Preliminary: waste handling procedures need update.'},
        ]

        for ad in audits_data:
            audit = Audit.objects.create(**ad)

            # Add compliance issues
            if audit.title.startswith('Q2'):
                ComplianceIssue.objects.create(
                    title='Excessive energy consumption in Building C',
                    description='Monthly electricity usage 23% above 2025 baseline target.',
                    audit=audit, department=departments[0], severity='high',
                    status='in_progress', assigned_to=dept_heads[0] if dept_heads else None,
                    due_date=today + timedelta(days=30),
                )
                # DELIBERATELY OVERDUE ISSUE
                ComplianceIssue.objects.create(
                    title='Missing emissions report for Q1 manufacturing',
                    description='Q1 manufacturing emissions data was not submitted by the deadline.',
                    audit=audit, department=departments[0], severity='critical',
                    status='open', assigned_to=dept_heads[0] if dept_heads else None,
                    due_date=today - timedelta(days=15),  # 15 days overdue!
                    is_overdue=True,  # Flag it directly
                )
            elif audit.title.startswith('Annual'):
                ComplianceIssue.objects.create(
                    title='Supplier ESG screening gaps',
                    description='12 suppliers lack verified sustainability certifications.',
                    audit=audit, department=departments[1], severity='medium',
                    status='open', assigned_to=dept_heads[1] if len(dept_heads) > 1 else None,
                    due_date=today + timedelta(days=45),
                )
            elif audit.title.startswith('Operations'):
                ComplianceIssue.objects.create(
                    title='Outdated waste handling SOP',
                    description='Current waste segregation procedures date from 2022.',
                    audit=audit, department=departments[2], severity='medium',
                    status='open', assigned_to=dept_heads[2] if len(dept_heads) > 2 else None,
                    due_date=today + timedelta(days=20),
                )

        self.stdout.write(f'  Created {len(audits_data)} audits with compliance issues (1 overdue)')

    # ------------------------------------------------------------------
    # CHALLENGES (full lifecycle spread)
    # ------------------------------------------------------------------
    def _seed_challenges(self, departments, categories, employees, admin):
        today = date.today()
        challenge_cats = Category.objects.filter(type='challenge')

        challenges_data = [
            {'title': 'Zero Waste Week Challenge', 'status': 'completed',
             'description': 'Minimize office waste for one full week.', 'xp_reward': 200,
             'start_date': today - timedelta(days=30), 'end_date': today - timedelta(days=23),
             'target_value': 100, 'target_unit': '%'},
            {'title': 'Bike to Work Month', 'status': 'active',
             'description': 'Commute by bicycle for at least 15 days this month.', 'xp_reward': 300,
             'start_date': today - timedelta(days=10), 'end_date': today + timedelta(days=20),
             'target_value': 15, 'target_unit': 'days'},
            {'title': 'Energy Reduction Sprint', 'status': 'active',
             'description': 'Reduce your team energy consumption by 10%.', 'xp_reward': 250,
             'start_date': today - timedelta(days=5), 'end_date': today + timedelta(days=25),
             'target_value': 10, 'target_unit': '%'},
            {'title': 'Green Innovation Hackathon', 'status': 'draft',
             'description': 'Design a sustainability solution for the workplace.', 'xp_reward': 500,
             'start_date': today + timedelta(days=30), 'end_date': today + timedelta(days=32),
             'target_value': 1, 'target_unit': 'submission'},
            {'title': 'Water Conservation Challenge', 'status': 'under_review',
             'description': 'Track and reduce daily water usage.', 'xp_reward': 150,
             'start_date': today - timedelta(days=21), 'end_date': today - timedelta(days=7),
             'target_value': 20, 'target_unit': 'litres saved'},
            {'title': 'Paperless Office Sprint', 'status': 'completed',
             'description': 'Go fully digital for two weeks.', 'xp_reward': 180,
             'start_date': today - timedelta(days=60), 'end_date': today - timedelta(days=46),
             'target_value': 14, 'target_unit': 'days'},
        ]

        for i, cd in enumerate(challenges_data):
            cat = challenge_cats[i % challenge_cats.count()] if challenge_cats.exists() else None
            dept = departments[i % len(departments)]
            challenge = Challenge.objects.create(
                **cd, category=cat, department=dept, created_by=admin,
            )

            # Add participations for active/completed/under_review challenges
            if cd['status'] in ('active', 'completed', 'under_review'):
                for j, emp in enumerate(employees[:5]):
                    progress = Decimal(str(round(random.uniform(
                        float(cd['target_value']) * 0.3,
                        float(cd['target_value']) * 1.1
                    ), 1)))
                    if cd['status'] == 'completed':
                        progress = cd['target_value']
                    cp_status = 'completed' if cd['status'] == 'completed' else 'active'
                    ChallengeParticipation.objects.create(
                        challenge=challenge, employee=emp,
                        progress=min(progress, cd['target_value']),
                        status=cp_status,
                    )

        self.stdout.write(f'  Created {len(challenges_data)} challenges (Draft/Active/Under Review/Completed)')

    # ------------------------------------------------------------------
    # BADGES & XP
    # ------------------------------------------------------------------
    def _seed_badges_and_xp(self, employees):
        badges_data = [
            {'title': 'Eco Warrior', 'description': 'Earn 500 XP for sustainability efforts',
             'icon': 'award', 'color': '#10b981',
             'unlock_rule': {'type': 'xp_threshold', 'value': 500}},
            {'title': 'Challenge Champion', 'description': 'Complete 3 sustainability challenges',
             'icon': 'trophy', 'color': '#f59e0b',
             'unlock_rule': {'type': 'challenges_completed', 'value': 3}},
            {'title': 'Community Hero', 'description': 'Participate in 2 CSR activities',
             'icon': 'heart', 'color': '#ec4899',
             'unlock_rule': {'type': 'csr_participations', 'value': 2}},
            {'title': 'Green Starter', 'description': 'Earn your first 100 XP',
             'icon': 'leaf', 'color': '#22c55e',
             'unlock_rule': {'type': 'xp_threshold', 'value': 100}},
            {'title': 'Sustainability Leader', 'description': 'Accumulate 1000 XP',
             'icon': 'star', 'color': '#8b5cf6',
             'unlock_rule': {'type': 'xp_threshold', 'value': 1000}},
        ]

        badges = []
        for bd in badges_data:
            badge = Badge.objects.create(**bd)
            badges.append(badge)

        # Give XP to employees and award badges
        xp_values = [750, 520, 340, 180, 1050, 90, 420, 60, 600, 150, 280, 45]
        for i, emp in enumerate(employees):
            xp_val = xp_values[i] if i < len(xp_values) else random.randint(50, 300)
            EmployeeXP.objects.create(
                employee=emp, total_xp=xp_val,
                level=(xp_val // 500) + 1,
            )

        # Pre-award badges to specific employees
        if len(employees) >= 2:
            EmployeeBadge.objects.create(employee=employees[0], badge=badges[0])  # Eco Warrior
            EmployeeBadge.objects.create(employee=employees[0], badge=badges[3])  # Green Starter
            EmployeeBadge.objects.create(employee=employees[4], badge=badges[4])  # Sustainability Leader
            EmployeeBadge.objects.create(employee=employees[4], badge=badges[0])  # Eco Warrior
            EmployeeBadge.objects.create(employee=employees[1], badge=badges[3])  # Green Starter

        self.stdout.write(f'  Created {len(badges)} badges, awarded to top employees, XP assigned to all')

    # ------------------------------------------------------------------
    # REWARDS & REDEMPTIONS
    # ------------------------------------------------------------------
    def _seed_rewards(self, employees):
        rewards_data = [
            {'title': 'Extra Day Off', 'description': 'Redeem a full day of paid leave',
             'xp_cost': 1000, 'stock': 5, 'icon': 'calendar'},
            {'title': 'Company Merch Pack', 'description': 'Sustainable branded merchandise bundle',
             'xp_cost': 300, 'stock': 20, 'icon': 'gift'},
            {'title': 'Plant a Tree Certificate', 'description': 'We plant a tree in your name',
             'xp_cost': 150, 'stock': 50, 'icon': 'tree-pine'},
            {'title': 'Premium Parking Spot', 'description': 'Reserved EV charging parking for a month',
             'xp_cost': 500, 'stock': 2, 'icon': 'car'},  # Low stock!
            {'title': 'Lunch with CEO', 'description': 'Exclusive sustainability lunch with leadership',
             'xp_cost': 800, 'stock': 3, 'icon': 'utensils'},  # Low stock!
        ]

        rewards = []
        for rd in rewards_data:
            reward = Reward.objects.create(**rd)
            rewards.append(reward)

        # Simulate a couple redemptions
        if len(employees) >= 2 and rewards:
            RewardRedemption.objects.create(
                employee=employees[0], reward=rewards[2], xp_spent=rewards[2].xp_cost,
            )
            RewardRedemption.objects.create(
                employee=employees[4], reward=rewards[1], xp_spent=rewards[1].xp_cost,
            )

        self.stdout.write(f'  Created {len(rewards)} rewards (2 low-stock), 2 redemptions')

    # ------------------------------------------------------------------
    # DEPARTMENT SCORES (snapshot-based)
    # ------------------------------------------------------------------
    def _seed_department_scores(self, departments):
        today = date.today()
        period = today.replace(day=1)  # First of current month

        for dept in departments:
            # Calculate based on actual data where possible
            txn_count = CarbonTransaction.objects.filter(department=dept).count()
            goal_count = EnvironmentalGoal.objects.filter(department=dept).count()
            csr_count = CSRActivity.objects.filter(department=dept).count()
            issue_count = ComplianceIssue.objects.filter(department=dept, status='open').count()
            audit_score = Audit.objects.filter(department=dept, score__isnull=False).first()

            # Environmental: based on transaction activity and goals
            env_score = Decimal(str(min(90, 50 + txn_count * 2 + goal_count * 10)))
            # Social: based on CSR activity
            soc_score = Decimal(str(min(95, 55 + csr_count * 12)))
            # Governance: based on audit scores and open issues
            gov_base = float(audit_score.score) if audit_score else 65
            gov_score = Decimal(str(min(100, max(40, gov_base - issue_count * 8))))
            # Total weighted
            total = (env_score * Decimal('0.4') + soc_score * Decimal('0.3') + gov_score * Decimal('0.3'))

            DepartmentScore.objects.create(
                department=dept, period=period,
                environmental_score=env_score,
                social_score=soc_score,
                governance_score=gov_score,
                total_score=total.quantize(Decimal('0.01')),
            )

        self.stdout.write(f'  Created department score snapshots for {len(departments)} departments')

    # ------------------------------------------------------------------
    # NOTIFICATIONS
    # ------------------------------------------------------------------
    def _seed_notifications(self, users):
        notif_templates = [
            {'notification_type': 'badge', 'title': 'Badge Unlocked: Eco Warrior',
             'message': 'Congratulations! You earned the Eco Warrior badge for reaching 500 XP.',
             'link': '/rewards'},
            {'notification_type': 'compliance', 'title': 'Overdue Compliance Issue',
             'message': 'A critical compliance issue requires your immediate attention.',
             'link': '/compliance'},
            {'notification_type': 'challenge', 'title': 'New Challenge Available',
             'message': 'Bike to Work Month challenge is now active. Join and earn 300 XP!',
             'link': '/challenges'},
            {'notification_type': 'info', 'title': 'Policy Update',
             'message': 'The Environmental Impact Assessment Policy has been updated. Please review.',
             'link': '/policies'},
            {'notification_type': 'success', 'title': 'CSR Participation Approved',
             'message': 'Your participation in the River Cleanup Drive has been approved.',
             'link': '/csr-activities'},
            {'notification_type': 'warning', 'title': 'Policy Acknowledgement Pending',
             'message': 'You have 2 mandatory policies awaiting your acknowledgement.',
             'link': '/policies'},
            {'notification_type': 'reward', 'title': 'New Reward Available',
             'message': 'Check out the new "Lunch with CEO" reward in the catalog.',
             'link': '/rewards'},
        ]

        count = 0
        for user in users:
            # Give each user 3-5 notifications (mix of read/unread)
            sample = random.sample(notif_templates, min(random.randint(3, 5), len(notif_templates)))
            for i, nt in enumerate(sample):
                Notification.objects.create(
                    recipient=user,
                    is_read=i > 1,  # First 2 unread, rest read
                    **nt,
                )
                count += 1

        self.stdout.write(f'  Created {count} notifications across {len(users)} users')
