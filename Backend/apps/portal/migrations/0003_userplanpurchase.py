# Generated manually for billing history (Money Mastery / plan checkouts).

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("portal", "0002_userdashboardentitlement"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="UserPlanPurchase",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("stripe_checkout_session_id", models.CharField(db_index=True, max_length=255, unique=True)),
                ("plan_slug", models.CharField(db_index=True, max_length=32)),
                ("product_title", models.CharField(max_length=255)),
                ("amount_paid", models.DecimalField(decimal_places=2, max_digits=12)),
                ("currency", models.CharField(default="gbp", max_length=8)),
                (
                    "status",
                    models.CharField(
                        choices=[("paid", "Paid"), ("pending", "Pending")],
                        db_index=True,
                        default="paid",
                        max_length=16,
                    ),
                ),
                ("paid_at", models.DateTimeField(db_index=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="plan_purchases",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-paid_at", "-id"],
            },
        ),
    ]
