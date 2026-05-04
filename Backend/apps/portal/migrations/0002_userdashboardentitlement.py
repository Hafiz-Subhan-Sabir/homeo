# Generated manually for Money Mastery / King dashboard tiers

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("portal", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="UserDashboardEntitlement",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "access_tier",
                    models.CharField(
                        choices=[
                            ("none", "None"),
                            ("money_mastery", "Money Mastery"),
                            ("king", "The King"),
                            ("full", "Full access"),
                        ],
                        db_index=True,
                        default="none",
                        max_length=32,
                    ),
                ),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="dashboard_entitlement",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "User dashboard entitlement",
                "verbose_name_plural": "User dashboard entitlements",
            },
        ),
    ]
