# Remove unused MissionTemplate pool (missions are agent-generated only).

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("challenges", "0014_mission_template"),
    ]

    operations = [
        migrations.DeleteModel(name="MissionTemplate"),
    ]
