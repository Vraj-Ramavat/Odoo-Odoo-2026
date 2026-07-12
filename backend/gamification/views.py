from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction

from .models import (
    Challenge, ChallengeParticipation, Badge, EmployeeBadge,
    EmployeeXP, Reward, RewardRedemption, DepartmentScore,
)
from .serializers import (
    ChallengeSerializer, ChallengeParticipationSerializer,
    BadgeSerializer, EmployeeBadgeSerializer, EmployeeXPSerializer,
    RewardSerializer, RewardRedemptionSerializer, DepartmentScoreSerializer,
)
from notifications.models import Notification


# Valid state transitions for challenge lifecycle
VALID_TRANSITIONS = {
    'draft': ['active', 'archived'],
    'active': ['under_review', 'archived'],
    'under_review': ['completed', 'active', 'archived'],
    'completed': ['archived'],
    'archived': [],
}


class ChallengeViewSet(viewsets.ModelViewSet):
    queryset = Challenge.objects.all()
    serializer_class = ChallengeSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        st = self.request.query_params.get('status')
        dept = self.request.query_params.get('department')
        if st:
            qs = qs.filter(status=st)
        if dept:
            qs = qs.filter(department_id=dept)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['patch'])
    def transition(self, request, pk=None):
        challenge = self.get_object()
        new_status = request.data.get('status')
        allowed = VALID_TRANSITIONS.get(challenge.status, [])
        if new_status not in allowed:
            return Response(
                {'error': f'Cannot transition from {challenge.status} to {new_status}. Allowed: {allowed}'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        challenge.status = new_status
        challenge.save()
        return Response(ChallengeSerializer(challenge).data)

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        challenge = self.get_object()
        if challenge.status != 'active':
            return Response({'error': 'Can only join active challenges'}, status=status.HTTP_400_BAD_REQUEST)
        if challenge.participations.filter(employee=request.user).exists():
            return Response({'error': 'Already joined'}, status=status.HTTP_400_BAD_REQUEST)
        cp = ChallengeParticipation.objects.create(
            challenge=challenge, employee=request.user,
        )
        return Response(ChallengeParticipationSerializer(cp).data, status=status.HTTP_201_CREATED)


class ChallengeParticipationViewSet(viewsets.ModelViewSet):
    queryset = ChallengeParticipation.objects.all()
    serializer_class = ChallengeParticipationSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        challenge = self.request.query_params.get('challenge')
        if challenge:
            qs = qs.filter(challenge_id=challenge)
        return qs

    @action(detail=True, methods=['patch'])
    def update_progress(self, request, pk=None):
        cp = self.get_object()
        progress = request.data.get('progress')
        if progress is not None:
            from decimal import Decimal
            cp.progress = Decimal(str(progress))
            # Auto-complete if target reached
            if cp.progress >= cp.challenge.target_value:
                cp.progress = cp.challenge.target_value
                cp.status = 'completed'
                cp.completed_at = timezone.now()
                # Award XP
                xp_record, _ = EmployeeXP.objects.get_or_create(employee=cp.employee)
                xp_record.add_xp(cp.challenge.xp_reward)
                # Check badge eligibility
                _check_and_award_badges(cp.employee)
            cp.save()
        return Response(ChallengeParticipationSerializer(cp).data)


from core.models import ESGConfiguration

def _check_and_award_badges(user):
    """Auto-award any badges the user is now eligible for."""
    config = ESGConfiguration.get_config(company=user.company)
    if not config.badge_auto_award:
        return

    for badge in Badge.objects.filter(is_active=True, company=user.company):
        if not EmployeeBadge.objects.filter(employee=user, badge=badge).exists():
            if badge.check_eligibility(user):
                EmployeeBadge.objects.create(employee=user, badge=badge, company=user.company)
                Notification.objects.create(
                    company=user.company,
                    recipient=user,
                    notification_type='badge',
                    title=f'Badge Unlocked: {badge.title}',
                    message=f'Congratulations! You earned the "{badge.title}" badge.',
                    link='/rewards',
                )


class BadgeViewSet(viewsets.ModelViewSet):
    queryset = Badge.objects.all()
    serializer_class = BadgeSerializer


class RewardViewSet(viewsets.ModelViewSet):
    queryset = Reward.objects.filter(is_active=True)
    serializer_class = RewardSerializer

    @action(detail=True, methods=['post'])
    def redeem(self, request, pk=None):
        with transaction.atomic():
            reward = Reward.objects.select_for_update().get(pk=pk)
            if reward.stock <= 0:
                return Response({'error': 'Out of stock'}, status=status.HTTP_400_BAD_REQUEST)
            xp_record = EmployeeXP.objects.filter(employee=request.user).first()
            if not xp_record or xp_record.total_xp < reward.xp_cost:
                return Response({'error': 'Insufficient XP'}, status=status.HTTP_400_BAD_REQUEST)
            # Deduct and redeem
            xp_record.total_xp -= reward.xp_cost
            xp_record.save()
            reward.stock -= 1
            reward.save()
            redemption = RewardRedemption.objects.create(
                company=request.user.company,
                employee=request.user, reward=reward, xp_spent=reward.xp_cost,
            )
            Notification.objects.create(
                company=request.user.company,
                recipient=request.user,
                notification_type='reward',
                title=f'Reward Redeemed: {reward.title}',
                message=f'You redeemed "{reward.title}" for {reward.xp_cost} XP.',
                link='/rewards',
            )
            return Response({
                'status': 'success',
                'redemption_id': redemption.id,
                'remaining_xp': xp_record.total_xp,
                'remaining_stock': reward.stock,
            })


class DepartmentScoreViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DepartmentScore.objects.all()
    serializer_class = DepartmentScoreSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        period = self.request.query_params.get('period')
        if period:
            qs = qs.filter(period=period)
        return qs


@api_view(['GET'])
def leaderboard(request):
    """Ranked employee leaderboard by XP."""
    from core.tenancy import tenant_filter
    dept = request.query_params.get('department')
    qs = EmployeeXP.objects.select_related('employee', 'employee__department').order_by('-total_xp')
    qs = tenant_filter(request, qs)
    if dept:
        qs = qs.filter(employee__department_id=dept)
    data = EmployeeXPSerializer(qs[:50], many=True).data
    # Add rank
    for i, entry in enumerate(data):
        entry['rank'] = i + 1
    return Response(data)
