# app/models/grocery.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class GroceryItem(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: str
    name: str
    name_lower: str
    status: str = "in_stock"  # "in_stock" or "to_buy"
    createdAt: datetime

    class Config:
        populate_by_name = True
        from_attributes = True

class GroceryCreate(BaseModel):
    name: str
    status: str = "in_stock"