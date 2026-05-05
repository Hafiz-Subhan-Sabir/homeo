from django.contrib.auth.models import AbstractBaseUser

from apps.courses.models import Course, CourseEnrollment, Video
from apps.portal.models import UserDashboardEntitlement


def _user_is_quiz_ticket_user(user: AbstractBaseUser) -> bool:
    """
    Quiz-ticket users should only access explicitly enrolled courses.
    They are created from quiz OTP flow when no normal account exists.
    """
    if not user or not user.is_authenticated:
        return False
    if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
        return False
    return str(getattr(user, "username", "")).startswith("quiz_ticket_")


def _user_is_playlist_only_buyer(user: AbstractBaseUser) -> bool:
    """
    User paid for one or more stream playlists only (no Money Mastery / King tier).
    LMS Django courses require explicit enrollment; stream programs use playlist unlock.
    """
    if not user or not user.is_authenticated:
        return False
    if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
        return False
    if _user_has_full_course_access(user):
        return False
    try:
        ent = user.dashboard_entitlement
        tier = ent.access_tier
    except UserDashboardEntitlement.DoesNotExist:
        tier = UserDashboardEntitlement.AccessTier.NONE
    if tier != UserDashboardEntitlement.AccessTier.NONE:
        return False
    from apps.video_streaming.models import StreamPlaylistPurchase

    return StreamPlaylistPurchase.objects.filter(
        user=user,
        status=StreamPlaylistPurchase.Status.PAID,
    ).exists()


def _user_has_full_course_access(user: AbstractBaseUser) -> bool:
    if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
        return True
    try:
        ent = user.dashboard_entitlement
    except UserDashboardEntitlement.DoesNotExist:
        return False
    return ent.access_tier in (
        UserDashboardEntitlement.AccessTier.MONEY_MASTERY,
        UserDashboardEntitlement.AccessTier.KING,
        UserDashboardEntitlement.AccessTier.FULL,
    )


def user_can_access_course(user: AbstractBaseUser, course: Course) -> bool:
    if not user or not user.is_authenticated:
        return False
    if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
        return True
    if not course.is_published:
        return False
    if _user_is_quiz_ticket_user(user):
        return CourseEnrollment.objects.filter(user=user, course=course).exists()
    if _user_is_playlist_only_buyer(user):
        return CourseEnrollment.objects.filter(user=user, course=course).exists()
    if _user_has_full_course_access(user):
        return True
    if course.allow_all_authenticated:
        return True
    return CourseEnrollment.objects.filter(user=user, course=course).exists()


def user_can_access_video(user: AbstractBaseUser, video: Video) -> bool:
    return user_can_access_course(user, video.course)
