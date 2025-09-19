# backend/app/routes/grocery.py
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
from ..db import db
from ..utils import to_object_id, to_str_id  # Ensure to_str_id is imported
from ..services.auth_service import get_current_user
from ..models.grocery import GroceryItem, GroceryCreate

router = APIRouter()

@router.post("/", response_model=GroceryItem)
async def add_grocery_item(item: GroceryCreate, current_user=Depends(get_current_user)):
    user_id = to_object_id(current_user["_id"])
    name_lower = item.name.lower()

    existing = await db.grocery.find_one({
        "user_id": user_id,
        "name_lower": name_lower,
        "status": item.status
    })
    if existing:
        raise HTTPException(status_code=409, detail=f"Item '{item.name}' already in your '{item.status}' list.")

    doc = {
        "user_id": user_id,
        "name": item.name,
        "name_lower": name_lower,
        "status": item.status,
        "createdAt": datetime.utcnow(),
    }
    res = await db.grocery.insert_one(doc)
    
    created_doc = await db.grocery.find_one({"_id": res.inserted_id})
    return created_doc


@router.get("/", response_model=List[GroceryItem])
async def get_grocery_items(status: str = "in_stock", current_user=Depends(get_current_user)):
    user_id = to_object_id(current_user["_id"])
    cursor = db.grocery.find({"user_id": user_id, "status": status})
    
    # --- THIS IS THE FIX ---
    # We must manually convert ObjectId to string before returning the response.
    items = []
    async for doc in cursor:
        doc["_id"] = to_str_id(doc["_id"])
        doc["user_id"] = to_str_id(doc["user_id"])
        items.append(doc)
    
    return items


@router.put("/{item_id}/status", response_model=GroceryItem)
async def update_item_status(item_id: str, new_status: str, current_user=Depends(get_current_user)):
    if new_status not in ["in_stock", "to_buy"]:
        raise HTTPException(status_code=400, detail="Status must be 'in_stock' or 'to_buy'")

    user_id = to_object_id(current_user["_id"])
    
    res = await db.grocery.find_one_and_update(
        {"_id": to_object_id(item_id), "user_id": user_id},
        {"$set": {"status": new_status}},
        return_document=True
    )
    if not res:
        raise HTTPException(status_code=404, detail="Grocery item not found")
    return res


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_grocery_item(item_id: str, current_user=Depends(get_current_user)):
    user_id = to_object_id(current_user["_id"])
    res = await db.grocery.delete_one({"_id": to_object_id(item_id), "user_id": user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Grocery item not found")
    return None
