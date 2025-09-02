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

    # Weights - unique per user per day is too restrictive, let's index for queries
    await db.weights.create_index(
        [("user_id", ASCENDING), ("createdAt", DESCENDING)], name="weights_user_createdAt_desc_idx"
    )

    # Daily nutrition logs - unique per user per day
    await db.daily_logs.create_index(
        [("user_id", ASCENDING), ("date", DESCENDING)], name="daily_logs_user_date_desc_idx"
    )

    # --- NEW: TTL Index for generated Meal Plans ---
    # This collection will store AI-generated plans temporarily.
    # Documents will be automatically deleted after 24 hours (86400 seconds).
    await db.meal_plans.create_index(
        [("createdAt", ASCENDING)],
        name="meal_plans_ttl_idx",
        expireAfterSeconds=86400
    )
    await db.meal_plans.create_index(
        [("user_id", ASCENDING)], name="meal_plans_user_idx"
    )


    # Grocery / pantry - unique per user + name_lower
    await db.grocery.create_index(
        [("user_id", ASCENDING), ("name_lower", ASCENDING)],
        unique=True,
        name="grocery_user_name_idx",
    )

    LOG.info("✅ All indexes ensured successfully.")
