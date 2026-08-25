import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__truncate_error=False)

async def reset():
    client = AsyncIOMotorClient("mongodb+srv://abubakarmd19993_db_user:genbi123@genbi-cluster.fovlqcg.mongodb.net/genbi?appName=genbi-cluster")
    db = client.genbi
    new_password = "genbi123"
    hashed = pwd_context.hash(new_password[:72])
    result = await db.users.update_one(
        {"username": "mohammed"},
        {"$set": {"password": hashed, "email_verified": True}}
    )
    print(f"Updated: {result.modified_count} user")
    print("Password reset to: genbi123")
    client.close()

asyncio.run(reset())