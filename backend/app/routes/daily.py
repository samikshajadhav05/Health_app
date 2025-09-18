# backend/app/routes/daily.py
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, date
from pydantic import BaseModel
from typing import Dict, List
from ..db import db
from ..utils import to_object_id, to_str_id
from ..models.nutrition import DailyLogPublic
from ..services.auth_service import get_current_user
from ..services.ai_service import estimate_calories

router = APIRouter()

class MealsPayload(BaseModel):
    meals: Dict[str, str]

@router.post("/calculate-macros", response_model=DailyLogPublic)
async def calculate_and_save_macros(payload: MealsPayload, current_user=Depends(get_current_user)):
    today_date = datetime.utcnow().date()
    today = datetime.combine(today_date, datetime.min.time())
    now = datetime.utcnow()
    user_id = to_object_id(current_user["_id"])

    total_macros = {"calories": 0.0, "protein": 0.0, "carbs": 0.0, "fat": 0.0, "fiber": 0.0}
    
    for meal_type, description in payload.meals.items():
        if description:
            nutrition = estimate_calories(description)
            for key in total_macros:
                total_macros[key] += nutrition.get(key, 0)
            
            meal_doc = { "user_id": user_id, "createdAt": now, "meal_type": meal_type, "description": description, "nutrition": nutrition }
            await db.meals.insert_one(meal_doc)

    existing_log = await db.daily_logs.find_one({"user_id": user_id, "date": today})

    if existing_log:
        await db.daily_logs.update_one(
            {"_id": existing_log["_id"]},
            {"$inc": {
                "totals.calories": total_macros["calories"],
                "totals.protein": total_macros["protein"],
                "totals.carbs": total_macros["carbs"],
                "totals.fat": total_macros["fat"],
                "totals.fiber": total_macros["fiber"],
            }}
        )
    else:
        new_log_doc = {
            "user_id": user_id,
            "date": today,
            "totals": total_macros
        }
        await db.daily_logs.insert_one(new_log_doc)
    
    updated_log = await db.daily_logs.find_one({"user_id": user_id, "date": today})
    if not updated_log:
         raise HTTPException(status_code=500, detail="Failed to retrieve daily log.")

    updated_log["_id"] = to_str_id(updated_log["_id"])
    updated_log["user_id"] = to_str_id(updated_log["user_id"])
    return updated_log

@router.get("/", response_model=List[DailyLogPublic])
async def get_daily_logs(current_user=Depends(get_current_user)):
    user_id = to_object_id(current_user["_id"])
    cursor = db.daily_logs.find({"user_id": user_id})
    logs = []
    async for doc in cursor:
        if "date" in doc and not isinstance(doc["date"], datetime):
             doc["date"] = datetime.combine(doc["date"], datetime.min.time())
        
        doc["_id"] = to_str_id(doc["_id"])
        doc["user_id"] = to_str_id(doc["user_id"])
        
        logs.append(doc)
    return logs