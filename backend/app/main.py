# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import cors_origins_list
# Make sure 'meal_plans' is in this import list
from .routes import auth, meals, weights, daily, grocery, goal, activity, meal_plans
from .db_init import create_indexes

app = FastAPI(
    title="Health App Backend 🚀",
    description="Backend service for health tracking, meals, and nutrition AI-powered analysis.",
    version="1.0.0",
)

origins = cors_origins_list()
if origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.on_event("startup")
async def on_startup():
    await create_indexes()

@app.get("/")
async def root():
    return {"message": "Health App Backend running 🚀"}

# Routers
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(meals.router, prefix="/meals", tags=["Meals"])
app.include_router(weights.router, prefix="/weights", tags=["Weights"])
app.include_router(daily.router, prefix="/daily-log", tags=["Daily Logs"])
app.include_router(grocery.router, prefix="/grocery", tags=["Grocery"])
app.include_router(goal.router, prefix="/goals", tags=["Goals"])
app.include_router(activity.router, prefix="/activity", tags=["Activity"])

# This is the crucial line that activates your new API endpoints
app.include_router(meal_plans.router, prefix="/meal-plans", tags=["Meal Plans"])

