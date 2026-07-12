from rest_framework import serializers
from .models import (
    Challenge, ChallengeParticipation, Badge, EmployeeBadge,
    EmployeeXP, Reward, RewardRedemption, DepartmentScore,
)


class ChallengeSerializer(serializers.ModelSerializer):
    participant_count = serializers.ReadOnlyField()
    department_name = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()

    class Meta:
        model = Challenge
        fields = '__all__'

    def get_department_name(self, obj):
        return obj.department.name if obj.department else 'Organization-wide'

    def get_category_name(self, obj):
        return obj.category.name if obj.category else ''


class ChallengeParticipationSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    challenge_title = serializers.SerializerMethodField()
    progress_pct = serializers.ReadOnlyField()

    class Meta:
        model = ChallengeParticipation
        fields = '__all__'

    def get_employee_name(self, obj):
        return obj.employee.get_full_name() or obj.employee.username

    def get_challenge_title(self, obj):
        return obj.challenge.title


class BadgeSerializer(serializers.ModelSerializer):
    award_count = serializers.SerializerMethodField()

    class Meta:
        model = Badge
        fields = '__all__'

    def get_award_count(self, obj):
        return obj.awards.count()


class EmployeeBadgeSerializer(serializers.ModelSerializer):
    badge_title = serializers.SerializerMethodField()
    badge_icon = serializers.SerializerMethodField()
    badge_color = serializers.SerializerMethodField()

    class Meta:
        model = EmployeeBadge
        fields = '__all__'

    def get_badge_title(self, obj):
        return obj.badge.title

    def get_badge_icon(self, obj):
        return obj.badge.icon

    def get_badge_color(self, obj):
        return obj.badge.color


class EmployeeXPSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    department_name = serializers.SerializerMethodField()
    badge_count = serializers.SerializerMethodField()
    challenges_completed = serializers.SerializerMethodField()

    class Meta:
        model = EmployeeXP
        fields = '__all__'

    def get_employee_name(self, obj):
        return obj.employee.get_full_name() or obj.employee.username

    def get_department_name(self, obj):
        return obj.employee.department.name if obj.employee.department else ''

    def get_badge_count(self, obj):
        return obj.employee.badges.count()

    def get_challenges_completed(self, obj):
        return obj.employee.challenge_participations.filter(status='completed').count()


class RewardSerializer(serializers.ModelSerializer):
    redemption_count = serializers.SerializerMethodField()

    class Meta:
        model = Reward
        fields = '__all__'

    def get_redemption_count(self, obj):
        return obj.redemptions.count()


class RewardRedemptionSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    reward_title = serializers.SerializerMethodField()

    class Meta:
        model = RewardRedemption
        fields = '__all__'

    def get_employee_name(self, obj):
        return obj.employee.get_full_name() or obj.employee.username

    def get_reward_title(self, obj):
        return obj.reward.title


class DepartmentScoreSerializer(serializers.ModelSerializer):
    department_name = serializers.SerializerMethodField()

    class Meta:
        model = DepartmentScore
        fields = '__all__'

    def get_department_name(self, obj):
        return obj.department.name
