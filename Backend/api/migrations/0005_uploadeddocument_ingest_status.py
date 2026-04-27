# Generated manually for ingest visibility in admin.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0004_remove_challenge_models_state"),
    ]

    operations = [
        migrations.AddField(
            model_name="uploadeddocument",
            name="ingest_last_at",
            field=models.DateTimeField(
                blank=True,
                help_text="Last time mindset ingest was attempted (background or admin action).",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="uploadeddocument",
            name="ingest_last_error",
            field=models.TextField(
                blank=True,
                help_text="If ingest failed, the error message (empty when last attempt succeeded).",
            ),
        ),
    ]
