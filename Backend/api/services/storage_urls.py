"""Time-limited (presigned) URLs for private object storage (Railway Bucket, S3, etc.)."""
from __future__ import annotations

import logging

from django.conf import settings
from django.core.files.storage import default_storage

from api.models import UploadedDocument

logger = logging.getLogger(__name__)

# S3 presigned URLs are typically capped at 7 days for SigV4.
_MAX_PRESIGN_SECONDS = 604800
_MIN_PRESIGN_SECONDS = 60


def _effective_expire_seconds(requested: int | None) -> int:
    default = int(getattr(settings, "AWS_QUERYSTRING_EXPIRE", 3600))
    if requested is None:
        return max(_MIN_PRESIGN_SECONDS, min(default, _MAX_PRESIGN_SECONDS))
    return max(_MIN_PRESIGN_SECONDS, min(int(requested), _MAX_PRESIGN_SECONDS))


def document_presigned_download_url(
    doc: UploadedDocument,
    *,
    expires_in: int | None = None,
) -> tuple[str | None, int | None]:
    """
    Return (url, expires_in_seconds) for GET of the raw file, or (None, None) if unavailable
    (local/inline-only storage or missing object).
    """
    if not getattr(settings, "USE_S3_OBJECT_STORAGE", False):
        return None, None
    name = (doc.stored_path or "").strip()
    if not name or name.startswith("inline/"):
        return None, None
    expire = _effective_expire_seconds(expires_in)
    try:
        url = default_storage.url(name, expire=expire)
    except Exception:
        logger.exception("presigned url() failed for %s", name)
        return None, None
    return url, expire
