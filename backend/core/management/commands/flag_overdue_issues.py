from django.core.management.base import BaseCommand
from governance.views import flag_overdue_issues


class Command(BaseCommand):
    help = 'Flag compliance issues past their due date as overdue and notify owners'

    def handle(self, *args, **options):
        count = flag_overdue_issues()
        self.stdout.write(self.style.SUCCESS(f'Flagged {count} overdue compliance issues'))
