from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone

from core.models import ESGConfiguration
from .models import CSRActivity, EmployeeParticipation
from .serializers import CSRActivitySerializer, EmployeeParticipationSerializer


class CSRActivityViewSet(viewsets.ModelViewSet):
    queryset = CSRActivity.objects.all()
    serializer_class = CSRActivitySerializer

    def get_queryset(self):
        qs = super().get_queryset()
        status_filter = self.request.query_params.get('status')
        dept = self.request.query_params.get('department')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if dept:
            qs = qs.filter(department_id=dept)
        return qs

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        activity = self.get_object()
        if activity.participations.filter(employee=request.user).exists():
            return Response({'error': 'Already joined'}, status=status.HTTP_400_BAD_REQUEST)
        if activity.participant_count >= activity.max_participants:
            return Response({'error': 'Activity is full'}, status=status.HTTP_400_BAD_REQUEST)
        p = EmployeeParticipation.objects.create(
            activity=activity, employee=request.user, status='pending',
        )
        return Response(EmployeeParticipationSerializer(p).data, status=status.HTTP_201_CREATED)


class EmployeeParticipationViewSet(viewsets.ModelViewSet):
    queryset = EmployeeParticipation.objects.all()
    serializer_class = EmployeeParticipationSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        activity = self.request.query_params.get('activity')
        status_filter = self.request.query_params.get('status')
        if activity:
            qs = qs.filter(activity_id=activity)
        if status_filter:
            qs = qs.filter(status=status_filter)
        # Non-admin users only see their own
        if not self.request.user.is_admin_user and not self.request.user.is_dept_head:
            qs = qs.filter(employee=self.request.user)
        return qs

    @action(detail=True, methods=['patch'])
    def review(self, request, pk=None):
        participation = self.get_object()
        decision = request.data.get('status')  # 'approved' or 'rejected'
        if decision not in ('approved', 'rejected'):
            return Response({'error': 'Status must be approved or rejected'}, status=status.HTTP_400_BAD_REQUEST)

        # Evidence gate
        config = ESGConfiguration.get_config(company=participation.company)
        if decision == 'approved' and config and getattr(config, 'evidence_required_for_csr', False):
            if not participation.proof_file and not participation.proof_description:
                return Response(
                    {'error': 'Cannot approve: evidence is required but no proof attached'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        participation.status = decision
        participation.reviewed_by = request.user
        participation.reviewed_at = timezone.now()
        participation.save()
        return Response(EmployeeParticipationSerializer(participation).data)
