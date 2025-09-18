# backend/app/routes/meal_plans.py
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from ..db import db
from ..utils import to_object_id
from ..services.auth_service import get_current_user
from ..services.ai_service import generate_meal_plan
from ..models.meal_plan import MealPlan, PlannedMeal

router = APIRouter()

@router.get("/{week_start_date}", response_model=MealPlan)
async def get_meal_plan(week_start_date: str, current_user=Depends(get_current_user)):
    user_id = to_object_id(current_user["_id"])
    plan = await db.meal_plans.find_one({"user_id": user_id, "weekStart": week_start_date})
    if not plan:
        raise HTTPException(status_code=404, detail="Meal plan not found for this week.")
    return plan

@router.post("/generate", response_model=MealPlan, status_code=status.HTTP_201_CREATED)
async def generate_new_meal_plan(payload: dict, current_user=Depends(get_current_user)):
    user_id = to_object_id(current_user["_id"])
    week_start = payload.get("weekStart")
    if not week_start:
        raise HTTPException(status_code=400, detail="weekStart is required.")

    latest_weight_doc = await db.weights.find_one({"user_id": user_id}, sort=[("createdAt", -1)])
    goal_doc = await db.goals.find_one({"user_id": user_id})
    current_weight = latest_weight_doc.get("weight") if latest_weight_doc else 75
    goal = goal_doc.get("goal_type") if goal_doc else "maintenance"

    grocery_cursor = db.grocery.find({"user_id": user_id, "status": "in_stock"})
    in_stock_items = [doc["name"] async for doc in grocery_cursor]

    ai_plan = generate_meal_plan(goal, current_weight, in_stock_items)

    new_plan_doc = {
        "user_id": user_id,
        "weekStart": week_start,
        "meals": [
            PlannedMeal(date=week_start, mealType="breakfast", name=ai_plan.get("breakfast", "N/A")).dict(),
            PlannedMeal(date=week_start, mealType="lunch", name=ai_plan.get("lunch", "N/A")).dict(),
            PlannedMeal(date=week_start, mealType="dinner", name=ai_plan.get("dinner", "N/A")).dict(),
        ],
        "createdAt": datetime.utcnow(),
    }

    result = await db.meal_plans.find_one_and_replace(
        {"user_id": user_id, "weekStart": week_start},
        new_plan_doc,
        upsert=True,
        return_document=True
    )
    return result

@router.post("/", response_model=MealPlan)
async def update_meal_plan(plan_update: dict, current_user=Depends(get_current_user)):
    user_id = to_object_id(current_user["_id"])
    plan_id = to_object_id(plan_update.get("_id"))
    
    update_data = { "meals": plan_update.get("meals") }

    updated_plan = await db.meal_plans.find_one_and_update(
        {"_id": plan_id, "user_id": user_id},
        {"$set": update_data},
        return_document=True
    )
    if not updated_plan:
        raise HTTPException(status_code=404, detail="Plan not found or you do not have permission to edit it.")
    return updated_plan

