from rest_framework import serializers
from .models import Department, Category, ESGConfiguration, Product


class DepartmentSerializer(serializers.ModelSerializer):
    head_name = serializers.CharField(source='head.get_full_name', read_only=True, default=None)
    parent_name = serializers.CharField(source='parent_department.name', read_only=True, default=None)
    sub_department_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ['id', 'name', 'code', 'head', 'head_name',
                  'parent_department', 'parent_name', 'employee_count',
                  'status', 'sub_department_count', 'created_at', 'updated_at']

    def get_sub_department_count(self, obj):
        return obj.sub_departments.count()


class CategorySerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'type', 'type_display', 'status', 'created_at']


class ESGConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ESGConfiguration
        fields = [
            'environmental_weight', 'social_weight', 'governance_weight',
            'auto_emission_calculation', 'evidence_required_for_csr',
            'badge_auto_award',
            'notify_compliance_issue', 'notify_approval_decisions',
            'notify_policy_reminders', 'notify_badge_unlocks',
            'updated_at',
        ]
        read_only_fields = ['updated_at']

    def validate(self, attrs):
        # Validate weights sum to 100 if any weight is being updated
        env = attrs.get('environmental_weight', self.instance.environmental_weight if self.instance else 40)
        soc = attrs.get('social_weight', self.instance.social_weight if self.instance else 30)
        gov = attrs.get('governance_weight', self.instance.governance_weight if self.instance else 30)
        if env + soc + gov != 100:
            raise serializers.ValidationError(
                'Environmental + Social + Governance weights must sum to 100.'
            )
        return attrs


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'code', 'carbon_footprint_kg', 'recyclability_pct', 'sustainable_sourced', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
