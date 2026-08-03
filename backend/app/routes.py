from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import Response
from pydantic import BaseModel
from backend.app.database import db
from backend.app.auth import get_current_user
from backend.app.rag import ingest_file, query_file
from backend.app.forecast import run_forecast
from backend.app.summary import generate_summary
from backend.app.insights import generate_insights
from backend.app.recommendations import generate_recommendations
from backend.app.data_cleaning import analyze_data_quality
from backend.app.dashboard import generate_dashboard
from backend.app.pdf_report import generate_pdf_report
import pandas as pd
import io

router = APIRouter()


def read_dataframe(contents: bytes, filename: str) -> pd.DataFrame:
    """
    Reads CSV/Excel bytes into a DataFrame, safely handling files that
    aren't strict UTF-8 (common in exports from Excel/legacy systems).
    """
    if filename.endswith(".csv"):
        try:
            return pd.read_csv(io.BytesIO(contents))
        except UnicodeDecodeError:
            # Fall back to Latin-1, which can decode any byte sequence
            return pd.read_csv(io.BytesIO(contents), encoding="latin-1")
    else:
        return pd.read_excel(io.BytesIO(contents))


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    if not file.filename.endswith((".csv", ".xlsx")):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files allowed")

    contents = await file.read()

    try:
        df = read_dataframe(contents, file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read file: {str(e)}")

    file_meta = {
        "filename": file.filename,
        "rows": len(df),
        "columns": list(df.columns),
        "uploaded_by": current_user
    }
    result = await db.files.insert_one(file_meta)
    file_id = str(result.inserted_id)

    # For large files, only embed first 500 rows for RAG (keeps ingestion fast)
    if len(df) > 500:
        sample_df = df.head(500)
        sample_contents = sample_df.to_csv(index=False).encode()
        chunks = await ingest_file(sample_contents, file.filename, file_id)
        sampled = True
    else:
        chunks = await ingest_file(contents, file.filename, file_id)
        sampled = False

    summary = generate_summary(contents, file.filename)

    return {
        "message": "File uploaded and indexed successfully",
        "filename": file.filename,
        "rows": len(df),
        "columns": list(df.columns),
        "file_id": file_id,
        "uploaded_by": current_user,
        "chunks_indexed": chunks,
        "sampled": sampled,
        "sample_note": f"Large file — first 500 of {len(df)} rows indexed for AI chat" if sampled else None,
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


@router.post("/recommendations")
async def get_recommendations(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    if not file.filename.endswith((".csv", ".xlsx")):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files allowed")
    contents = await file.read()
    try:
        result = generate_recommendations(contents, file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {
        "message": "Recommendations generated successfully",
        "generated_by": current_user,
        **result
    }


@router.post("/data-quality")
async def data_quality(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    if not file.filename.endswith((".csv", ".xlsx")):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files allowed")
    contents = await file.read()
    try:
        result = analyze_data_quality(contents, file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {
        "message": "Data quality analysis completed",
        "analyzed_by": current_user,
        **result
    }


@router.post("/dashboard")
async def create_dashboard(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    if not file.filename.endswith((".csv", ".xlsx")):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files allowed")
    contents = await file.read()
    try:
        result = generate_dashboard(contents, file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {
        "message": "Dashboard generated successfully",
        "generated_by": current_user,
        **result
    }


@router.post("/quickstats")
async def quick_stats(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    if not file.filename.endswith((".csv", ".xlsx")):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files allowed")

    contents = await file.read()

    try:
        df = read_dataframe(contents, file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read file: {str(e)}")

    stats = {}
    stats["total_rows"] = len(df)
    stats["total_columns"] = len(df.columns)
    stats["columns"] = list(df.columns)

    # Most common values for text columns (analyzes the FULL dataset, not a sample)
    text_cols = df.select_dtypes(include="object").columns.tolist()
    for col in text_cols:
        stats[f"top_{col}"] = df[col].value_counts().head(5).to_dict()

    # Stats for numeric columns (analyzes the FULL dataset, not a sample)
    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    for col in numeric_cols[:5]:
        stats[f"{col}_stats"] = {
            "mean": round(float(df[col].mean()), 2),
            "min": round(float(df[col].min()), 2),
            "max": round(float(df[col].max()), 2),
            "sum": round(float(df[col].sum()), 2)
        }

    return {
        "message": "Quick stats generated",
        "analyzed_by": current_user,
        "stats": stats
    }


@router.post("/generate-report")
async def generate_report(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    if not file.filename.endswith((".csv", ".xlsx")):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files allowed")

    contents = await file.read()

    try:
        pdf_bytes = generate_pdf_report(contents, file.filename, current_user)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=GenBI_Report_{file.filename}.pdf"
        }
    )


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