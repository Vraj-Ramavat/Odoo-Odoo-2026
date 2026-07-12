import sys
from django.core.management.base import BaseCommand
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.utils import timezone
from core.models import Company, Department, Product
from carbon.models import CarbonTransaction, EmissionFactor
from governance.models import ESGPolicy

User = get_user_model()

class Command(BaseCommand):
    help = 'Verify cross-tenant data isolation and security constraints'

    def handle(self, *args, **options):
        client = APIClient()

        # Clean up any leftover test data
        self.stdout.write("Cleaning up any leftover test data...")
        from carbon.models import CarbonTransaction, EmissionFactor
        from governance.models import ESGPolicy
        CarbonTransaction.objects.filter(company__code__in=["comp-a", "comp-b"]).delete()
        EmissionFactor.objects.filter(company__code__in=["comp-a", "comp-b"]).delete()
        ESGPolicy.objects.filter(company__code__in=["comp-a", "comp-b"]).delete()
        Product.objects.filter(company__code__in=["comp-a", "comp-b"]).delete()
        User.objects.filter(username__in=["usera", "userb"]).delete()
        Company.objects.filter(code__in=["comp-a", "comp-b"]).delete()

        self.stdout.write("Spinning up test companies...")
        company_a = Company.objects.create(name="Company A", code="comp-a")
        company_b = Company.objects.create(name="Company B", code="comp-b")

        self.stdout.write("Spinning up test users...")
        user_a = User.objects.create_user(
            username="usera", email="usera@compa.com", password="password123",
            company=company_a, role=User.Role.ADMIN
        )
        user_b = User.objects.create_user(
            username="userb", email="userb@compb.com", password="password123",
            company=company_b, role=User.Role.ADMIN
        )

        dept_a = Department.objects.create(name="Dept A", code="dept-a", company=company_a)
        dept_b = Department.objects.create(name="Dept B", code="dept-b", company=company_b)

        user_a.department = dept_a
        user_a.save()
        user_b.department = dept_b
        user_b.save()

        self.stdout.write("Creating mock records for both companies...")
        factor_a = EmissionFactor.objects.create(
            activity_type="Electricity A", scope="2", unit="kWh", factor_value=0.5,
            company=company_a, effective_from=timezone.now().date()
        )
        factor_b = EmissionFactor.objects.create(
            activity_type="Electricity B", scope="2", unit="kWh", factor_value=0.8,
            company=company_b, effective_from=timezone.now().date()
        )

        tx_a = CarbonTransaction.objects.create(
            company=company_a, department=dept_a, emission_factor=factor_a,
            source_type="manual", activity_quantity=100, calculated_emissions_kgco2e=50,
            transaction_date=timezone.now().date()
        )
        tx_b = CarbonTransaction.objects.create(
            company=company_b, department=dept_b, emission_factor=factor_b,
            source_type="manual", activity_quantity=200, calculated_emissions_kgco2e=160,
            transaction_date=timezone.now().date()
        )

        policy_a = ESGPolicy.objects.create(
            company=company_a, title="Policy A", category="general",
            priority="mandatory", status="active", effective_date=timezone.now().date()
        )
        policy_b = ESGPolicy.objects.create(
            company=company_b, title="Policy B", category="general",
            priority="mandatory", status="active", effective_date=timezone.now().date()
        )

        product_a = Product.objects.create(
            company=company_a, name="Sustainable Product A", code="prod-a",
            carbon_footprint_kg=1.5, recyclability_pct=85.0
        )
        product_b = Product.objects.create(
            company=company_b, name="Sustainable Product B", code="prod-b",
            carbon_footprint_kg=3.2, recyclability_pct=40.0
        )

        self.stdout.write("Obtaining JWT and authenticating as User A (Company A)...")
        response = client.post('/api/auth/login/', {'username': 'usera', 'password': 'password123'})
        if response.status_code != 200:
            self.stdout.write(self.style.ERROR(f"Failed to log in as User A: {response.status_code}"))
            sys.exit(1)
        
        token = response.data['access']
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        # Debug profile
        me_res = client.get('/api/auth/me/')
        self.stdout.write(f"Me Response: {me_res.status_code} - {me_res.data}")

        self.stdout.write("Verifying transaction endpoint isolation...")
        res = client.get(f'/api/carbon/transactions/{tx_a.id}/')
        self.stdout.write(f"GET tx_a: {res.status_code} - {res.content if res.status_code != 200 else 'OK'}")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"

        res = client.get(f'/api/carbon/transactions/{tx_b.id}/')
        assert res.status_code == 404, f"Expected 404 (leak protection!), got {res.status_code}"

        res = client.patch(f'/api/carbon/transactions/{tx_b.id}/', {'activity_quantity': 500})
        assert res.status_code == 404, f"Expected 404 on update, got {res.status_code}"

        res = client.delete(f'/api/carbon/transactions/{tx_b.id}/')
        assert res.status_code == 404, f"Expected 404 on delete, got {res.status_code}"

        self.stdout.write("Verifying policy endpoint isolation...")
        res = client.get(f'/api/governance/policies/{policy_a.id}/')
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"

        res = client.get(f'/api/governance/policies/{policy_b.id}/')
        assert res.status_code == 404, f"Expected 404 on policy view, got {res.status_code}"

        self.stdout.write("Verifying product endpoint isolation...")
        res = client.get(f'/api/core/products/{product_a.id}/')
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"

        res = client.get(f'/api/core/products/{product_b.id}/')
        assert res.status_code == 404, f"Expected 404 on product view, got {res.status_code}"

        self.stdout.write("Verifying cross-tenant relation creation prevention...")
        res = client.post('/api/carbon/transactions/', {
            'department': dept_b.id,
            'emission_factor': factor_a.id,
            'source_type': 'manual',
            'activity_quantity': 100,
            'transaction_date': str(timezone.now().date())
        })
        assert res.status_code == 400, f"Expected 400 validation error (dept_b leak!), got {res.status_code}"

        self.stdout.write("Cleaning up test records...")
        CarbonTransaction.objects.filter(company__code__in=["comp-a", "comp-b"]).delete()
        EmissionFactor.objects.filter(company__code__in=["comp-a", "comp-b"]).delete()
        ESGPolicy.objects.filter(company__code__in=["comp-a", "comp-b"]).delete()
        Product.objects.filter(company__code__in=["comp-a", "comp-b"]).delete()
        User.objects.filter(username__in=["usera", "userb"]).delete()
        Department.objects.filter(code__in=["dept-a", "dept-b"]).delete()
        company_a.delete()
        company_b.delete()

        self.stdout.write(self.style.SUCCESS("------------------------------------"))
        self.stdout.write(self.style.SUCCESS("  ALL ISOLATION TESTS PASSED (GREEN)"))
        self.stdout.write(self.style.SUCCESS("------------------------------------"))
