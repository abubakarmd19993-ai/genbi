from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.app.database import db
from backend.app.routes import router
from backend.app.auth import router as auth_router


app = FastAPI(title="GenBI")


# =========================
# CORS CONFIGURATION
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://genbi-ai.vercel.app",
        "https://genbi-frontend.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# ROUTERS
# =========================

app.include_router(auth_router)
app.include_router(router)


# =========================
# MESSAGE MODEL
# =========================

class Message(BaseModel):
    text: str


# =========================
# ROOT
# =========================

@app.get("/")
def read_root():
    return {"message": "GenBI backend is alive"}


# =========================
# DATABASE CHECK
# =========================

@app.get("/db-check")
async def db_check():
    collections = await db.list_collection_names()

    return {
        "connected": True,
        "collections": collections
    }


# =========================
# CREATE MESSAGE
# =========================

@app.post("/messages")
async def create_message(message: Message):
    result = await db.messages.insert_one(
        {"text": message.text}
    )

    return {
        "inserted_id": str(result.inserted_id)
    }


# =========================
# GET MESSAGES
# =========================

@app.get("/messages")
async def get_messages():
    messages = await db.messages.find().to_list(100)

    for message in messages:
        message["_id"] = str(message["_id"])

    return messages