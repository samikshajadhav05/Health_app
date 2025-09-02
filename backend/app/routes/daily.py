# app/routes/daily.py
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from ..db import db
from ..utils import to_object_id, to_str_id
from ..models.nutrition import NutritionUpdate, NutritionPublic
from ..services.auth_service import get_current_user


router = APIRouter()

@router.post("/", response_model=NutritionPublic)
async def add_meal(payload: NutritionUpdate, current_user=Depends(get_current_user)):
    """Add a meal entry and update daily totals (1 doc per user per day)."""
    today = datetime.utcnow().date()
    user_id = to_object_id(current_user["_id"])  # store as ObjectId

    update_query = {
        "$push": {"meals": payload.dict()},  # append meal
        "$inc": {  # increment totals
            "totals.calories": payload.calories,
            "totals.protein": payload.protein,
            "totals.carbs": payload.carbs,
            "totals.fat": payload.fat,
            "totals.fiber": payload.fiber,
        },
        "$setOnInsert": {
            "user_id": user_id,
            "date": today,
            "totals": {
                "calories": 0,
                "protein": 0,
                "carbs": 0,
                "fat": 0,
                "fiber": 0,
            },
            "meals": [],
        },
    }

    # Upsert the daily log
    await db.daily_logs.update_one(
        {"user_id": user_id, "date": today},
        update_query,
        upsert=True
    )

    # Fetch the updated document
    doc = await db.daily_logs.find_one({"user_id": user_id, "date": today})
    if not doc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update daily log")

    # Convert ObjectIds to strings for JSON
    doc["_id"] = to_str_id(doc["_id"])
    doc["user_id"] = to_str_id(doc["user_id"])
    return doc

@router.get("/", response_model=list[NutritionPublic])
async def get_daily_logs(current_user=Depends(get_current_user)):
    """Fetch all daily logs for the current user."""
    user_id = to_object_id(current_user["_id"])
    cursor = db.daily_logs.find({"user_id": user_id})
    logs = []
    async for doc in cursor:
        doc["_id"] = to_str_id(doc["_id"])
        doc["user_id"] = to_str_id(doc["user_id"])
        logs.append(doc)
    return logs
