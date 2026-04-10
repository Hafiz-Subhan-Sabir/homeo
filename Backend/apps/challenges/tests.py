from django.test import TestCase
from django.utils import timezone

from apps.challenges import views
from apps.challenges.reminder_expiry import parse_completed_challenge_ids, parse_mission_reminders_map, process_syndicate_user_progress_state
from apps.challenges.models import SyndicateUserProgress


class ChallengesAppTests(TestCase):
    def test_views_importable(self):
        self.assertTrue(callable(views.challenges_today))

    def test_reminder_expiry_penalizes_and_prunes(self):
        from django.contrib.auth import get_user_model

        User = get_user_model()
        u = User.objects.create_user(username="t_reminder", email="t_reminder@example.com", password="x")
        past = (timezone.now() - timezone.timedelta(hours=1)).isoformat()
        obj = SyndicateUserProgress.objects.create(
            user=u,
            state={
                "completed_challenge_ids": "[999]",
                "mission_reminders_v1": '{"1": {"atIso": "%s", "title": "A", "penaltyApplied": false}}' % past,
                "points_total": "10",
            },
            points_total=10,
            level=0,
            streak_count=0,
            last_activity_date=None,
        )
        n = process_syndicate_user_progress_state(obj)
        self.assertEqual(n, 1)
        obj.refresh_from_db()
        self.assertEqual(obj.points_total, 9)
        reminders = parse_mission_reminders_map(dict(obj.state or {}))
        self.assertEqual(reminders, {})

    def test_reminder_expiry_skips_when_completed(self):
        from django.contrib.auth import get_user_model

        User = get_user_model()
        u = User.objects.create_user(username="t_reminder2", email="t_reminder2@example.com", password="x")
        past = (timezone.now() - timezone.timedelta(hours=1)).isoformat()
        obj = SyndicateUserProgress.objects.create(
            user=u,
            state={
                "completed_challenge_ids": "[1]",
                "mission_reminders_v1": '{"1": {"atIso": "%s", "title": "A"}}' % past,
                "points_total": "5",
            },
            points_total=5,
            level=0,
            streak_count=0,
            last_activity_date=None,
        )
        n = process_syndicate_user_progress_state(obj)
        self.assertEqual(n, 0)
        obj.refresh_from_db()
        self.assertEqual(obj.points_total, 5)
        reminders = parse_mission_reminders_map(dict(obj.state or {}))
        self.assertEqual(reminders, {})

    def test_parse_completed_challenge_ids_json_string(self):
        s = parse_completed_challenge_ids({"completed_challenge_ids": "[3, 4]"})
        self.assertEqual(s, {3, 4})
