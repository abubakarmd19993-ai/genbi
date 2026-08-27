import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from jose import jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "genbi-secret-key-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

expire = datetime.utcnow() + timedelta(minutes=10080)
token = jwt.encode({"sub": "mohammed", "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)
print(f"TOKEN: {token}")