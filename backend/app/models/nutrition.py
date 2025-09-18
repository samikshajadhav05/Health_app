# backend/app/models/nutrition.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

class NutritionTotals(BaseModel):
    calories: float = 0.0
    protein: float = 0.0
    carbs: float = 0.0
    fat: float = 0.0
    fiber: float = 0.0

class DailyLogPublic(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: str
    date: datetime
    totals: NutritionTotals

    class Config:
        populate_by_name = True
        from_attributes = True

class NutritionUpdate(BaseModel):
    meal: str
    ingredients: list[str]
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: float