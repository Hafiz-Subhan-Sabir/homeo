"""
VdoCipher REST API wrapper. Secret stays server-side only.

Docs:
- Upload credentials: PUT /videos?title=... — https://www.vdocipher.com/docs/server/upload/credentials/
- OTP: POST /videos/{id}/otp — https://www.vdocipher.com/docs/server/playbackauth/otp/
"""

from __future__ import annotations

import logging
from typing import Any

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class VdoCipherError(Exception):
    """Raised when VdoCipher returns an error or misconfiguration."""

    def __init__(self, message: str, status_code: int | None = None, body: str | None = None):
        super().__init__(message)
        self.status_code = status_code
        self.body = body


def _base_url() -> str:
    return (getattr(settings, "VDO_BASE_URL", None) or "https://dev.vdocipher.com/api").rstrip("/")


def _secret() -> str:
    s = (getattr(settings, "VDO_API_SECRET", None) or "").strip()
    if not s:
        raise VdoCipherError("VDO_API_SECRET is not configured.")
    return s


def _headers_json() -> dict[str, str]:
    return {
        "Authorization": f"Apisecret {_secret()}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }


def create_upload_credentials(*, title: str, folder_id: str | None = None) -> dict[str, Any]:
    """
    Request upload authorization from VdoCipher (no file passes through Django).

    Returns JSON including clientPayload (uploadLink, policy fields) and videoId.
    """
    url = f"{_base_url()}/videos"
    params: dict[str, str] = {"title": title[:500]}
    if folder_id:
        params["folderId"] = folder_id
    try:
        r = requests.put(
            url,
            params=params,
            headers={
                "Authorization": f"Apisecret {_secret()}",
                "Accept": "application/json",
            },
            timeout=60,
        )
    except requests.RequestException as e:
        logger.exception("VdoCipher upload credentials request failed")
        raise VdoCipherError(f"VdoCipher network error: {e}") from e

    if not r.ok:
        body = (r.text or "")[:2000]
        logger.warning("VdoCipher PUT /videos failed: %s %s", r.status_code, body)
        raise VdoCipherError(
            f"VdoCipher upload credentials failed ({r.status_code})",
            status_code=r.status_code,
            body=body,
        )
    try:
        return r.json()
    except ValueError as e:
        raise VdoCipherError("VdoCipher returned non-JSON body") from e


def create_otp(*, vdocipher_video_id: str, ttl_seconds: int | None = None) -> dict[str, Any]:
    """OTP + playbackInfo for secure embed (short-lived)."""
    ttl = ttl_seconds
    if ttl is None:
        ttl = int(getattr(settings, "VDO_OTP_TTL", 300) or 300)
    ttl = max(60, min(ttl, 86_400))

    url = f"{_base_url()}/videos/{vdocipher_video_id}/otp"
    try:
        r = requests.post(
            url,
            headers=_headers_json(),
            json={"ttl": ttl},
            timeout=30,
        )
    except requests.RequestException as e:
        logger.exception("VdoCipher OTP request failed")
        raise VdoCipherError(f"VdoCipher network error: {e}") from e

    if not r.ok:
        body = (r.text or "")[:2000]
        logger.warning("VdoCipher OTP failed: %s %s", r.status_code, body)
        raise VdoCipherError(
            f"VdoCipher OTP failed ({r.status_code})",
            status_code=r.status_code,
            body=body,
        )
    try:
        data = r.json()
    except ValueError as e:
        raise VdoCipherError("VdoCipher OTP returned non-JSON") from e

    if "otp" not in data or "playbackInfo" not in data:
        raise VdoCipherError("VdoCipher OTP response missing otp or playbackInfo")
    return data
