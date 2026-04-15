from rest_framework import serializers

from apps.courses.models import Course, Video, VideoProgress


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = (
            "id",
            "title",
            "slug",
            "description",
            "is_published",
            "allow_all_authenticated",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "slug", "created_at", "updated_at")


class CourseWriteSerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(required=False, allow_blank=True, max_length=280)

    class Meta:
        model = Course
        fields = ("title", "slug", "description", "is_published", "allow_all_authenticated")


class VideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Video
        fields = (
            "id",
            "title",
            "course",
            "vdocipher_id",
            "order",
            "status",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class VideoCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=500)
    course_id = serializers.IntegerField()
    vdocipher_id = serializers.CharField(max_length=64)
    order = serializers.IntegerField(min_value=0, default=0)
    status = serializers.ChoiceField(choices=Video.Status.choices, default=Video.Status.READY)

    def validate(self, attrs):
        cid = attrs["course_id"]
        if not Course.objects.filter(pk=cid).exists():
            raise serializers.ValidationError({"course_id": "Invalid course."})
        return attrs


class VideoProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoProgress
        fields = ("position_seconds", "completed", "updated_at")
        read_only_fields = ("updated_at",)
