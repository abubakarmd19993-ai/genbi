from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from backend.app.database import db

router = APIRouter(prefix="/auth")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__truncate_error=False)

# JWT config
SECRET_KEY = "genbi-secret-key-change-in-production"
ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 60

# Request models
class UserSignup(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

# Helper functions
def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str):
    return pwd_context.verify(plain, hashed)

def create_token(data: dict):
    expire = datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    data.update({"exp": expire})
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

# Routes
@router.post("/signup")
async def signup(user: UserSignup):
    existing = await db.users.find_one({"username": user.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    hashed = hash_password(user.password)
    await db.users.insert_one({"username": user.username, "password": hashed})
    return {"message": "User created successfully"}

@router.post("/login")
async def login(user: UserLogin):
    db_user = await db.users.find_one({"username": user.username})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}