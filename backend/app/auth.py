from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from backend.app.database import db
from dotenv import load_dotenv
import os

load_dotenv()

router = APIRouter(prefix="/auth")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__truncate_error=False)

SECRET_KEY = os.getenv("SECRET_KEY", "genbi-secret-key-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
TOKEN_EXPIRE_MINUTES = int(os.getenv("TOKEN_EXPIRE_MINUTES", 10080))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

class UserSignup(BaseModel):
    username: str
    password: str
    email: str = None

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str):
    return pwd_context.verify(plain, hashed)

def create_token(data: dict):
    expire = datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    data.update({"exp": expire})
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/signup")
async def signup(user: UserSignup):
    existing = await db.users.find_one({"username": user.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    hashed = hash_password(user.password)
    await db.users.insert_one({
        "username": user.username,
        "password": hashed,
        "email": user.email,
        "email_verified": False,
        "created_at": datetime.utcnow().isoformat(),
    })
    if user.email:
        try:
            from backend.app.email_verification import create_verification_token, send_verification_email
            token = await create_verification_token(user.username, db)
            await send_verification_email(user.email, user.username, token)
            return {"message": "User created. Please verify your email."}
        except Exception as e:
            return {"message": "User created. Email verification could not be sent."}
    return {"message": "User created successfully"}

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    db_user = await db.users.find_one({"username": form_data.username})
    if not db_user or not verify_password(form_data.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token({"sub": form_data.username})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/verify-email/{token}")
async def verify_email(token: str):
    from backend.app.email_verification import verify_email_token
    result = await verify_email_token(token, db)
    return result

@router.post("/resend-verification")
async def resend_verification_email(current_user: str = Depends(get_current_user)):
    from backend.app.email_verification import resend_verification
    return await resend_verification(current_user, db)