from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from ..db import db
from ..utils import to_object_id, to_str_id
from ..services.mistral_service import estimate_calories, generate_meal_plan
from ..services.auth_service import get_current_user


router = APIRouter()


# -----------------------
# Unchanged Endpoints
# -----------------------
@router.post("/")
async def add_meal(name: str, current_user=Depends(get_current_user)):
    """Add a simple meal name record for the current user."""
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
    """Get all simple meal name records for the current user."""
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
                "nutrition": doc.get("nutrition"),
            }
        )
    return meals


@router.post("/analyze")
async def analyze_meal(description: str, current_user=Depends(get_current_user)):
    """
    Analyze a meal description using Mistral (calories + macros).
    """
    try:
        # Note: estimate_calories is a different, simpler AI function
        nutrition = estimate_calories(description)
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


# ---------------------------------
# UPDATED AI Meal Plan Endpoint
# ---------------------------------
@router.post("/suggest", response_model=dict)
async def suggest_meal_plan(current_user=Depends(get_current_user)):
    """
    Generates a full meal plan based on the user's latest weight, goal, and
    available 'in_stock' groceries.
    """
    user_id = to_object_id(current_user["_id"])

    # 1. Fetch the user's latest weight from the 'weights' collection
    latest_weight_doc = await db.weights.find_one(
        {"user_id": user_id}, sort=[("createdAt", -1)]
    )
    if not latest_weight_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No weight data found. Please log your weight first.")
    current_weight = latest_weight_doc["weight"]

    # 2. Fetch the user's goal from the 'goals' collection
    goal_doc = await db.goals.find_one({"user_id": user_id})
    if not goal_doc or not goal_doc.get("goal_type"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No health goal set. Please set a goal on the Goals page.")
    goal = goal_doc["goal_type"]  # e.g., "Weight Loss"

    # 3. Fetch 'in_stock' grocery items to see what ingredients are available
    grocery_cursor = db.grocery.find({"user_id": user_id, "status": "in_stock"})
    in_stock_items = [doc["name"] async for doc in grocery_cursor]
    if not in_stock_items:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Your 'in_stock' grocery list is empty. Please add ingredients to get a meal plan.")

    # 4. Call the enhanced AI service with all the context
    try:
        meal_plan = generate_meal_plan(
            goal=goal,
            current_weight=current_weight,
            grocery_list=in_stock_items
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to generate meal plan from AI: {str(e)}")

    # 5. Return the generated plan to the frontend
    return {"goal": goal, "current_weight": current_weight, "meal_plan": meal_plan}