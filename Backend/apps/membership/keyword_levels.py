"""Progression levels for membership keyword rows (optional `level` on each dataset row)."""

from __future__ import annotations

LEVEL_ORDER = ("beginner", "intermediate", "advanced")


def normalize_level(raw: str | None) -> str:
    s = (raw or "").strip().lower()
    if s in LEVEL_ORDER:
        return s
    aliases_beginner = frozenset(
        {"easy", "intro", "introduction", "foundations", "start", "101", "basics", "novice"}
    )
    aliases_intermediate = frozenset({"medium", "mid", "developing", "standard"})
    aliases_advanced = frozenset({"hard", "expert", "pro", "mastery", "deep"})
    if s in aliases_beginner:
        return "beginner"
    if s in aliases_intermediate:
        return "intermediate"
    if s in aliases_advanced:
        return "advanced"
    return "intermediate"


def next_level_after(current: str | None) -> str:
    if not current or current not in LEVEL_ORDER:
        return "beginner"
    i = LEVEL_ORDER.index(current)
    return LEVEL_ORDER[(i + 1) % len(LEVEL_ORDER)]
