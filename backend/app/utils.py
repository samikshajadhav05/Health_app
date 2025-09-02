# app/utils.py
from bson import ObjectId
from datetime import datetime, timezone

def to_object_id(id_str: str) -> ObjectId:
    """Convert string to Mongo ObjectId safely."""
    try:
        return ObjectId(id_str)
    except Exception:
        raise ValueError("Invalid ObjectId format")

def to_str_id(oid: ObjectId) -> str:
    """Convert ObjectId to string for tokens/JSON."""
    return str(oid)

def start_of_day_utc(dt: datetime | None = None) -> datetime:
    """Return UTC datetime truncated to 00:00:00 (tz-aware)."""
    now = dt or datetime.utcnow()
    return datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
