import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

async def reset():
    client = AsyncIOMotorClient("mongodb://127.0.0.1:27017")
    db = client.genbi
    new_password = "genbi123"
    hashed = pwd_context.hash(new_password[:72])
    result = await db.users.update_one(
        {"username": "mohammed"},
        {"$set": {"password": hashed}}
    )
    print(f"Updated: {result.modified_count} user")
    print(f"Password reset to: {new_password}")
    client.close()

asyncio.run(reset())