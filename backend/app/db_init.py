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

    # Users - unique email for login
    await db.users.create_index(
        [("email", ASCENDING)], unique=True, name="users_email_idx"
    )

    # Weights - for quickly fetching weight history for a user
    await db.weights.create_index(
        [("user_id", ASCENDING), ("createdAt", DESCENDING)], name="weights_user_createdAt_desc_idx"
    )

    # Daily nutrition logs - for fetching historical log data
    await db.daily_logs.create_index(
        [("user_id", ASCENDING), ("date", DESCENDING)], name="daily_logs_user_date_desc_idx"
    )

    # --- TTL Index for generated Meal Plans ---
    # This collection will store AI-generated plans temporarily.
    # Documents will be automatically deleted after 24 hours (86400 seconds).
    await db.meal_plans.create_index(
        [("createdAt", ASCENDING)],
        name="meal_plans_ttl_idx",
        expireAfterSeconds=86400
    )
    # Index for fetching a user's meal plan
    await db.meal_plans.create_index(
        [("user_id", ASCENDING)], name="meal_plans_user_idx"
    )

    # Grocery / pantry - ensures no duplicate items per user
    await db.grocery.create_index(
        [("user_id", ASCENDING), ("name_lower", ASCENDING)],
        unique=True,
        name="grocery_user_name_idx",
    )

    LOG.info("✅ All indexes ensured successfully.")
