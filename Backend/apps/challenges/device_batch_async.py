"""Background per-device daily batch generation (category-by-category) for fast partial UI loads."""
from __future__ import annotations

import threading
from datetime import date

from django.db import close_old_connections
from django.utils import timezone

_locks: dict[str, threading.Lock] = {}
_inflight: set[str] = set()
_start_guard = threading.Lock()


def _key(device_id: str, today: date) -> str:
    return f"{device_id}|{today.isoformat()}"


def device_generation_lock(device_id: str, today: date) -> threading.Lock:
    k = _key(device_id, today)
    if k not in _locks:
        _locks[k] = threading.Lock()
    return _locks[k]


def is_device_generation_inflight(device_id: str, today: date) -> bool:
    return _key(device_id, today) in _inflight


def _mark_inflight(device_id: str, today: date) -> None:
    _inflight.add(_key(device_id, today))


def _clear_inflight(device_id: str, today: date) -> None:
    _inflight.discard(_key(device_id, today))


def start_device_ai_batch_phase2(device_id: str, user_id: int) -> bool:
    """
    Start background generation for happy+tired rows (phase 2) after phase-1 energetic
    missions are already stored. Returns True if a new worker thread was started.
    """
    today = timezone.localdate()
    with _start_guard:
        if _key(device_id, today) in _inflight:
            return False
        _mark_inflight(device_id, today)

    def run() -> None:
        close_old_connections()
        try:
            from .services import generate_device_ai_batch_phase_happy_tired_parallel

            with device_generation_lock(device_id, today):
                generate_device_ai_batch_phase_happy_tired_parallel(device_id, user_id)
        finally:
            _clear_inflight(device_id, today)
            close_old_connections()

    threading.Thread(target=run, name=f"device-batch-p2-{device_id}", daemon=True).start()
    return True
