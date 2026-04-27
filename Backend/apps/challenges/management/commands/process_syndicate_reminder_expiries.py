"""
Expire mission reminders: −1 point per overdue incomplete reminder, remove reminder keys, sync leaderboard.

Schedule with cron (e.g. every 5 minutes)::

    */5 * * * * cd /path/to/Backend && python manage.py process_syndicate_reminder_expiries
"""
from django.core.management.base import BaseCommand

from apps.challenges.models import SyndicateUserProgress
from apps.challenges.reminder_expiry import process_syndicate_user_progress_state


class Command(BaseCommand):
    help = "Apply reminder expiry penalties and prune mission_reminders_v1 for all syndicate users."

    def handle(self, *args, **options):
        total = 0
        users = 0
        qs = SyndicateUserProgress.objects.select_related("user").all()
        for obj in qs.iterator():
            n = process_syndicate_user_progress_state(obj)
            if n:
                users += 1
                total += n
                self.stdout.write(self.style.NOTICE(f"user {obj.user_id}: penalized {n} reminder(s)"))
        self.stdout.write(self.style.SUCCESS(f"Done. Users affected: {users}, total penalties: {total}"))
