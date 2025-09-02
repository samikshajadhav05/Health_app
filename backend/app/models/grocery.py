from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class GroceryCreate(BaseModel):
    name: str
    quantity: Optional[str] = None  # e.g. "2kg", "3 packs"

class GroceryUpdate(BaseModel):
    bought: bool

class GroceryPublic(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: str
    name: str
    quantity: Optional[str] = None
    bought: bool = False
    createdAt: datetime

    class Config:
        validate_by_name = True
        from_attributes = True
