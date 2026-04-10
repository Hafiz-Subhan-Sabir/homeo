# MissionTemplate table created here; seeding removed (pool deleted in 0015).

from django.db import migrations, models


def seed_mission_templates(apps, schema_editor):
    """No-op: template pool was never required for runtime after agent-only first day."""
    pass


def unseed_mission_templates(apps, schema_editor):
    MissionTemplate = apps.get_model("challenges", "MissionTemplate")
    MissionTemplate.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ("challenges", "0013_syndicate_progress_points_level"),
    ]

    operations = [
        migrations.CreateModel(
            name="MissionTemplate",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("payload", models.JSONField()),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
            ],
            options={
                "db_table": "api_missiontemplate",
                "ordering": ["-created_at"],
            },
        ),
        migrations.RunPython(seed_mission_templates, unseed_mission_templates),
    ]
