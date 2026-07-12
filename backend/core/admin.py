from django.contrib import admin
from .models import Department, Category, ESGConfiguration


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'head', 'status', 'employee_count']
    list_filter = ['status']
    search_fields = ['name', 'code']


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'status']
    list_filter = ['type', 'status']


@admin.register(ESGConfiguration)
class ESGConfigurationAdmin(admin.ModelAdmin):
    list_display = ['environmental_weight', 'social_weight', 'governance_weight',
                    'auto_emission_calculation', 'badge_auto_award']
