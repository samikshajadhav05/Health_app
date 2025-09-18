from pydantic import BaseModel, Field
from datetime import datetime

class MealGenerated(BaseModel):
    meal_type: str  # breakfast, lunch, snack, dinner
    items: list[str]

class MealPublic(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: str
    date: datetime
    meals: list[MealGenerated]

    class Config:
        validate_by_name = True
        from_attributes = True

class MealCreate(BaseModel):
    meal_type: str
    description: str
    date: datetime


