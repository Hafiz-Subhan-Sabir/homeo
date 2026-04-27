"""
Server-side mission reminder expiry: deduct points when reminder time passes with no completion,
then remove the reminder entry from synced JSON state.

See management command ``process_syndicate_reminder_expiries``.
"""
from __future__ import annotations

import json
from datetime import datetime
from typing import Any

from django.utils import timezone


def _parse_json_loose(val: Any) -> Any:
    if val is None:
        return None
    if isinstance(val, (dict, list)):
        return val
    if isinstance(val, str):
        try:
            return json.loads(val)
        except json.JSONDecodeError:
            return None
    return None


def parse_completed_challenge_ids(state: dict) -> set[int]:
    """``completed_challenge_ids`` may be a JSON list string or list."""
    raw = state.get("completed_challenge_ids")
    if raw is None:
        return set()
    if isinstance(raw, list):
        out: set[int] = set()
        for x in raw:
            try:
                out.add(int(x))
            except (TypeError, ValueError):
                continue
        return out
    parsed = _parse_json_loose(str(raw))
    if isinstance(parsed, list):
        out = set()
        for x in parsed:
            try:
                out.add(int(x))
            except (TypeError, ValueError):
                continue
        return out
    return set()


def parse_mission_reminders_map(state: dict) -> dict[str, Any]:
    """``mission_reminders_v1`` may be a dict or JSON object string."""
    raw = state.get("mission_reminders_v1")
    if raw is None:
        return {}
    if isinstance(raw, dict):
        return dict(raw)
    parsed = _parse_json_loose(str(raw))
    return dict(parsed) if isinstance(parsed, dict) else {}


def parse_reminder_due_at(at_iso: str):
    """Parse reminder target time; returns timezone-aware datetime or None."""
    if not at_iso or not isinstance(at_iso, str):
        return None
    s = at_iso.strip()
    if not s:
        return None
    try:
        from django.utils.dateparse import parse_datetime

        dt = parse_datetime(s)
        if dt is not None:
            if timezone.is_naive(dt):
                dt = timezone.make_aware(dt, timezone.get_current_timezone())
            return dt
    except Exception:
        pass
    try:
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        if timezone.is_naive(dt):
            dt = timezone.make_aware(dt, timezone.get_current_timezone())
        return dt
    except ValueError:
        return None


def process_syndicate_user_progress_state(obj) -> int:
    """
    Apply reminder expiry rules to one ``SyndicateUserProgress`` instance (mutates and saves).

    For each reminder whose ``atIso`` is in the past, if the challenge is not in
    ``completed_challenge_ids``, subtract 1 point (minimum 0) and remove that reminder key.

    Returns the number of reminders penalized and removed.
    """
    # Lazy import to avoid circular imports
    from .models import LeaderboardEntry

    now = timezone.now()
    cur = dict(obj.state or {})
    reminders = parse_mission_reminders_map(cur)
    completed = parse_completed_challenge_ids(cur)

    if not reminders:
        return 0

    penalized = 0
    keys_to_remove: list[str] = []

    for key, entry in list(reminders.items()):
        if not isinstance(entry, dict):
            keys_to_remove.append(key)
            continue
        try:
            cid = int(key)
        except (TypeError, ValueError):
            keys_to_remove.append(key)
            continue

        # Mission completed — drop stale reminder without penalty
        if cid in completed:
            keys_to_remove.append(key)
            continue

        at_iso = entry.get("atIso")
        if not isinstance(at_iso, str):
            continue

        due = parse_reminder_due_at(at_iso)
        if due is None:
            continue

        if due > now:
            continue

        # Past due, incomplete: penalty + remove reminder
        keys_to_remove.append(key)
        penalized += 1

    if not keys_to_remove:
        return 0

    for k in keys_to_remove:
        reminders.pop(k, None)

    # Persist reminders back (string for PATCH-shaped clients)
    cur["mission_reminders_v1"] = json.dumps(reminders) if reminders else "{}"

    if penalized > 0:
        new_pts = max(0, int(obj.points_total or 0) - penalized)
        obj.points_total = new_pts
        obj.level = max(0, new_pts // 20)
        cur["points_total"] = str(new_pts)

    obj.state = cur

    if penalized > 0:
        obj.save(update_fields=["state", "points_total", "level", "updated_at"])
    else:
        obj.save(update_fields=["state", "updated_at"])

    if penalized > 0:
        device = f"user:{obj.user_id}"
        dn = ""
        raw_name = cur.get("display_name")
        if isinstance(raw_name, str) and raw_name.strip():
            dn = raw_name.strip()[:64]
        if not dn or dn.lower() == "anonymous":
            u = getattr(obj, "user", None)
            if u is not None:
                email = (getattr(u, "email", None) or "").strip()
                un = (getattr(u, "username", None) or "").strip()
                raw = email or un
                dn = raw.split("@")[0] if raw else "Anonymous"
        if len(dn) > 64:
            dn = dn[:64]
        LeaderboardEntry.objects.update_or_create(
            device_id=device,
            defaults={"points_total": int(obj.points_total or 0), "display_name": dn or "Anonymous"},
        )

    return penalized
