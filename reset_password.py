import asyncio
import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient

async def reset():
    client = AsyncIOMotorClient("mongodb://127.0.0.1:27017")
    db = client.genbi
    new_password = "genbi123"
    hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
    result = await db.users.update_one(
        {"username": "mohammed"},
        {"$set": {"password": hashed}}
    )
    print(f"Updated: {result.modified_count} user")
    print(f"Password reset to: {new_password}")
    client.close()

asyncio.run(reset())