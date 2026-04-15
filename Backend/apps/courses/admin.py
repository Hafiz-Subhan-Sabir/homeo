from django.contrib import admin

from apps.courses.models import Course, CourseEnrollment, Video, VideoProgress


class VideoInline(admin.TabularInline):
    model = Video
    extra = 0
    ordering = ("order", "id")


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "is_published", "allow_all_authenticated", "updated_at")
    prepopulated_fields = {"slug": ("title",)}
    search_fields = ("title", "slug")
    inlines = [VideoInline]


@admin.register(CourseEnrollment)
class CourseEnrollmentAdmin(admin.ModelAdmin):
    list_display = ("user", "course", "enrolled_at")
    list_filter = ("course",)


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "vdocipher_id", "order", "status", "updated_at")
    list_filter = ("status", "course")
    search_fields = ("title", "vdocipher_id")


@admin.register(VideoProgress)
class VideoProgressAdmin(admin.ModelAdmin):
    list_display = ("user", "video", "position_seconds", "completed", "updated_at")
