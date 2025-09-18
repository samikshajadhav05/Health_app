# backend/app/models/meal_plan.py
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class PlannedMeal(BaseModel):
    date: str  # YYYY-MM-DD
    mealType: str # "breakfast", "lunch", "dinner", or "snack"
    name: str
    macros: Optional[dict] = Field(default_factory=dict)

class MealPlan(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: str
    weekStart: str # YYYY-MM-DD of the Monday of that week
    meals: List[PlannedMeal] = []
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        from_attributes = True

