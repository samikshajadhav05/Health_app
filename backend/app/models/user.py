# backend/app/models/user.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    age: Optional[int] = None
    height: Optional[float] = None
    currentWeight: Optional[float] = None
    goalWeight: Optional[float] = None
    goal: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserPublic(BaseModel):
    id: str = Field(..., alias="_id")
    email: EmailStr

    class Config:
        populate_by_name = True
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: str
    exp: int