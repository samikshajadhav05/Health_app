# app/routes/meals.py
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from ..db import db
from ..utils import to_object_id, to_str_id
from ..services.mistral_service import estimate_calories, generate_meal_plan
from ..services.auth_service import get_current_user


router = APIRouter()


# -----------------------
# Existing endpoints
# -----------------------
@router.post("/")
async def add_meal(name: str, current_user=Depends(get_current_user)):
    """Add a meal for the current user."""
    user_id = to_object_id(current_user["_id"])
    doc = {
        "user_id": user_id,
        "name": name,
        "createdAt": datetime.utcnow(),
    }
    res = await db.meals.insert_one(doc)
    return {
        "_id": to_str_id(res.inserted_id),
        "name": name,
        "user_id": to_str_id(user_id),
    }


@router.get("/")
async def get_meals(current_user=Depends(get_current_user)):
    """Get all meals for the current user."""
    user_id = to_object_id(current_user["_id"])
    cursor = db.meals.find({"user_id": user_id})
    meals = []
    async for doc in cursor:
        meals.append(
            {
                "_id": to_str_id(doc["_id"]),
                "user_id": to_str_id(doc["user_id"]),
                "name": doc["name"],
                "createdAt": doc.get("createdAt"),
                "nutrition": doc.get("nutrition"),  # 👈 include Mistral analysis if exists
            }
        )
    return meals


# -----------------------
# New Mistral-powered endpoints
# -----------------------
@router.post("/analyze")
async def analyze_meal(description: str, current_user=Depends(get_current_user)):
    """
    Analyze a meal using Mistral (calories + macros).
    """
    try:
        nutrition = await estimate_calories(description)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mistral error: {str(e)}")

    user_id = to_object_id(current_user["_id"])
    doc = {
        "user_id": user_id,
        "description": description,
        "nutrition": nutrition,
        "createdAt": datetime.utcnow(),
    }

    res = await db.meals.insert_one(doc)
    return {
        "_id": to_str_id(res.inserted_id),
        "user_id": to_str_id(user_id),
        "description": description,
        "nutrition": nutrition,
    }


@router.get("/suggest")
async def suggest_meal(goal: str, current_user=Depends(get_current_user)):
    """
    Generate a meal plan for the user’s goal (e.g. 'weight loss').
    """
    try:
        suggestion = await generate_meal_plan(goal)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mistral error: {str(e)}")

    return {"goal": goal, "meal_plan": suggestion}
