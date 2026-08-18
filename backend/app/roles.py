from datetime import datetime
from fastapi import HTTPException

ROLES = ["user", "admin", "superadmin"]

async def set_user_role(username: str, role: str, db) -> dict:
    if role not in ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Choose: {ROLES}")
    await db.users.update_one(
        {"username": username},
        {"$set": {"role": role, "role_updated_at": datetime.utcnow().isoformat()}}
    )
    return {"message": f"Role updated to {role}", "username": username, "role": role}

async def get_user_role(username: str, db) -> str:
    user = await db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.get("role", "user")

async def require_admin(username: str, db):
    role = await get_user_role(username, db)
    if role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return role

async def get_all_users(db) -> list:
    users = await db.users.find(
        {},
        {"_id": 0, "password": 0}
    ).to_list(100)
    return users

async def get_platform_stats(db) -> dict:
    total_users = await db.users.count_documents({})
    total_queries = await db.query_history.count_documents({})
    total_files = await db.files.count_documents({})
    total_embedded = await db.embedded_docs.count_documents({})
    verified_users = await db.users.count_documents({"email_verified": True})
    admin_users = await db.users.count_documents({"role": "admin"})
    return {
        "total_users": total_users,
        "verified_users": verified_users,
        "admin_users": admin_users,
        "total_queries": total_queries,
        "total_files": total_files,
        "total_embedded": total_embedded,
    }