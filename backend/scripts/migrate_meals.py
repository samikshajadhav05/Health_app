import asyncio
from datetime import datetime
from pathlib import Path
import sys

# Add backend folder to sys.path so 'app' can be imported
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.db import db  # Only import db, nothing else from app

async def migrate_meals():
    """
    Migration script to:
    1. Add `createdAt` to old meals documents.
    2. Print current indexes.
    """
    # Add createdAt to old meals
    result = await db.meals.update_many(
        {"createdAt": {"$exists": False}},
        {"$set": {"createdAt": datetime.utcnow()}}
    )
    print(f"✅ Added createdAt to {result.modified_count} old meals")

    # Verify indexes
    print("\n📌 Current indexes in 'meals' collection:")
    indexes = await db.meals.index_information()
    for name, info in indexes.items():
        print(f"- {name}: {info}")

    print("\n✅ Migration complete!")

if __name__ == "__main__":
    asyncio.run(migrate_meals())
