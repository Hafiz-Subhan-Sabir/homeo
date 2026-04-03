"""Print admin login diagnostics (run in Railway shell). No secrets printed."""
import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    help = "Check superuser env + DB state (safe to paste logs — no passwords)."

    def handle(self, *args, **options):
        email = (os.environ.get("DJANGO_SUPERUSER_EMAIL") or "").strip().lower()
        has_pw = bool((os.environ.get("DJANGO_SUPERUSER_PASSWORD") or "").strip())
        self.stdout.write(f"DJANGO_SUPERUSER_EMAIL set: {bool(email)}  (value length: {len(email)})")
        self.stdout.write(f"DJANGO_SUPERUSER_PASSWORD set: {has_pw}")

        qs = User.objects.filter(is_superuser=True)
        self.stdout.write(f"Superusers in DB: {qs.count()}")
        for u in qs[:5]:
            self.stdout.write(f"  - id={u.pk} username={u.username!r} is_staff={u.is_staff} active={u.is_active}")

        if email:
            u = User.objects.filter(username=email).first()
            if u:
                self.stdout.write(
                    f"User matching env email username: id={u.pk} is_staff={u.is_staff} "
                    f"is_superuser={u.is_superuser} active={u.is_active}"
                )
            else:
                self.stdout.write(f"No user with username={email!r} — use same email you type at /admin/login/")
