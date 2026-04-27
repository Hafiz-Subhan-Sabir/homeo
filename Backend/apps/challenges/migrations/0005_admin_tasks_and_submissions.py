from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("challenges", "0004_user_custom_tasks_mindset"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="AdminAssignedTask",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=220)),
                ("description", models.TextField(blank=True, default="")),
                ("points_target", models.PositiveIntegerField(default=50)),
                ("image_url", models.CharField(blank=True, default="", max_length=500)),
                ("active", models.BooleanField(db_index=True, default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "api_adminassignedtask",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="AdminTaskSubmission",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("device_id", models.CharField(db_index=True, max_length=128)),
                ("response_text", models.TextField()),
                ("started_at", models.DateTimeField(blank=True, null=True)),
                ("submitted_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("elapsed_seconds", models.PositiveIntegerField(default=0)),
                (
                    "status",
                    models.CharField(
                        choices=[("pending", "Pending"), ("reviewed", "Reviewed"), ("rejected", "Rejected")],
                        db_index=True,
                        default="pending",
                        max_length=16,
                    ),
                ),
                ("awarded_points", models.PositiveIntegerField(default=0)),
                ("review_notes", models.TextField(blank=True, default="")),
                ("reviewed_at", models.DateTimeField(blank=True, null=True)),
                ("points_claimed", models.BooleanField(db_index=True, default=False)),
                (
                    "reviewed_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="reviewed_admin_task_submissions",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "task",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="submissions",
                        to="challenges.adminassignedtask",
                    ),
                ),
            ],
            options={
                "db_table": "api_admintasksubmission",
                "ordering": ["-submitted_at"],
            },
        ),
        migrations.AddConstraint(
            model_name="admintasksubmission",
            constraint=models.UniqueConstraint(fields=("task", "device_id"), name="uniq_admin_task_submission_per_device"),
        ),
    ]
