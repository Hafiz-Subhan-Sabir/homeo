# Repair legacy sqlite schema for StreamPlaylistPurchase.

from django.db import migrations


def _table_exists(cursor, table_name: str) -> bool:
    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=%s",
        [table_name],
    )
    return cursor.fetchone() is not None


def _column_names(cursor, table_name: str) -> set[str]:
    cursor.execute(f"PRAGMA table_info({table_name})")
    return {row[1] for row in cursor.fetchall()}


def repair_streamplaylistpurchase_schema(apps, schema_editor):
    # This project uses sqlite in local dev; apply targeted column repair only there.
    if schema_editor.connection.vendor != "sqlite":
        return

    table = "video_streaming_streamplaylistpurchase"
    with schema_editor.connection.cursor() as cursor:
        if not _table_exists(cursor, table):
            return

        cols = _column_names(cursor, table)

        if "status" not in cols:
            cursor.execute(
                f"ALTER TABLE {table} ADD COLUMN status varchar(16) NOT NULL DEFAULT 'pending'"
            )
        if "stripe_checkout_session_id" not in cols:
            cursor.execute(
                f"ALTER TABLE {table} ADD COLUMN stripe_checkout_session_id varchar(255) NOT NULL DEFAULT ''"
            )
        if "currency" not in cols:
            cursor.execute(
                f"ALTER TABLE {table} ADD COLUMN currency varchar(12) NOT NULL DEFAULT 'gbp'"
            )
        if "created_at" not in cols:
            cursor.execute(
                f"ALTER TABLE {table} ADD COLUMN created_at datetime NOT NULL DEFAULT '1970-01-01 00:00:00'"
            )
        if "updated_at" not in cols:
            cursor.execute(
                f"ALTER TABLE {table} ADD COLUMN updated_at datetime NOT NULL DEFAULT '1970-01-01 00:00:00'"
            )

        # Migrate legacy session column data if present.
        cols = _column_names(cursor, table)
        if "stripe_session_id" in cols and "stripe_checkout_session_id" in cols:
            cursor.execute(
                f"""
                UPDATE {table}
                   SET stripe_checkout_session_id = stripe_session_id
                 WHERE (stripe_checkout_session_id IS NULL OR stripe_checkout_session_id = '')
                   AND stripe_session_id IS NOT NULL
                """
            )


class Migration(migrations.Migration):
    dependencies = [
        ("video_streaming", "0008_streamplaylistpurchase"),
    ]

    operations = [
        migrations.RunPython(repair_streamplaylistpurchase_schema, migrations.RunPython.noop),
    ]
