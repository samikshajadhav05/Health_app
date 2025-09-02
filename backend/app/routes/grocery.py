# app/routes/grocery.py
from fastapi import APIRouter, Depends, HTTPException
from ..db import db
from ..utils import to_object_id, to_str_id
from ..services.auth_service import get_current_user

router = APIRouter()

@router.post("/")
async def add_grocery_item(name: str, current_user=Depends(get_current_user)):
    """Add a grocery item (unique per user, case-insensitive)."""
    user_id = to_object_id(current_user["_id"])
    name_lower = name.lower()

    # Check for duplicates
    existing = await db.grocery.find_one({"user_id": user_id, "name_lower": name_lower})
    if existing:
        raise HTTPException(status_code=409, detail="Grocery item already exists")

    doc = {
        "user_id": user_id,
        "name": name,
        "name_lower": name_lower
    }
    res = await db.grocery.insert_one(doc)
    return {"_id": to_str_id(res.inserted_id), "name": name, "user_id": to_str_id(user_id)}

@router.get("/")
async def get_grocery_items(current_user=Depends(get_current_user)):
    """Get all grocery items for the current user."""
    user_id = to_object_id(current_user["_id"])
    cursor = db.grocery.find({"user_id": user_id})
    items = []
    async for doc in cursor:
        items.append({
            "_id": to_str_id(doc["_id"]),
            "user_id": to_str_id(doc["user_id"]),
            "name": doc["name"]
        })
    return items
