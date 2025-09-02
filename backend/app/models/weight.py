from pydantic import BaseModel, Field
from datetime import datetime

class WeightCreate(BaseModel):
    value: float = Field(..., gt=0, description="Weight in kg")

class WeightPublic(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: str
    value: float
    date: datetime

    class Config:
        validate_by_name = True
        from_attributes = True
