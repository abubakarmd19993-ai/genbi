import secrets
import hashlib
from datetime import datetime
from fastapi import HTTPException

def generate_api_key() -> tuple:
    """Generate API key and its hash."""
    key = f"genbi_{secrets.token_urlsafe(32)}"
    key_hash = hashlib.sha256(key.encode()).hexdigest()
    return key, key_hash

def hash_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()

async def create_api_key(username: str, name: str, db) -> dict:
    """Create a new API key for user."""
    # Max 5 keys per user
    count = await db.api_keys.count_documents({"username": username})
    if count >= 5:
        raise HTTPException(status_code=400, detail="Maximum 5 API keys allowed")

    key, key_hash = generate_api_key()
    doc = {
        "username": username,
        "name": name,
        "key_hash": key_hash,
        "key_prefix": key[:16] + "...",
        "created_at": datetime.utcnow().isoformat(),
        "last_used": None,
        "usage_count": 0,
        "active": True,
    }
    await db.api_keys.insert_one(doc)
    return {
        "key": key,  # Only shown once!
        "name": name,
        "key_prefix": key[:16] + "...",
        "created_at": doc["created_at"],
        "message": "Save this key — it will not be shown again!",
    }

async def list_api_keys(username: str, db) -> list:
    """List all API keys for user (without actual key)."""
    keys = await db.api_keys.find(
        {"username": username},
        {"_id": 0, "key_hash": 0}
    ).to_list(10)
    return keys

async def delete_api_key(username: str, key_prefix: str, db) -> dict:
    """Delete an API key."""
    result = await db.api_keys.delete_one({
        "username": username,
        "key_prefix": key_prefix,
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="API key not found")
    return {"message": "API key deleted"}

async def verify_api_key(key: str, db) -> str:
    """Verify API key and return username."""
    key_hash = hash_key(key)
    record = await db.api_keys.find_one({
        "key_hash": key_hash,
        "active": True,
    })
    if not record:
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Update last used
    await db.api_keys.update_one(
        {"key_hash": key_hash},
        {"$set": {"last_used": datetime.utcnow().isoformat()},
         "$inc": {"usage_count": 1}}
    )
    return record["username"]