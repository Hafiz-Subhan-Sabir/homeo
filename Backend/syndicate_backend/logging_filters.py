"""Logging filters for less noisy local dev output."""

import logging


class SkipHttp401Filter(logging.Filter):
    """Drop access + request logs for HTTP 401 (expected when the UI polls without Syndicate auth)."""

    def filter(self, record: logging.LogRecord) -> bool:
        return getattr(record, "status_code", None) != 401
