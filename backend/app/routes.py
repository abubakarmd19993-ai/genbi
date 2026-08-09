from backend.app.invoice_reader import process_invoice
from backend.app.pdf_translator import translate_pdf, SUPPORTED_LANGUAGES
from backend.app.ocr_tool import process_ocr
from backend.app.pdf_chat import ingest_pdf, query_pdf, get_pdf_summary
from backend.app.youtube_notes import generate_youtube_notes
from backend.app.industry_intelligence import generate_industry_intelligence
from backend.app.business_consultant import business_consultant_analysis
from backend.app.sql_generator import generate_sql
from backend.app.root_cause import analyze_root_cause
from backend.app.pdf_report import generate_pdf_report
from backend.app.dashboard import generate_dashboard
from backend.app.data_cleaning import analyze_data_quality
from backend.app.recommendations import generate_recommendations
from backend.app.insights import generate_insights
from backend.app.summary import generate_summary
from backend.app.forecast import run_forecast
from backend.app.rag import ingest_file, query_file
from backend.app.auth import get_current_user
from backend.app.database import db
from pydantic import BaseModel
from fastapi.responses import Response
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
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
        try:
            df = pd.read_csv(io.BytesIO(contents))
        except UnicodeDecodeError:
            df = pd.read_csv(io.BytesIO(contents), encoding="latin-1")
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


@router.post("/root-cause")
async def root_cause_analysis(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    if not file.filename.endswith((".csv", ".xlsx")):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files allowed")
    contents = await file.read()
    try:
        result = analyze_root_cause(contents, file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {
        "message": "Root cause analysis completed",
        "analyzed_by": current_user,
        **result
    }


@router.post("/generate-sql")
async def generate_sql_query(
    file: UploadFile = File(...),
    question: str = "Show me the top 5 records by sales",
    current_user: str = Depends(get_current_user)
):
    if not file.filename.endswith((".csv", ".xlsx")):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files allowed")
    contents = await file.read()
    try:
        result = generate_sql(contents, file.filename, question)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {
        "message": "SQL generated successfully",
        "generated_by": current_user,
        **result
    }


@router.post("/business-consultant")
async def business_consultant(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    if not file.filename.endswith((".csv", ".xlsx")):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files allowed")
    contents = await file.read()
    try:
        result = business_consultant_analysis(contents, file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {
        "message": "Business consultation completed",
        "consulted_by": current_user,
        **result
    }


@router.post("/industry-intelligence")
async def industry_intelligence(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    if not file.filename.endswith((".csv", ".xlsx")):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files allowed")
    contents = await file.read()
    try:
        result = generate_industry_intelligence(contents, file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {
        "message": "Industry intelligence generated",
        "generated_by": current_user,
        **result
    }
@router.post("/youtube-notes")
async def youtube_notes(
    video_url: str,
    current_user: str = Depends(get_current_user)
):
    try:
        pdf_bytes, notes_text = generate_youtube_notes(video_url, current_user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=GenBI_StudyNotes.pdf"
        }
    )
@router.post("/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    contents = await file.read()
    try:
        # Save file metadata
        file_meta = {
            "filename": file.filename,
            "type": "pdf",
            "uploaded_by": current_user
        }
        result = await db.files.insert_one(file_meta)
        file_id = str(result.inserted_id)

        # Get summary
        summary = get_pdf_summary(contents, file.filename)

        # Ingest into ChromaDB
        chunks = ingest_pdf(contents, file.filename, file_id)

        return {
            "message": "PDF uploaded and indexed successfully",
            "filename": file.filename,
            "file_id": file_id,
            "chunks_indexed": chunks,
            "summary": summary
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


class PDFQueryRequest(BaseModel):
    question: str
    file_id: str
@router.post("/ocr")
async def ocr_image(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    if not file.filename.lower().endswith((".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp")):
        raise HTTPException(status_code=400, detail="Only image files allowed (JPG, PNG, BMP, TIFF, WEBP)")
    contents = await file.read()
    try:
        docx_bytes, raw_text, cleaned_text = process_ocr(contents, file.filename, current_user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f"attachment; filename=GenBI_OCR_{file.filename}.docx"
        }
    )

@router.post("/query-pdf")
async def query_pdf_endpoint(
    request: PDFQueryRequest,
    current_user: str = Depends(get_current_user)
):
    try:
        result = query_pdf(request.question, request.file_id)
        # Save to history
        await db.query_history.insert_one({
            "question": request.question,
            "answer": result["answer"],
            "file_id": request.file_id,
            "type": "pdf",
            "asked_by": current_user
        })
        return {
            "message": "PDF query completed",
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
@router.post("/translate-pdf")
async def translate_pdf_endpoint(
    file: UploadFile = File(...),
    target_language: str = "french",
    current_user: str = Depends(get_current_user)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    contents = await file.read()

    # Languages that work well with PDF (Latin script)
    latin_languages = ["french", "german", "spanish", "portuguese", "italian"]

    try:
        pdf_bytes, page_count = translate_pdf(
            contents, file.filename, target_language, current_user
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if target_language.lower() in latin_languages:
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=GenBI_Translated_{target_language}_{file.filename}"
            }
        )
    else:
        # For Arabic, Hindi, Telugu etc — return as text file
        from backend.app.pdf_translator import extract_pdf_text, translate_text, SUPPORTED_LANGUAGES
        pages_text, _ = extract_pdf_text(contents)
        full_translation = ""
        for page in pages_text:
            full_translation += f"\n--- Page {page['page']} ---\n"
            full_translation += translate_text(page["text"], target_language)
            full_translation += "\n"

        return Response(
            content=full_translation.encode("utf-8"),
            media_type="text/plain; charset=utf-8",
            headers={
                "Content-Disposition": f"attachment; filename=GenBI_Translated_{target_language}_{file.filename}.txt"
            }
        )

@router.post("/read-invoice")
async def read_invoice(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    allowed = (".pdf", ".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp")
    if not file.filename.lower().endswith(allowed):
        raise HTTPException(status_code=400, detail="Only PDF and image files allowed")
    contents = await file.read()
    try:
        result = process_invoice(contents, file.filename, current_user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return result
@router.get("/supported-languages")
async def get_supported_languages():
    return {"languages": SUPPORTED_LANGUAGES}

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
        headers={"Content-Disposition": f"attachment; filename=GenBI_Report_{file.filename}.pdf"}
    )


@router.post("/quickstats")
async def quick_stats(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    if not file.filename.endswith((".csv", ".xlsx")):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files allowed")
    contents = await file.read()
    if file.filename.endswith(".csv"):
        try:
            df = pd.read_csv(io.BytesIO(contents))
        except UnicodeDecodeError:
            df = pd.read_csv(io.BytesIO(contents), encoding="latin-1")
    else:
        df = pd.read_excel(io.BytesIO(contents))
    stats = {}
    stats["total_rows"] = len(df)
    stats["total_columns"] = len(df.columns)
    stats["columns"] = list(df.columns)
    text_cols = df.select_dtypes(include="object").columns.tolist()
    for col in text_cols:
        stats[f"top_{col}"] = df[col].value_counts().head(5).to_dict()
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