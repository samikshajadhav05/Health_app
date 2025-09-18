# backend/app/routes/activity.py
from fastapi import APIRouter, Depends
from datetime import datetime
from app.db import db
from app.utils import to_object_id, to_str_id
from ..services.auth_service import get_current_user
from ..models.activity import ActivityCreate

router = APIRouter()

@router.post("/")
async def add_activity(payload: ActivityCreate, current_user=Depends(get_current_user)):
    doc = {
        "user_id": to_object_id(current_user["_id"]),
        "type": payload.type,
        "steps": payload.steps,
        "duration": payload.duration,
        "createdAt": datetime.utcnow()
    }
    res = await db.activity.insert_one(doc)
    return {
        "_id": to_str_id(res.inserted_id),
        "type": payload.type,
        "steps": payload.steps,
        "duration": payload.duration
    }