from pydantic import BaseModel, Field
from typing import Optional
from datetime import date

class GoalCreate(BaseModel):
    goal_type: str
    target_weight: Optional[float] = None
    target_date: Optional[date] = None

class Goal(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: str
    goal_type: str  # "Weight Loss", "Maintenance", "Weight Gain"
    target_weight: Optional[float] = None
    target_date: Optional[date] = None

    class Config:
        populate_by_name = True
        from_attributes = True