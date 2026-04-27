from django.db import migrations, models


def ensure_legacy_stripe_session_id_column(apps, schema_editor):
    if schema_editor.connection.vendor != "sqlite":
        return
    table = "video_streaming_streamplaylistpurchase"
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(f"PRAGMA table_info({table})")
        cols = {row[1] for row in cursor.fetchall()}
        if "stripe_session_id" not in cols:
            cursor.execute(
                f"ALTER TABLE {table} ADD COLUMN stripe_session_id varchar(255) NOT NULL DEFAULT ''"
            )


class Migration(migrations.Migration):
    dependencies = [
        ("video_streaming", "0009_repair_streamplaylistpurchase_schema"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(ensure_legacy_stripe_session_id_column, migrations.RunPython.noop),
            ],
            state_operations=[
                migrations.AddField(
                    model_name="streamplaylistpurchase",
                    name="stripe_session_id",
                    field=models.CharField(blank=True, default="", max_length=255),
                ),
            ],
        ),
    ]
