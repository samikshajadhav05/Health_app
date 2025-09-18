# backend/app/models/activity.py
from pydantic import BaseModel
from typing import Optional

class ActivityCreate(BaseModel):
    type: str
    steps: Optional[int] = None
    duration: Optional[int] = None