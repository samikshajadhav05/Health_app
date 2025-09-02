# app/routes/weights.py
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from app.db import db
from app.utils import to_object_id, to_str_id
from ..services.auth_service import get_current_user

router = APIRouter()

@router.post("/")
async def add_weight(weight: float, current_user=Depends(get_current_user)):
    doc = {
        "user_id": to_object_id(current_user["_id"]),
        "weight": weight,
        "createdAt": datetime.utcnow()
    }
    res = await db.weights.insert_one(doc)
    return {"_id": to_str_id(res.inserted_id), "weight": weight}

@router.get("/")
async def get_weights(current_user=Depends(get_current_user)):
    cursor = db.weights.find({"user_id": to_object_id(current_user["_id"])})
    weights = []
    async for doc in cursor:
        weights.append({
            "_id": to_str_id(doc["_id"]),
            "user_id": to_str_id(doc["user_id"]),
            "weight": doc["weight"],
            "createdAt": doc.get("createdAt")
        })
    return weights
