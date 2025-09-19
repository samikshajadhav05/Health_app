# backend/app/routes/meals.py
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, time
from ..db import db
from ..utils import to_object_id, to_str_id
from ..services.ai_service import generate_meal_plan
from ..services.auth_service import get_current_user
from ..models.meal import MealCreate

router = APIRouter()

@router.get("/today")
async def get_todays_meals(current_user=Depends(get_current_user)):
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

@router.post("/suggest-day", response_model=dict)
async def suggest_todays_meals(current_user=Depends(get_current_user)):
    """
    Generates a personalized meal suggestion and updates the user's shopping list.
    """
    user_id = to_object_id(current_user["_id"])
    
    # Fetch user data for the AI
    latest_weight_doc = await db.weights.find_one({"user_id": user_id}, sort=[("createdAt", -1)])
    goal_doc = await db.goals.find_one({"user_id": user_id})
    # Fetch user's recent average macros from daily logs
    log_cursor = db.daily_logs.find({"user_id": user_id}).sort("date", -1).limit(7)
    
    # Calculate average macros from the last 7 logs
    total_macros = {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}
    count = 0
    async for log in log_cursor:
        for key in total_macros:
            total_macros[key] += log.get("totals", {}).get(key, 0)
        count += 1
    
    recent_macros = {k: round(v / count, 1) for k, v in total_macros.items()} if count > 0 else {}

    current_weight = latest_weight_doc.get("weight") if latest_weight_doc else 75
    goal = goal_doc.get("goal_type") if goal_doc else "maintenance"

    # Fetch pantry items for the AI
    grocery_cursor = db.grocery.find({"user_id": user_id, "status": "in_stock"})
    in_stock_items = [doc["name"] async for doc in grocery_cursor]

    try:
        # Call the enhanced AI service
        ai_response = generate_meal_plan(
            goal=goal,
            current_weight=current_weight,
            grocery_list=in_stock_items,
            recent_macros=recent_macros
        )
        
        # Check for a shopping list and add items to the user's grocery 'to_buy' list
        shopping_list = ai_response.get("shopping_list")
        if shopping_list:
            for item_name in shopping_list:
                # Use upsert to avoid duplicate items in the 'to_buy' list
                await db.grocery.update_one(
                    {"user_id": user_id, "name_lower": item_name.lower()},
                    {"$set": {
                        "user_id": user_id,
                        "name": item_name,
                        "name_lower": item_name.lower(),
                        "status": "to_buy",
                        "createdAt": datetime.utcnow()
                    }},
                    upsert=True
                )
        
        # Return only the meal plan part to the frontend
        meal_plan = {
            "breakfast": ai_response.get("breakfast"),
            "lunch": ai_response.get("lunch"),
            "dinner": ai_response.get("dinner"),
        }
        return meal_plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate meal plan from AI: {str(e)}")

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_meal_entry(meal: MealCreate, current_user=Depends(get_current_user)):
    user_id = to_object_id(current_user["_id"])
    
    meal_doc = {
        "user_id": user_id,
        "meal_type": meal.meal_type,
        "description": meal.description,
        "date": meal.date,
        "createdAt": datetime.utcnow()
    }
    await db.meals.insert_one(meal_doc)
    return {"message": "Meal created successfully"}

