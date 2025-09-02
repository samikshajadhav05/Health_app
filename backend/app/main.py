from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import cors_origins_list
# Add 'goals' to this import statement
from .routes import auth, meals, weights, daily, grocery, goals
from .db_init import create_indexes  # centralized indexes

# Initialize FastAPI app
app = FastAPI(
    title="Health App Backend 🚀",
    description="Backend service for health tracking, meals, and nutrition AI-powered analysis.",
    version="1.0.0",
)

# CORS configuration
origins = cors_origins_list()
if origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Startup event: ensure MongoDB indexes exist
@app.on_event("startup")
async def on_startup():
    await create_indexes()

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Health App Backend running 🚀"}

# Routers
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(meals.router, prefix="/meals", tags=["Meals"])
app.include_router(weights.router, prefix="/weights", tags=["Weights"])
app.include_router(daily.router, prefix="/daily", tags=["Daily Logs"])
app.include_router(grocery.router, prefix="/grocery", tags=["Grocery"])
# Add this line to include your new goals router
app.include_router(goals.router, prefix="/goals", tags=["Goals"])
