from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("courses", "0005_course_show_in_programs"),
        ("video_streaming", "0004_streamplaylist_is_coming_soon"),
        ("portal", "0003_userplanpurchase"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="KingProgramSelection",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=models.deletion.CASCADE,
                        related_name="king_program_selection",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "courses",
                    models.ManyToManyField(
                        blank=True,
                        related_name="king_selection_users",
                        to="courses.course",
                    ),
                ),
                (
                    "playlists",
                    models.ManyToManyField(
                        blank=True,
                        related_name="king_selection_users",
                        to="video_streaming.streamplaylist",
                    ),
                ),
            ],
            options={
                "verbose_name": "King program selection",
                "verbose_name_plural": "King program selections",
            },
        ),
    ]
