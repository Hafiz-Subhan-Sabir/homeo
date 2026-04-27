from django.contrib.auth.models import AbstractBaseUser

from apps.courses.models import Course, CourseEnrollment, Video


def user_can_access_course(user: AbstractBaseUser, course: Course) -> bool:
    if not user or not user.is_authenticated:
        return False
    if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
        return True
    if not course.is_published:
        return False
    if course.allow_all_authenticated:
        return True
    return CourseEnrollment.objects.filter(user=user, course=course).exists()


def user_can_access_video(user: AbstractBaseUser, video: Video) -> bool:
    return user_can_access_course(user, video.course)
