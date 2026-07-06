from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.app.database import db
from backend.app.routes import router
from backend.app.auth import router as auth_router

app = FastAPI(title="GenBI")

# CORS — must be added BEFORE routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(auth_router)

class Message(BaseModel):
    text: str

@app.get("/")
def read_root():
    return {"message": "GenBI backend is alive"}

@app.get("/db-check")
async def db_check():
    collections = await db.list_collection_names()
    return {"connected": True, "collections": collections}

@app.post("/messages")
async def create_message(message: Message):
    result = await db.messages.insert_one({"text": message.text})
    return {"inserted_id": str(result.inserted_id)}

@app.get("/messages")
async def get_messages():
    messages = await db.messages.find().to_list(100)
    for m in messages:
        m["_id"] = str(m["_id"])
    return messages