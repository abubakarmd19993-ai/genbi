from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
from backend.app.database import db
from backend.app.auth import get_current_user
from backend.app.rag import ingest_file, query_file
from backend.app.forecast import run_forecast
from backend.app.summary import generate_summary
from backend.app.insights import generate_insights
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

    chunks = await ingest_file(contents, file.filename, file_id)
    summary = generate_summary(contents, file.filename)

    return {
        "message": "File uploaded and indexed successfully",
        "filename": file.filename,
        "rows": len(df),
        "columns": list(df.columns),
        "file_id": file_id,
        "uploaded_by": current_user,
        "chunks_indexed": chunks,
        "summary": summary
    }

@router.post("/summarize")
async def summarize_file(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    if not file.filename.endswith((".csv", ".xlsx")):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files allowed")

    contents = await file.read()

    try:
        summary = generate_summary(contents, file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return summary

@router.post("/insights")
async def get_insights(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    if not file.filename.endswith((".csv", ".xlsx")):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files allowed")

    contents = await file.read()

    try:
        insights = generate_insights(contents, file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "message": "Insights generated successfully",
        "generated_by": current_user,
        **insights
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

    await db.query_history.insert_one({
        "question": request.question,
        "answer": result["answer"],
        "file_id": request.file_id,
        "asked_by": current_user
    })

    return {
        "question": request.question,
        "answer": result["answer"],
        "context": result["context"],
        "asked_by": current_user
    }

@router.get("/query-history")
async def get_query_history(current_user: str = Depends(get_current_user)):
    history = await db.query_history.find({"asked_by": current_user}).to_list(100)
    for h in history:
        h["_id"] = str(h["_id"])
    return history

@router.post("/forecast")
async def forecast(
    file: UploadFile = File(...),
    date_col: str = "date",
    value_col: str = "sales",
    periods: int = 30,
    current_user: str = Depends(get_current_user)
):
    if not file.filename.endswith((".csv", ".xlsx")):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files allowed")

    contents = await file.read()

    try:
        result = await run_forecast(contents, file.filename, date_col, value_col, periods)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    await db.forecast_history.insert_one({
        "filename": file.filename,
        "date_column": date_col,
        "value_column": value_col,
        "periods_forecasted": periods,
        "forecast": result["forecast"],
        "forecasted_by": current_user
    })

    return {
        "message": "Forecast completed successfully",
        "uploaded_by": current_user,
        **result
    }

@router.get("/forecast-history")
async def get_forecast_history(current_user: str = Depends(get_current_user)):
    history = await db.forecast_history.find({"forecasted_by": current_user}).to_list(100)
    for h in history:
        h["_id"] = str(h["_id"])
    return history