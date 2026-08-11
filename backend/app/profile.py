from datetime import datetime
from fastapi import HTTPException
from pydantic import BaseModel
from typing import Optional
import bcrypt

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    role: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    website: Optional[str] = None
    avatar_color: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

async def get_profile(username: str, db) -> dict:
    user = await db.users.find_one({"username": username}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

async def update_profile(username: str, data: ProfileUpdate, db) -> dict:
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now().isoformat()
    await db.users.update_one(
        {"username": username},
        {"$set": update_data}
    )
    return await get_profile(username, db)

async def change_password(username: str, data: PasswordChange, db) -> dict:
    user = await db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not bcrypt.checkpw(data.current_password.encode(), user["password"].encode()):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    hashed = bcrypt.hashpw(data.new_password.encode(), bcrypt.gensalt()).decode()
    await db.users.update_one(
        {"username": username},
        {"$set": {"password": hashed, "password_changed_at": datetime.now().isoformat()}}
    )
    return {"message": "Password changed successfully"}

async def get_usage_stats(username: str, db) -> dict:
    queries = await db.query_history.count_documents({"asked_by": username})
    files = await db.files.count_documents({"uploaded_by": username})
    embedded = await db.embedded_docs.count_documents({"username": username})
    return {
        "total_queries": queries,
        "total_files": files,
        "embedded_docs": embedded,
        "member_since": (await db.users.find_one({"username": username}, {"_id": 0, "created_at": 1})).get("created_at", "N/A"),
    }