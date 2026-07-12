"""
Phase 2 seed: Emission Factors, ERP Records (triggers auto-calc), and Environmental Goals.
Run with: python seed_phase2.py
"""
import os, django, random
from datetime import date, timedelta
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecosphere.settings')
django.setup()

from carbon.models import (
    EmissionFactor, CarbonTransaction, EnvironmentalGoal,
    PurchaseRecord, ManufacturingRecord, ExpenseRecord, FleetRecord,
)
from core.models import Department

departments = list(Department.objects.all())

# ============ Emission Factors ============
factors_data = [
    {'activity_type': 'Electricity - Grid', 'scope': '2', 'unit': 'kWh', 'factor_value': 0.417, 'source': 'DEFRA 2025'},
    {'activity_type': 'Natural Gas', 'scope': '1', 'unit': 'm3', 'factor_value': 2.020, 'source': 'DEFRA 2025'},
    {'activity_type': 'Diesel - Fleet', 'scope': '1', 'unit': 'litre', 'factor_value': 2.689, 'source': 'DEFRA 2025'},
    {'activity_type': 'Petrol - Fleet', 'scope': '1', 'unit': 'litre', 'factor_value': 2.315, 'source': 'DEFRA 2025'},
    {'activity_type': 'Water Supply', 'scope': '3', 'unit': 'm3', 'factor_value': 0.344, 'source': 'DEFRA 2025'},
    {'activity_type': 'Paper - Recycled', 'scope': '3', 'unit': 'kg', 'factor_value': 0.612, 'source': 'EPA 2025'},
    {'activity_type': 'Waste - Landfill', 'scope': '3', 'unit': 'kg', 'factor_value': 0.587, 'source': 'EPA 2025'},
    {'activity_type': 'Business Travel - Air', 'scope': '3', 'unit': 'km', 'factor_value': 0.171, 'source': 'DEFRA 2025'},
    {'activity_type': 'Employee Commute - Car', 'scope': '3', 'unit': 'km', 'factor_value': 0.168, 'source': 'DEFRA 2025'},
    {'activity_type': 'LPG', 'scope': '1', 'unit': 'litre', 'factor_value': 1.555, 'source': 'DEFRA 2025'},
]

for fd in factors_data:
    ef, created = EmissionFactor.objects.get_or_create(
        activity_type=fd['activity_type'],
        is_active=True,
        defaults={
            **fd,
            'effective_from': date(2025, 1, 1),
        }
    )
    if created:
        print(f"  Created factor: {ef}")

# ============ ERP Records (will trigger auto-calc signals) ============
today = date.today()

erp_records = [
    (PurchaseRecord, [
        {'description': 'Office electricity consumption', 'activity_type': 'Electricity - Grid', 'quantity': 12500, 'unit': 'kWh', 'vendor': 'City Power Co'},
        {'description': 'Paper supplies Q2', 'activity_type': 'Paper - Recycled', 'quantity': 450, 'unit': 'kg', 'vendor': 'EcoPaper Ltd'},
        {'description': 'Natural gas heating', 'activity_type': 'Natural Gas', 'quantity': 850, 'unit': 'm3', 'vendor': 'GasWorks'},
    ]),
    (ManufacturingRecord, [
        {'description': 'Production line electricity', 'activity_type': 'Electricity - Grid', 'quantity': 35000, 'unit': 'kWh', 'product_line': 'Main Assembly'},
        {'description': 'LPG usage in welding', 'activity_type': 'LPG', 'quantity': 200, 'unit': 'litre', 'product_line': 'Welding Bay'},
    ]),
    (ExpenseRecord, [
        {'description': 'Air travel - London conference', 'activity_type': 'Business Travel - Air', 'quantity': 2400, 'unit': 'km', 'expense_category': 'Travel'},
        {'description': 'Monthly water bill', 'activity_type': 'Water Supply', 'quantity': 1200, 'unit': 'm3', 'expense_category': 'Utilities'},
        {'description': 'Waste disposal service', 'activity_type': 'Waste - Landfill', 'quantity': 800, 'unit': 'kg', 'expense_category': 'Waste Management'},
    ]),
    (FleetRecord, [
        {'description': 'Delivery fleet diesel', 'activity_type': 'Diesel - Fleet', 'quantity': 1500, 'unit': 'litre', 'vehicle_id': 'FLEET-01'},
        {'description': 'Sales team petrol', 'activity_type': 'Petrol - Fleet', 'quantity': 600, 'unit': 'litre', 'vehicle_id': 'FLEET-02'},
    ]),
]

for Model, records in erp_records:
    for rec_data in records:
        dept = random.choice(departments)
        rec_date = today - timedelta(days=random.randint(1, 90))
        Model.objects.create(
            department=dept,
            date=rec_date,
            **rec_data,
        )
        print(f"  Created {Model.__name__}: {rec_data['description']}")

auto_count = CarbonTransaction.objects.filter(is_auto_calculated=True).count()
print(f"\n  Auto-calculated {auto_count} carbon transactions from ERP records")

# ============ Also create some historical manual transactions ============
electricity_factor = EmissionFactor.objects.get(activity_type='Electricity - Grid', is_active=True)
diesel_factor = EmissionFactor.objects.get(activity_type='Diesel - Fleet', is_active=True)

for month_offset in range(1, 7):
    d = today.replace(day=15) - timedelta(days=30 * month_offset)
    for dept in departments[:4]:
        qty_e = random.uniform(5000, 25000)
        CarbonTransaction.objects.create(
            department=dept,
            emission_factor=electricity_factor,
            source_type='manual',
            description=f'Monthly electricity - {d.strftime("%b %Y")}',
            activity_quantity=qty_e,
            calculated_emissions_kgco2e=qty_e * float(electricity_factor.factor_value),
            transaction_date=d,
            is_auto_calculated=False,
        )
        qty_d = random.uniform(100, 800)
        CarbonTransaction.objects.create(
            department=dept,
            emission_factor=diesel_factor,
            source_type='fleet',
            description=f'Fleet fuel - {d.strftime("%b %Y")}',
            activity_quantity=qty_d,
            calculated_emissions_kgco2e=qty_d * float(diesel_factor.factor_value),
            transaction_date=d,
            is_auto_calculated=False,
        )

total_txns = CarbonTransaction.objects.count()
print(f"  Total carbon transactions: {total_txns}")

# ============ Environmental Goals ============
goals_data = [
    {'title': 'Reduce Carbon Emissions by 20%', 'metric_type': 'carbon_reduction_pct', 'target_value': 20, 'current_value': 8.5, 'baseline_value': 100, 'status': 'on_track'},
    {'title': '50% Renewable Energy by 2027', 'metric_type': 'renewable_energy_pct', 'target_value': 50, 'current_value': 32, 'baseline_value': 15, 'status': 'on_track'},
    {'title': 'Zero Waste to Landfill', 'metric_type': 'waste_reduction_pct', 'target_value': 100, 'current_value': 65, 'baseline_value': 0, 'status': 'at_risk'},
    {'title': 'Water Usage Reduction 15%', 'metric_type': 'water_reduction_pct', 'target_value': 15, 'current_value': 12, 'baseline_value': 100, 'status': 'on_track'},
    {'title': 'Energy Efficiency Improvement', 'metric_type': 'energy_efficiency', 'target_value': 30, 'current_value': 30, 'baseline_value': 0, 'unit': 'kWh/unit', 'status': 'achieved'},
]

for i, gd in enumerate(goals_data):
    dept = departments[i % len(departments)] if i < 4 else None
    deadline = today + timedelta(days=random.randint(90, 365))
    EnvironmentalGoal.objects.get_or_create(
        title=gd['title'],
        defaults={
            **gd,
            'department': dept,
            'deadline': deadline,
        }
    )
    print(f"  Created goal: {gd['title']}")

print("\nPhase 2 seed complete!")
