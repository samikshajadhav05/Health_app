from fastapi import APIRouter, Depends, HTTPException, status
from ..db import db
from ..utils import to_object_id
from ..services.auth_service import get_current_user
from ..models.goal import Goal, GoalCreate

router = APIRouter()

@router.post("/", response_model=Goal)
async def set_user_goal(goal_payload: GoalCreate, current_user=Depends(get_current_user)):
    """
    Set or update the user's health goal.
    This uses an "upsert" operation: it creates a goal if one doesn't exist for the user,
    or updates the existing one if it does.
    """
    user_id = to_object_id(current_user["_id"])
    
    goal_doc = goal_payload.dict(exclude_unset=True)
    goal_doc["user_id"] = user_id

    # Update the user's goal, or insert a new one if it doesn't exist
    await db.goals.update_one(
        {"user_id": user_id},
        {"$set": goal_doc},
        upsert=True
    )
    
    # Retrieve the newly created or updated document to return it
    updated_goal = await db.goals.find_one({"user_id": user_id})
    if not updated_goal:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to save or retrieve the goal.")
        
    return updated_goal

@router.get("/", response_model=Goal)
async def get_user_goal(current_user=Depends(get_current_user)):
    """
    Get the user's currently set health goal.
    """
    user_id = to_object_id(current_user["_id"])
    goal = await db.goals.find_one({"user_id": user_id})
    
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No goal has been set for this user.")
        
    return goal