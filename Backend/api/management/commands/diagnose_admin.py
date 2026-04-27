"""Print admin login diagnostics (run in Railway shell). No secrets printed."""
import os

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    help = "Check superuser env + DB state + OpenAI key visibility (safe to paste — no secrets)."

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

        # Mindset ingest (OPENAI_API_KEY must be visible to Django after .env load)
        sk = (getattr(settings, "OPENAI_API_KEY", None) or "").strip()
        self.stdout.write("")
        self.stdout.write("--- Mindset ingest / OpenAI ---")
        self.stdout.write(f"settings.OPENAI_API_KEY length: {len(sk)} (empty = ingest will fail)")
        if sk:
            self.stdout.write(f"  starts with sk-: {sk.startswith('sk-')}")
        env_raw = (os.environ.get("OPENAI_API_KEY") or "").strip()
        self.stdout.write(f"os.environ OPENAI_API_KEY length: {len(env_raw)}")
        self.stdout.write(f"OPENAI_MODEL: {getattr(settings, 'OPENAI_MODEL', '')!r}")
