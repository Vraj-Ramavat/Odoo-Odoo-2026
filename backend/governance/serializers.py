from rest_framework import serializers
from .models import ESGPolicy, PolicyAcknowledgement, Audit, ComplianceIssue


class ESGPolicySerializer(serializers.ModelSerializer):
    acknowledgement_rate = serializers.ReadOnlyField()
    acknowledged_count = serializers.SerializerMethodField()
    total_employees = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ESGPolicy
        fields = '__all__'

    def get_acknowledged_count(self, obj):
        return obj.acknowledgements.filter(acknowledged=True).count()

    def get_total_employees(self, obj):
        return obj.acknowledgements.count()

    def get_created_by_name(self, obj):
        return str(obj.created_by) if obj.created_by else ''


class PolicyAcknowledgementSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    policy_title = serializers.SerializerMethodField()

    class Meta:
        model = PolicyAcknowledgement
        fields = '__all__'
        read_only_fields = ['acknowledged_at']

    def get_employee_name(self, obj):
        return obj.employee.get_full_name() or obj.employee.username

    def get_policy_title(self, obj):
        return obj.policy.title


class AuditSerializer(serializers.ModelSerializer):
    department_name = serializers.SerializerMethodField()
    issue_count = serializers.SerializerMethodField()

    class Meta:
        model = Audit
        fields = '__all__'

    def get_department_name(self, obj):
        return obj.department.name if obj.department else 'Organization-wide'

    def get_issue_count(self, obj):
        return obj.issues.count()


class ComplianceIssueSerializer(serializers.ModelSerializer):
    department_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    audit_title = serializers.SerializerMethodField()

    class Meta:
        model = ComplianceIssue
        fields = '__all__'

    def get_department_name(self, obj):
        return obj.department.name if obj.department else ''

    def get_assigned_to_name(self, obj):
        return (obj.assigned_to.get_full_name() or obj.assigned_to.username) if obj.assigned_to else 'Unassigned'

    def get_audit_title(self, obj):
        return obj.audit.title if obj.audit else ''
