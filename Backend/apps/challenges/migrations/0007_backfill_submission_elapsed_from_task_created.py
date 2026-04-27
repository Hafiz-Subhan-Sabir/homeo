from django.db import migrations


def forwards(apps, schema_editor):
    AdminTaskSubmission = apps.get_model("challenges", "AdminTaskSubmission")
    for s in AdminTaskSubmission.objects.select_related("task").iterator():
        task = s.task
        if task is None or s.submitted_at is None:
            continue
        sec = max(0, int((s.submitted_at - task.created_at).total_seconds()))
        AdminTaskSubmission.objects.filter(pk=s.pk).update(elapsed_seconds=sec)


class Migration(migrations.Migration):
    dependencies = [
        ("challenges", "0006_admintasksubmission_attachment"),
    ]

    operations = [
        migrations.RunPython(forwards, migrations.RunPython.noop),
    ]
