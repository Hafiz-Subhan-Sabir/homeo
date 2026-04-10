import logging

from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger(__name__)


def drf_json_exception_handler(exc, context):
    """
    Keep /api/* errors as JSON. DRF's default handler returns None for some exceptions,
    which makes Django render HTML 500 pages and breaks the Next.js client.
    """
    response = drf_exception_handler(exc, context)
    if response is not None:
        return response

    request = context.get("request")
    path = getattr(request, "path", "") or ""
    if not path.startswith("/api"):
        return None

    logger.exception("Unhandled exception during API request %s", path)
    detail = "Server error. Check Railway backend deploy logs for the traceback."
    if settings.DEBUG:
        detail = f"{type(exc).__name__}: {exc}"
    return Response({"detail": detail}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
