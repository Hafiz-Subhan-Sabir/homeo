"""
Membership API access: when MEMBERSHIP_ALLOW_ANONYMOUS_READ is True (default in DEBUG),
hub endpoints (articles, videos, tags, operator briefs meta + generate) work without JWT.

PDF download stays on IsAuthenticatedStrict. In production, set the env flag to false unless
you accept public reads and OpenAI-backed brief generation.
"""

from django.conf import settings
from rest_framework.permissions import BasePermission


class MembershipPublicReadOrAuthenticated(BasePermission):
    """
    When MEMBERSHIP_ALLOW_ANONYMOUS_READ is True, allow unauthenticated access (any HTTP method
    for views using this class — needed for POST /generated-article/).

    When False, require an authenticated user (JWT).
    """

    message = "Authentication required."

    def has_permission(self, request, view):
        if getattr(settings, "MEMBERSHIP_ALLOW_ANONYMOUS_READ", False):
            return True
        user = getattr(request, "user", None)
        return bool(user and user.is_authenticated)
