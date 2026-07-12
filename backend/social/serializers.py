from rest_framework import serializers
from .models import CSRActivity, EmployeeParticipation


class CSRActivitySerializer(serializers.ModelSerializer):
    participant_count = serializers.ReadOnlyField()
    organizer_name = serializers.SerializerMethodField()
    department_name = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()

    class Meta:
        model = CSRActivity
        fields = '__all__'

    def get_organizer_name(self, obj):
        return str(obj.organizer) if obj.organizer else ''

    def get_department_name(self, obj):
        return obj.department.name if obj.department else 'Organization-wide'

    def get_category_name(self, obj):
        return obj.category.name if obj.category else ''


class EmployeeParticipationSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    activity_title = serializers.SerializerMethodField()

    class Meta:
        model = EmployeeParticipation
        fields = '__all__'
        read_only_fields = ['reviewed_by', 'reviewed_at']

    def get_employee_name(self, obj):
        return obj.employee.get_full_name() or obj.employee.username

    def get_activity_title(self, obj):
        return obj.activity.title
