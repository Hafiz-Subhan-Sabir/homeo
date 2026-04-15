"""Portable queries for `Article.tags` (JSON list of strings).

SQLite does not support Django's `JSONField.__contains` for list containment; PostgreSQL does.
"""

from __future__ import annotations

from django.db import connection
from django.db.models import QuerySet


def filter_articles_with_tag(qs: QuerySet, tag: str) -> QuerySet:
    tag = (tag or "").strip()
    if not tag:
        return qs.none()
    if connection.vendor == "sqlite":
        table = qs.model._meta.db_table
        # JSONField stores a JSON list of strings; avoid json_each (fragile on some values / SQLite builds).
        needle = tag.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        like = f'%"{needle}"%'
        return qs.extra(
            where=[f"COALESCE({table}.tags, '') LIKE %s ESCAPE '\\'"],
            params=[like],
        )
    return qs.filter(tags__contains=[tag])
