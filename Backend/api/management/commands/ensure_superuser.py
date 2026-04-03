"""Create or update admin superuser from env (Railway / automated deploy)."""
import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    help = (
        "If DJANGO_SUPERUSER_EMAIL and DJANGO_SUPERUSER_PASSWORD are set, ensure that user "
        "exists as an active superuser and that their password matches the env var (every deploy). "
        "Set DJANGO_SUPERUSER_NO_PASSWORD_SYNC=1 to only create when missing, never change password."
    )

    def handle(self, *args, **options):
        email = (os.environ.get("DJANGO_SUPERUSER_EMAIL") or "").strip().lower()
        password = (os.environ.get("DJANGO_SUPERUSER_PASSWORD") or "").strip()
        if not email or not password:
            self.stdout.write("ensure_superuser: skip (set DJANGO_SUPERUSER_EMAIL and DJANGO_SUPERUSER_PASSWORD)")
            return

        no_sync = (os.environ.get("DJANGO_SUPERUSER_NO_PASSWORD_SYNC") or "").strip().lower() in (
            "1",
            "true",
            "yes",
        )
        existing = User.objects.filter(username=email).first()

        if existing:
            if no_sync:
                self.stdout.write(f"ensure_superuser: user exists, NO_PASSWORD_SYNC set — left unchanged ({email})")
                return
            existing.email = email
            existing.is_staff = True
            existing.is_superuser = True
            existing.is_active = True
            existing.set_password(password)
            existing.save(update_fields=["email", "is_staff", "is_superuser", "is_active", "password"])
            self.stdout.write(
                self.style.SUCCESS(
                    f"ensure_superuser: updated staff/superuser + password for {email} (matches Railway variables now)"
                )
            )
            return

        User.objects.create_superuser(username=email, email=email, password=password)
        self.stdout.write(self.style.SUCCESS(f"ensure_superuser: created superuser {email}"))
