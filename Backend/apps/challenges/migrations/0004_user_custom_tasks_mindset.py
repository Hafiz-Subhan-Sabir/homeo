# User-created tasks (per device) + mindset context

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("challenges", "0003_agentdailyquote"),
    ]

    operations = [
        migrations.AddField(
            model_name="generatedchallenge",
            name="creator_device",
            field=models.CharField(blank=True, db_index=True, default="", max_length=128),
        ),
        migrations.CreateModel(
            name="UserDeviceMindsetContext",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("device_id", models.CharField(db_index=True, max_length=128, unique=True)),
                ("summary", models.TextField(blank=True, default="")),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "api_userdevicemindsetcontext",
                "ordering": ["-updated_at"],
            },
        ),
    ]
