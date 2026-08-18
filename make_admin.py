import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def make_admin():
    client = AsyncIOMotorClient("mongodb://127.0.0.1:27017")
    db = client.genbi
    result = await db.users.update_one(
        {"username": "mohammed"},
        {"$set": {"role": "admin"}}
    )
    print(f"Updated: {result.modified_count} user")
    print("mohammed is now admin!")
    client.close()

asyncio.run(make_admin())