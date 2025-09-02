# app/db_init.py
import logging
from pymongo import ASCENDING, DESCENDING
from .db import db

LOG = logging.getLogger("db_init")

async def create_indexes():
    """
    Create all required indexes for the app.
    Call this from app.on_event("startup").
    """
    LOG.info("Ensuring MongoDB indexes...")

    # Users - unique email
    await db.users.create_index(
        [("email", ASCENDING)], unique=True, name="users_email_idx"
    )

    # Weights - unique per user per day
    await db.weights.create_index(
        [("user_id", ASCENDING), ("date", ASCENDING)],
        unique=True,
        name="weights_user_date_idx",
    )

    # Daily nutrition logs - unique per user per day
    await db.daily_logs.create_index(
        [("user_id", ASCENDING), ("date", ASCENDING)],
        unique=True,
        name="daily_logs_user_date_idx",
    )
    # Optimized for fetching most recent logs
    await db.daily_logs.create_index(
        [("user_id", ASCENDING), ("date", DESCENDING)],
        name="daily_logs_user_date_desc_idx",
    )

    # Meals - TTL 24 hours on createdAt
    await db.meals.create_index(
        [("createdAt", ASCENDING)],
        name="meals_createdAt_ttl",
        expireAfterSeconds=24 * 3600,  # 24 hours
    )
    # Optional: also index by user_id for fast queries
    await db.meals.create_index(
        [("user_id", ASCENDING)],
        name="meals_user_idx",
    )

    # Grocery / pantry - unique per user + name_lower
    await db.grocery.create_index(
        [("user_id", ASCENDING), ("name_lower", ASCENDING)],
        unique=True,
        name="grocery_user_name_idx",
    )

    LOG.info("✅ All indexes ensured successfully.")
