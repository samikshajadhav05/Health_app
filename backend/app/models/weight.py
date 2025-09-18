# backend/app/models/weight.py
from pydantic import BaseModel, Field
from datetime import datetime

class WeightCreate(BaseModel):
    weight: float
    measuredAt: str

class WeightPublic(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: str
    value: float
    measuredAt: str
    createdAt: datetime

    class Config:
        populate_by_name = True
        from_attributes = True