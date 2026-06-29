from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = "mongodb://127.0.0.1:27017"
DATABASE_NAME = "genbi"

client = AsyncIOMotorClient(MONGO_URL)
db = client[DATABASE_NAME]