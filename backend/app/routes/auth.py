# backend/app/routes/auth.py
from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
from ..db import db
from ..models.user import UserCreate, UserLogin, Token, UserPublic
from ..utils import to_str_id
from ..services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

router = APIRouter()

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate):
    existing = await db.users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user_doc = {
        "email": payload.email.lower(),
        "password": hash_password(payload.password),
        "age": payload.age,
        "height": payload.height,
        "currentWeight": payload.currentWeight,
        "goalWeight": payload.goalWeight,
        "goal": payload.goal,
        "createdAt": datetime.utcnow(),
    }
    
    user_doc = {k: v for k, v in user_doc.items() if v is not None}

    res = await db.users.insert_one(user_doc)

    token = create_access_token({"sub": to_str_id(res.inserted_id)})
    return {"access_token": token, "token_type": "bearer"}


@router.post("/login", response_model=Token)
async def login(payload: UserLogin):
    user = await db.users.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user.get("password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token = create_access_token({"sub": to_str_id(user["_id"])})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserPublic)
async def me(current_user=Depends(get_current_user)):
    return {
        "_id": to_str_id(current_user["_id"]),
        "email": current_user["email"],
    }