from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("challenges", "0009_syndicate_progress_and_user_agent_quote"),
    ]

    operations = [
        migrations.AddField(
            model_name="syndicateuserprogress",
            name="streak_count",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="syndicateuserprogress",
            name="last_activity_date",
            field=models.DateField(blank=True, null=True),
        ),
    ]
