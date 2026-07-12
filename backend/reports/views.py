import csv
import io
from datetime import date, timedelta
from decimal import Decimal

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import HttpResponse
from django.db.models import Sum, Count, Avg, Q

from carbon.models import CarbonTransaction, EnvironmentalGoal, EmissionFactor
from social.models import CSRActivity, EmployeeParticipation
from governance.models import ESGPolicy, PolicyAcknowledgement, Audit, ComplianceIssue
from gamification.models import (
    Challenge, ChallengeParticipation, DepartmentScore,
    EmployeeXP, Badge, EmployeeBadge, Reward, RewardRedemption,
)
from core.models import Department
from accounts.models import User
from core.tenancy import tenant_filter


@api_view(['GET'])
def environmental_report(request):
    """Environmental report data — emissions by scope, department, trend."""
    days = int(request.query_params.get('days', 365))
    dept = request.query_params.get('department')
    export = request.query_params.get('export', 'json')
    since = date.today() - timedelta(days=days)

    qs = CarbonTransaction.objects.filter(transaction_date__gte=since)
    qs = tenant_filter(request, qs)
    if dept:
        qs = qs.filter(department_id=dept)

    # Aggregations
    total = qs.aggregate(
        total_emissions=Sum('calculated_emissions_kgco2e'),
        total_transactions=Count('id'),
        auto_count=Count('id', filter=Q(is_auto_calculated=True)),
    )
    by_scope = list(qs.values('emission_factor__scope').annotate(
        emissions=Sum('calculated_emissions_kgco2e'), count=Count('id'),
    ).order_by('emission_factor__scope'))
    by_dept = list(qs.values('department__name').annotate(
        emissions=Sum('calculated_emissions_kgco2e'), count=Count('id'),
    ).order_by('-emissions'))
    goals_qs = tenant_filter(request, EnvironmentalGoal.objects.all())
    goals = list(goals_qs.values('status').annotate(count=Count('id')))

    data = {
        'report_type': 'Environmental',
        'period': f'Last {days} days',
        'generated_at': str(date.today()),
        'summary': total,
        'by_scope': by_scope,
        'by_department': by_dept,
        'goals_summary': goals,
    }

    if export == 'csv':
        return _export_csv('environmental_report', ['Department', 'Emissions (kgCO2e)', 'Transactions'],
                           [(d['department__name'], str(d['emissions']), d['count']) for d in by_dept])
    return Response(data)


@api_view(['GET'])
def social_report(request):
    """Social report — CSR activities, participation, diversity."""
    export = request.query_params.get('export', 'json')

    activities = tenant_filter(request, CSRActivity.objects.all())
    participations = tenant_filter(request, EmployeeParticipation.objects.all())

    data = {
        'report_type': 'Social',
        'generated_at': str(date.today()),
        'summary': {
            'total_activities': activities.count(),
            'active_activities': activities.filter(status='active').count(),
            'completed_activities': activities.filter(status='completed').count(),
            'total_participations': participations.count(),
            'approved_participations': participations.filter(status='approved').count(),
            'pending_participations': participations.filter(status='pending').count(),
            'total_hours': float(participations.filter(status='approved').aggregate(
                total=Sum('hours_contributed'))['total'] or 0),
        },
        'by_status': list(activities.values('status').annotate(count=Count('id'))),
        'by_department': list(activities.values('department__name').annotate(
            count=Count('id')).order_by('-count')),
    }

    if export == 'csv':
        rows = [(d['department__name'] or 'Org-wide', d['count'])
                for d in data['by_department']]
        return _export_csv('social_report', ['Department', 'Activities'], rows)
    return Response(data)


@api_view(['GET'])
def governance_report(request):
    """Governance report — policies, audits, compliance."""
    export = request.query_params.get('export', 'json')

    policies = tenant_filter(request, ESGPolicy.objects.filter(status='active'))
    issues = tenant_filter(request, ComplianceIssue.objects.all())
    audits = tenant_filter(request, Audit.objects.all())

    policy_stats = []
    for p in policies:
        total = p.acknowledgements.count()
        acked = p.acknowledgements.filter(acknowledged=True).count()
        policy_stats.append({
            'title': p.title, 'category': p.category,
            'acknowledged': acked, 'total': total,
            'rate': round(acked / total * 100, 1) if total else 0,
        })

    data = {
        'report_type': 'Governance',
        'generated_at': str(date.today()),
        'summary': {
            'total_policies': policies.count(),
            'total_audits': audits.count(),
            'completed_audits': audits.filter(status='completed').count(),
            'avg_audit_score': float(audits.filter(score__isnull=False).aggregate(
                avg=Avg('score'))['avg'] or 0),
            'open_issues': issues.filter(status='open').count(),
            'overdue_issues': issues.filter(is_overdue=True).count(),
            'critical_issues': issues.filter(severity='critical').count(),
        },
        'policy_acknowledgement': policy_stats,
        'issues_by_severity': list(issues.values('severity').annotate(count=Count('id'))),
        'issues_by_status': list(issues.values('status').annotate(count=Count('id'))),
    }

    if export == 'csv':
        rows = [(p['title'], p['category'], p['acknowledged'], p['total'], f"{p['rate']}%")
                for p in policy_stats]
        return _export_csv('governance_report',
                           ['Policy', 'Category', 'Acknowledged', 'Total', 'Rate'], rows)
    return Response(data)


@api_view(['GET'])
def summary_report(request):
    """ESG Summary — combined dashboard data."""
    export = request.query_params.get('export', 'json')

    scores_qs = tenant_filter(request, DepartmentScore.objects.all())
    scores = scores_qs.order_by('-period', 'department')[:20]

    data = {
        'report_type': 'ESG Summary',
        'generated_at': str(date.today()),
        'department_scores': [
            {
                'department': s.department.name,
                'environmental': float(s.environmental_score),
                'social': float(s.social_score),
                'governance': float(s.governance_score),
                'total': float(s.total_score),
                'period': str(s.period),
            }
            for s in scores
        ],
        'totals': {
            'employees': tenant_filter(request, User.objects.all()).count(),
            'departments': tenant_filter(request, Department.objects.all()).count(),
            'carbon_transactions': tenant_filter(request, CarbonTransaction.objects.all()).count(),
            'csr_activities': tenant_filter(request, CSRActivity.objects.all()).count(),
            'policies': tenant_filter(request, ESGPolicy.objects.filter(status='active')).count(),
            'challenges': tenant_filter(request, Challenge.objects.exclude(status='archived')).count(),
            'badges_awarded': tenant_filter(request, EmployeeBadge.objects.all()).count(),
            'rewards_redeemed': tenant_filter(request, RewardRedemption.objects.all()).count(),
        },
    }

    if export == 'csv':
        rows = [(d['department'], d['environmental'], d['social'],
                 d['governance'], d['total'], d['period'])
                for d in data['department_scores']]
        return _export_csv('esg_summary',
                           ['Department', 'Environmental', 'Social', 'Governance', 'Total', 'Period'],
                           rows)
    return Response(data)


@api_view(['GET'])
def custom_report(request):
    """Custom report with flexible filters."""
    module = request.query_params.get('module', 'environmental')
    dept = request.query_params.get('department')
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    export = request.query_params.get('export', 'json')

    if module == 'environmental':
        qs = tenant_filter(request, CarbonTransaction.objects.all())
        if dept:
            qs = qs.filter(department_id=dept)
        if start_date:
            qs = qs.filter(transaction_date__gte=start_date)
        if end_date:
            qs = qs.filter(transaction_date__lte=end_date)
        rows = list(qs.values(
            'department__name', 'emission_factor__activity_type',
            'emission_factor__scope', 'activity_quantity',
            'calculated_emissions_kgco2e', 'transaction_date',
            'is_auto_calculated',
        ).order_by('-transaction_date')[:200])
        if export == 'csv':
            return _export_csv('custom_environmental',
                               ['Department', 'Activity', 'Scope', 'Quantity', 'Emissions', 'Date', 'Auto'],
                               [(r['department__name'], r['emission_factor__activity_type'],
                                 r['emission_factor__scope'], str(r['activity_quantity']),
                                 str(r['calculated_emissions_kgco2e']),
                                 str(r['transaction_date']), str(r['is_auto_calculated']))
                                for r in rows])
        return Response({'module': module, 'count': len(rows), 'data': rows})

    elif module == 'social':
        qs = tenant_filter(request, CSRActivity.objects.all())
        if dept:
            qs = qs.filter(department_id=dept)
        rows = list(qs.values('title', 'department__name', 'status',
                              'start_date', 'end_date', 'location'))
        if export == 'csv':
            return _export_csv('custom_social',
                               ['Title', 'Department', 'Status', 'Start', 'End', 'Location'],
                               [(r['title'], r['department__name'] or '', r['status'],
                                 str(r['start_date']), str(r.get('end_date', '')), r['location'])
                                for r in rows])
        return Response({'module': module, 'count': len(rows), 'data': rows})

    elif module == 'governance':
        qs = tenant_filter(request, ComplianceIssue.objects.all())
        if dept:
            qs = qs.filter(department_id=dept)
        rows = list(qs.values('title', 'department__name', 'severity',
                              'status', 'due_date', 'is_overdue'))
        if export == 'csv':
            return _export_csv('custom_governance',
                               ['Title', 'Department', 'Severity', 'Status', 'Due Date', 'Overdue'],
                               [(r['title'], r['department__name'] or '', r['severity'],
                                 r['status'], str(r['due_date']), str(r['is_overdue']))
                                for r in rows])
        return Response({'module': module, 'count': len(rows), 'data': rows})

    return Response({'error': 'Invalid module'}, status=400)


def _export_csv(filename, headers, rows):
    """Helper to generate CSV HttpResponse."""
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="{filename}_{date.today()}.csv"'
    writer = csv.writer(response)
    writer.writerow(headers)
    for row in rows:
        writer.writerow(row)
    return response
