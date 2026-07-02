from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
from backend.app.database import db
from backend.app.auth import get_current_user
from backend.app.rag import ingest_file, query_file
import pandas as pd
import io

router = APIRouter()

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    if not file.filename.endswith((".csv", ".xlsx")):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files allowed")

    contents = await file.read()

    if file.filename.endswith(".csv"):
        df = pd.read_csv(io.BytesIO(contents))
    else:
        df = pd.read_excel(io.BytesIO(contents))

    file_meta = {
        "filename": file.filename,
        "rows": len(df),
        "columns": list(df.columns),
        "uploaded_by": current_user
    }
    result = await db.files.insert_one(file_meta)
    file_id = str(result.inserted_id)

    # Ingest into RAG pipeline
    chunks = await ingest_file(contents, file.filename, file_id)

    return {
        "message": "File uploaded and indexed successfully",
        "filename": file.filename,
        "rows": len(df),
        "columns": list(df.columns),
        "file_id": file_id,
        "uploaded_by": current_user,
        "chunks_indexed": chunks
    }

@router.get("/files")
async def get_files(current_user: str = Depends(get_current_user)):
    files = await db.files.find({"uploaded_by": current_user}).to_list(100)
    for f in files:
        f["_id"] = str(f["_id"])
    return files

class QueryRequest(BaseModel):
    question: str
    file_id: str

@router.post("/query")
async def query(request: QueryRequest, current_user: str = Depends(get_current_user)):
    result = await query_file(request.question, request.file_id)
    return {
        "question": request.question,
        "answer": result["answer"],
        "context": result["context"],
        "asked_by": current_user
    }