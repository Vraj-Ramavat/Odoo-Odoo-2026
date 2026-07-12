from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import date

from .models import ESGPolicy, PolicyAcknowledgement, Audit, ComplianceIssue
from .serializers import (
    ESGPolicySerializer, PolicyAcknowledgementSerializer,
    AuditSerializer, ComplianceIssueSerializer,
)
from notifications.models import Notification


class ESGPolicyViewSet(viewsets.ModelViewSet):
    queryset = ESGPolicy.objects.all()
    serializer_class = ESGPolicySerializer

    def get_queryset(self):
        qs = super().get_queryset()
        cat = self.request.query_params.get('category')
        st = self.request.query_params.get('status')
        if cat:
            qs = qs.filter(category=cat)
        if st:
            qs = qs.filter(status=st)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class PolicyAcknowledgementViewSet(viewsets.ModelViewSet):
    queryset = PolicyAcknowledgement.objects.all()
    serializer_class = PolicyAcknowledgementSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        policy = self.request.query_params.get('policy')
        employee = self.request.query_params.get('employee')
        pending = self.request.query_params.get('pending')
        if policy:
            qs = qs.filter(policy_id=policy)
        if employee:
            qs = qs.filter(employee_id=employee)
        if pending == 'true':
            qs = qs.filter(acknowledged=False)
        return qs

    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        ack = self.get_object()
        if ack.employee != request.user:
            return Response({'error': 'Can only acknowledge your own policies'},
                            status=status.HTTP_403_FORBIDDEN)
        ack.acknowledged = True
        ack.acknowledged_at = timezone.now()
        ack.save()
        return Response(PolicyAcknowledgementSerializer(ack).data)


class AuditViewSet(viewsets.ModelViewSet):
    queryset = Audit.objects.all()
    serializer_class = AuditSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        dept = self.request.query_params.get('department')
        st = self.request.query_params.get('status')
        if dept:
            qs = qs.filter(department_id=dept)
        if st:
            qs = qs.filter(status=st)
        return qs


class ComplianceIssueViewSet(viewsets.ModelViewSet):
    queryset = ComplianceIssue.objects.all()
    serializer_class = ComplianceIssueSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        severity = self.request.query_params.get('severity')
        st = self.request.query_params.get('status')
        dept = self.request.query_params.get('department')
        overdue = self.request.query_params.get('overdue')
        if severity:
            qs = qs.filter(severity=severity)
        if st:
            qs = qs.filter(status=st)
        if dept:
            qs = qs.filter(department_id=dept)
        if overdue == 'true':
            qs = qs.filter(is_overdue=True)
        return qs


def flag_overdue_issues():
    """Flag open compliance issues past their due date and notify owners."""
    today = date.today()
    overdue = ComplianceIssue.objects.filter(
        status__in=['open', 'in_progress'],
        due_date__lt=today,
        is_overdue=False,
    )
    count = 0
    for issue in overdue:
        issue.is_overdue = True
        issue.save()
        if issue.assigned_to:
            Notification.objects.create(
                company=issue.company,
                recipient=issue.assigned_to,
                notification_type='compliance',
                title=f'Overdue: {issue.title}',
                message=f'Compliance issue "{issue.title}" is past its due date ({issue.due_date}).',
                link='/compliance-issues',
            )
        count += 1
    return count
