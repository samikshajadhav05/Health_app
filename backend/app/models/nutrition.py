from pydantic import BaseModel, Field
from datetime import datetime

class NutritionLog(BaseModel):
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: float

class NutritionUpdate(BaseModel):
    meal: str  # breakfast, lunch, snack, dinner
    ingredients: list[str]
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: float

class NutritionPublic(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: str
    date: datetime
    totals: NutritionLog
    meals: list[NutritionUpdate]

    class Config:
        validate_by_name = True
        from_attributes = True
