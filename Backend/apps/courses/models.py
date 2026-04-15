from django.conf import settings
from django.db import models
from django.utils.text import slugify


class Course(models.Model):
    """Course container for ordered VdoCipher-backed videos."""

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=280, unique=True, db_index=True)
    description = models.TextField(blank=True)
    is_published = models.BooleanField(default=True, db_index=True)
    allow_all_authenticated = models.BooleanField(
        default=True,
        help_text="If True, any authenticated user may view videos. If False, only enrolled users (or staff).",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["title"]

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title) or "course"
            slug = base
            n = 2
            while Course.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{n}"
                n += 1
            self.slug = slug
        super().save(*args, **kwargs)


class CourseEnrollment(models.Model):
    """Explicit enrollment when allow_all_authenticated is False."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="course_enrollments",
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="enrollments")
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "course"], name="courses_enrollment_user_course"),
        ]


class Video(models.Model):
    """Metadata only — bytes live on VdoCipher (vdocipher_id)."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        UPLOADING = "uploading", "Uploading"
        READY = "ready", "Ready"
        FAILED = "failed", "Failed"

    title = models.CharField(max_length=500)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="videos")
    vdocipher_id = models.CharField(
        max_length=64,
        db_index=True,
        help_text="VdoCipher video id from upload credentials / dashboard.",
    )
    order = models.PositiveIntegerField(default=0, db_index=True)
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["course_id", "order", "id"]
        indexes = [
            models.Index(fields=["course", "order"]),
        ]

    def __str__(self) -> str:
        return f"{self.title} ({self.vdocipher_id})"


class VideoProgress(models.Model):
    """Per-user playback position for optional resume."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="video_progress_records",
    )
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name="progress_records")
    position_seconds = models.FloatField(default=0)
    completed = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "video"], name="courses_videoprogress_user_video"),
        ]
