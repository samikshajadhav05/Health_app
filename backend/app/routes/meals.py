# app/routes/meals.py
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, time
from ..db import db
from ..utils import to_object_id, to_str_id
# CORRECTED: Import from the new ai_service.py file
from ..services.ai_service import estimate_calories, generate_meal_plan
from ..services.auth_service import get_current_user
from ..models.meal import MealCreate
router = APIRouter()

# (The rest of your meals.py file remains the same)
@router.get("/today")
async def get_todays_meals(current_user=Depends(get_current_user)):
    # ... function content ...
    user_id = to_object_id(current_user["_id"])
    today_start = datetime.combine(datetime.utcnow().date(), time.min)
    today_end = datetime.combine(datetime.utcnow().date(), time.max)
    cursor = db.meals.find({
        "user_id": user_id,
        "createdAt": {"$gte": today_start, "$lte": today_end}
    })
    meals = []
    async for doc in cursor:
        meals.append({
            "_id": to_str_id(doc["_id"]),
            "meal_type": doc.get("meal_type"),
            "description": doc.get("description"),
        })
    return meals

@router.post("/suggest", response_model=dict)
async def suggest_meal_plan(current_user=Depends(get_current_user)):
    # ... function content ...
    user_id = to_object_id(current_user["_id"])
    latest_weight_doc = await db.weights.find_one(
        {"user_id": user_id}, sort=[("createdAt", -1)]
    )
    if not latest_weight_doc:
        raise HTTPException(status_code=404, detail="No weight data found.")
    current_weight = latest_weight_doc["weight"]

    goal_doc = await db.goals.find_one({"user_id": user_id})
    if not goal_doc or not goal_doc.get("goal_type"):
        raise HTTPException(status_code=404, detail="No health goal set.")
    goal = goal_doc["goal_type"]

    grocery_cursor = db.grocery.find({"user_id": user_id, "status": "in_stock"})
    in_stock_items = [doc["name"] async for doc in grocery_cursor]
    if not in_stock_items:
        raise HTTPException(status_code=404, detail="Your 'in_stock' grocery list is empty.")

    try:
        meal_plan = generate_meal_plan(
            goal=goal,
            current_weight=current_weight,
            grocery_list=in_stock_items
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate meal plan from AI: {str(e)}")

    return {"goal": goal, "current_weight": current_weight, "meal_plan": meal_plan}

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_meal_entry(meal: MealCreate, current_user=Depends(get_current_user)):
    """
    Creates a single meal entry for the user for a given date.
    """
    user_id = to_object_id(current_user["_id"])
    
    # Check if a meal of the same type already exists for that day to avoid duplicates
    existing_meal = await db.meals.find_one({
        "user_id": user_id,
        "date": meal.date,
        "meal_type": meal.meal_type
    })
    
    if existing_meal:
        # If it exists, update it (upsert behavior)
        await db.meals.update_one(
            {"_id": existing_meal["_id"]},
            {"$set": {"description": meal.description}}
        )
        return {"message": "Meal updated successfully"}
    else:
        # If not, create a new one
        meal_doc = {
            "user_id": user_id,
            "meal_type": meal.meal_type,
            "description": meal.description,
            "date": meal.date,
            "createdAt": datetime.utcnow()
        }
        await db.meals.insert_one(meal_doc)
        return {"message": "Meal created successfully"}