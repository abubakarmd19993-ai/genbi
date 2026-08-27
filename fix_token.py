import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def fix():
    client = AsyncIOMotorClient("mongodb://127.0.0.1:27017")
    db = client.genbi
    result = await db.users.update_many({}, {"$set": {"email_verified": True}})
    print(f"Fixed {result.modified_count} users")
    client.close()

asyncio.run(fix())