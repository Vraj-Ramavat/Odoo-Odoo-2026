"""
Seed script for EcoSphere Phase 1.
Run with: python manage.py shell < seed_data.py
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecosphere.settings')
django.setup()

from django.contrib.auth import get_user_model
from core.models import Department, Category, ESGConfiguration

User = get_user_model()

# Create superuser / admin
if not User.objects.filter(username='admin').exists():
    admin_user = User.objects.create_superuser(
        username='admin',
        email='admin@ecosphere.io',
        password='admin123',
        first_name='System',
        last_name='Admin',
        role='admin',
    )
    print(f"Created admin user: {admin_user}")

# Create departments
departments_data = [
    {'name': 'Engineering', 'code': 'ENG', 'employee_count': 45},
    {'name': 'Operations', 'code': 'OPS', 'employee_count': 30},
    {'name': 'Human Resources', 'code': 'HR', 'employee_count': 12},
    {'name': 'Finance', 'code': 'FIN', 'employee_count': 15},
    {'name': 'Marketing', 'code': 'MKT', 'employee_count': 20},
    {'name': 'Supply Chain', 'code': 'SCM', 'employee_count': 25},
    {'name': 'Research & Development', 'code': 'R&D', 'employee_count': 18},
]
for dept_data in departments_data:
    dept, created = Department.objects.get_or_create(
        code=dept_data['code'],
        defaults=dept_data,
    )
    if created:
        print(f"Created department: {dept}")

# Create categories
categories_data = [
    {'name': 'Tree Plantation', 'type': 'csr'},
    {'name': 'Beach Cleanup', 'type': 'csr'},
    {'name': 'Blood Donation', 'type': 'csr'},
    {'name': 'Education Workshop', 'type': 'csr'},
    {'name': 'Community Service', 'type': 'csr'},
    {'name': 'Energy Saving', 'type': 'challenge'},
    {'name': 'Waste Reduction', 'type': 'challenge'},
    {'name': 'Green Commute', 'type': 'challenge'},
    {'name': 'Water Conservation', 'type': 'challenge'},
    {'name': 'Recycling', 'type': 'challenge'},
]
for cat_data in categories_data:
    cat, created = Category.objects.get_or_create(
        name=cat_data['name'],
        type=cat_data['type'],
        defaults=cat_data,
    )
    if created:
        print(f"Created category: {cat}")

# Create ESG Configuration singleton
config = ESGConfiguration.get_config()
print(f"ESG Config initialized: E={config.environmental_weight}%, S={config.social_weight}%, G={config.governance_weight}%")

# Create sample dept head and employee users
eng_dept = Department.objects.get(code='ENG')
ops_dept = Department.objects.get(code='OPS')

if not User.objects.filter(username='dept_head').exists():
    dh = User.objects.create_user(
        username='dept_head',
        email='depthead@ecosphere.io',
        password='dept123',
        first_name='Sarah',
        last_name='Chen',
        role='dept_head',
        department=eng_dept,
    )
    print(f"Created dept head: {dh}")

if not User.objects.filter(username='employee1').exists():
    emp = User.objects.create_user(
        username='employee1',
        email='employee1@ecosphere.io',
        password='emp123',
        first_name='Alex',
        last_name='Rivera',
        role='employee',
        department=eng_dept,
    )
    print(f"Created employee: {emp}")

if not User.objects.filter(username='employee2').exists():
    emp2 = User.objects.create_user(
        username='employee2',
        email='employee2@ecosphere.io',
        password='emp123',
        first_name='Maya',
        last_name='Patel',
        role='employee',
        department=ops_dept,
    )
    print(f"Created employee: {emp2}")

print("\n✅ Seed data complete!")
