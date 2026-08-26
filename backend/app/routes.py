from backend.app.payments import create_order, verify_payment, get_user_plan
from backend.app.duckdb_engine import register_dataset, execute_query, get_schema_context, quick_analytics, generate_profile
from backend.app.two_factor import setup_2fa, verify_and_enable_2fa, disable_2fa, get_2fa_status
from backend.app.api_keys import create_api_key, list_api_keys, delete_api_key
from backend.app.roles import set_user_role, get_user_role, require_admin, get_all_users, get_platform_stats
from backend.app.profile import get_profile, update_profile, change_password, get_usage_stats, ProfileUpdate, PasswordChange
from datetime import datetime
from backend.app.universal_embedder import embed_document, search_knowledge, detect_file_type
from backend.app.meeting_notes import process_meeting, generate_pdf_report
from backend.app.resume_parser import process_resume
from backend.app.doc_chat import ingest_document, query_document
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
    import numpy as np
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

    # Fix NaN and infinity values
    df = df.replace([np.inf, -np.inf], None)
    df = df.where(pd.notna(df), None)

    file_meta = {
        "filename": file.filename,
        "rows": len(df),
        "columns": list(df.columns),
        "uploaded_by": current_user
    }
    result = await db.files.insert_one(file_meta)
    file_id = str(result.inserted_id)

    try:
        if len(df) > 500:
            sample_df = df.head(500)
            sample_contents = sample_df.to_csv(index=False).encode()
            chunks = await ingest_file(sample_contents, file.filename, file_id)
            sampled = True
        else:
            chunks = await ingest_file(contents, file.filename, file_id)
            sampled = False
    except Exception as e:
        chunks = 0
        sampled = False

    summary = generate_summary(contents, file.filename)

    # Clean summary of NaN values
    import math
    def clean_value(v):
        if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
            return None
        return v

    def clean_dict(d):
        if isinstance(d, dict):
            return {k: clean_dict(v) for k, v in d.items()}
        elif isinstance(d, list):
            return [clean_dict(i) for i in d]
        else:
            return clean_value(d)

    summary = clean_dict(summary)

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

@router.get("/profile")
async def get_user_profile(current_user: str = Depends(get_current_user)):
    return await get_profile(current_user, db)

@router.put("/profile")
async def update_user_profile(
    data: ProfileUpdate,
    current_user: str = Depends(get_current_user)
):
    return await update_profile(current_user, data, db)

@router.post("/change-password")
async def change_user_password(
    data: PasswordChange,
    current_user: str = Depends(get_current_user)
):
    return await change_password(current_user, data, db)

@router.get("/usage-stats")
async def get_user_stats(current_user: str = Depends(get_current_user)):
    return await get_usage_stats(current_user, db) 

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
@router.post("/parse-resume")
async def parse_resume(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    allowed = (".pdf", ".txt", ".docx")
    if not file.filename.lower().endswith(allowed):
        raise HTTPException(status_code=400, detail="Only PDF, TXT and DOCX files allowed")
    contents = await file.read()
    try:
        result = process_resume(contents, file.filename, current_user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return result

@router.post("/upload-doc")
async def upload_document(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    allowed = (".pdf", ".docx", ".doc", ".pptx", ".ppt", ".txt")
    if not file.filename.lower().endswith(allowed):
        raise HTTPException(status_code=400, detail="Supported: PDF, Word, PowerPoint, TXT")
    contents = await file.read()
    try:
        file_meta = {
            "filename": file.filename,
            "type": "document",
            "uploaded_by": current_user
        }
        result = await db.files.insert_one(file_meta)
        file_id = str(result.inserted_id)
        doc_result = ingest_document(contents, file.filename, file_id)
        return {
            "message": "Document uploaded and indexed",
            "file_id": file_id,
            "uploaded_by": current_user,
            **doc_result
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


class DocQueryRequest(BaseModel):
    question: str
    file_id: str


@router.post("/query-doc")
async def query_doc(
    request: DocQueryRequest,
    current_user: str = Depends(get_current_user)
):
    try:
        result = query_document(request.question, request.file_id)
        await db.query_history.insert_one({
            "question": request.question,
            "answer": result["answer"],
            "file_id": request.file_id,
            "type": "document",
            "asked_by": current_user
        })
        return {"message": "Query completed", **result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
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
@router.post("/generate-meeting-notes")
async def generate_meeting_notes_endpoint(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    allowed = (".txt", ".pdf", ".docx", ".doc")
    if not file.filename.lower().endswith(allowed):
        raise HTTPException(status_code=400, detail="Only TXT, PDF, DOCX files allowed")
    contents = await file.read()
    try:
        result = process_meeting(contents, file.filename, current_user)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/embed-document")
async def embed_document_endpoint(
    file: UploadFile = File(...),
    chunk_size: int = 500,
    chunk_overlap: int = 50,
    current_user: str = Depends(get_current_user)
):
    allowed = (".pdf", ".docx", ".doc", ".txt", ".csv", ".xlsx", ".json", ".md")
    if not file.filename.lower().endswith(allowed):
        raise HTTPException(status_code=400, detail="Unsupported file type")
    contents = await file.read()
    try:
        file_meta = {
            "filename": file.filename,
            "type": "embedded",
            "uploaded_by": current_user,
            "embedded_at": datetime.now().isoformat(),
        }
        result = await db.files.insert_one(file_meta)
        file_id = str(result.inserted_id)
        embed_result = embed_document(
            contents, file.filename, file_id,
            current_user, chunk_size, chunk_overlap
        )
        await db.embedded_docs.insert_one({
            **embed_result,
            "username": current_user,
        })
        return embed_result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class SearchRequest(BaseModel):
    query: str
    collection_name: str
    top_k: int = 4


@router.post("/search-knowledge")
async def search_knowledge_endpoint(
    request: SearchRequest,
    current_user: str = Depends(get_current_user)
):
    try:
        result = search_knowledge(request.query, request.collection_name, request.top_k)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/embedded-docs")
async def get_embedded_docs(current_user: str = Depends(get_current_user)):
    try:
        docs = await db.embedded_docs.find(
            {"username": current_user},
            {"_id": 0}
        ).sort("embedded_at", -1).to_list(50)
        return {"documents": docs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/download-meeting-pdf")
async def download_meeting_pdf(
    notes: dict,
    current_user: str = Depends(get_current_user)
):
    try:
        pdf_bytes = generate_pdf_report(notes, "meeting_notes.pdf")
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=GenBI_Meeting_Notes.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
class APIKeyRequest(BaseModel):
    name: str

@router.post("/api-keys")
async def create_key(
    request: APIKeyRequest,
    current_user: str = Depends(get_current_user)
):
    return await create_api_key(current_user, request.name, db)

@router.get("/api-keys")
async def get_keys(current_user: str = Depends(get_current_user)):
    return await list_api_keys(current_user, db)

@router.delete("/api-keys/{key_prefix}")
async def delete_key(
    key_prefix: str,
    current_user: str = Depends(get_current_user)
):
    return await delete_api_key(current_user, key_prefix, db)
class RoleRequest(BaseModel):
    username: str
    role: str

@router.get("/admin/users")
async def admin_get_users(current_user: str = Depends(get_current_user)):
    await require_admin(current_user, db)
    return await get_all_users(db)

@router.get("/admin/stats")
async def admin_get_stats(current_user: str = Depends(get_current_user)):
    await require_admin(current_user, db)
    return await get_platform_stats(db)

@router.post("/admin/set-role")
async def admin_set_role(
    request: RoleRequest,
    current_user: str = Depends(get_current_user)
):
    await require_admin(current_user, db)
    return await set_user_role(request.username, request.role, db)

@router.get("/my-role")
async def get_my_role(current_user: str = Depends(get_current_user)):
    role = await get_user_role(current_user, db)
    return {"username": current_user, "role": role}
class TwoFAVerifyRequest(BaseModel):
    code: str

class TwoFADisableRequest(BaseModel):
    code: str

@router.get("/2fa/status")
async def get_2fa_status_endpoint(current_user: str = Depends(get_current_user)):
    return await get_2fa_status(current_user, db)

@router.post("/2fa/setup")
async def setup_2fa_endpoint(current_user: str = Depends(get_current_user)):
    return await setup_2fa(current_user, db)

@router.post("/2fa/verify-enable")
async def verify_enable_2fa(
    request: TwoFAVerifyRequest,
    current_user: str = Depends(get_current_user)
):
    return await verify_and_enable_2fa(current_user, request.code, db)

@router.post("/2fa/disable")
async def disable_2fa_endpoint(
    request: TwoFADisableRequest,
    current_user: str = Depends(get_current_user)
):
    return await disable_2fa(current_user, request.code, db)
class DuckDBQueryRequest(BaseModel):
    sql: str
    file_id: str

class NLQueryRequest(BaseModel):
    question: str
    file_id: str
    profile: dict = {}

@router.post("/datasets/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    import numpy as np
    import math

    if not file.filename.endswith((".csv", ".xlsx")):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files allowed")

    contents = await file.read()

    try:
        # Register in DuckDB and get profile
        profile = register_dataset(contents, file.filename, "temp")

        # Save to MongoDB
        file_meta = {
            "filename": file.filename,
            "rows": profile["rows"],
            "columns": profile["column_names"],
            "uploaded_by": current_user,
            "profile": profile,
        }
        result = await db.files.insert_one(file_meta)
        file_id = str(result.inserted_id)

        # Re-register with correct file_id
        profile = register_dataset(contents, file.filename, file_id)

        # Update MongoDB with correct file_id
        await db.files.update_one(
            {"_id": result.inserted_id},
            {"$set": {"file_id": file_id, "profile": profile}}
        )

        return {
            "message": "Dataset uploaded and ready for analysis!",
            "file_id": file_id,
            "filename": file.filename,
            "rows": profile["rows"],
            "columns": profile["columns"],
            "numeric_columns": profile["numeric_columns"],
            "categorical_columns": profile["categorical_columns"],
            "profile": profile,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/datasets/{file_id}/profile")
async def get_dataset_profile(
    file_id: str,
    current_user: str = Depends(get_current_user)
):
    try:
        analytics = quick_analytics(file_id)
        return analytics
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/datasets/query-sql")
async def query_dataset_sql(
    request: DuckDBQueryRequest,
    current_user: str = Depends(get_current_user)
):
    try:
        result = execute_query(request.file_id, request.sql)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/datasets/query-nl")
async def query_dataset_nl(
    request: NLQueryRequest,
    current_user: str = Depends(get_current_user)
):
    from langchain_ollama import OllamaLLM
    llm = OllamaLLM(model="llama3.2")

    profile = request.profile
    schema = get_schema_context(request.file_id, profile)
    table_name = f"dataset_{request.file_id[:16].replace('-', '_')}"

    # Step 1: Generate SQL
    sql_prompt = f"""You are a SQL expert. Generate a DuckDB SQL SELECT query for this question.

Table: {table_name}
Schema:
{schema}

Question: {request.question}

Rules:
- Only use SELECT or WITH
- Use column names exactly as shown
- LIMIT results to 20 rows maximum
- Return ONLY the SQL query, nothing else

SQL:"""

    try:
        sql = llm.invoke(sql_prompt).strip()
        # Clean SQL
        if "```" in sql:
            sql = sql.split("```")[1].replace("sql", "").strip()

        # Step 2: Execute SQL
        db_result = execute_query(request.file_id, sql)

        if "error" in db_result:
            # Fallback to schema-only answer
            answer_prompt = f"""Based on this dataset information, answer the question.

Schema: {schema}

Question: {request.question}

Note: Direct data query failed. Use the statistics above to answer.
Answer:"""
            answer = llm.invoke(answer_prompt)
            return {
                "question": request.question,
                "answer": answer,
                "sql": sql,
                "sql_error": db_result["error"],
                "data": [],
            }

        # Step 3: Generate explanation
        data_preview = str(db_result["data"][:5])[:1000]
        explain_prompt = f"""You are a business intelligence analyst. Explain this data result clearly.

Question: {request.question}
SQL Result ({db_result['rows']} rows): {data_preview}

Provide a clear, concise business insight in 2-3 sentences.
Answer:"""

        answer = llm.invoke(explain_prompt)

        return {
            "question": request.question,
            "answer": answer,
            "sql": sql,
            "data": db_result["data"][:20],
            "total_rows": db_result["rows"],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
class PaymentOrderRequest(BaseModel):
    plan: str

class PaymentVerifyRequest(BaseModel):
    order_id: str
    payment_id: str
    signature: str

@router.post("/payments/create-order")
async def payment_create_order(
    request: PaymentOrderRequest,
    current_user: str = Depends(get_current_user)
):
    return await create_order(request.plan, current_user, db)

@router.post("/payments/verify")
async def payment_verify(
    request: PaymentVerifyRequest,
    current_user: str = Depends(get_current_user)
):
    return await verify_payment(
        request.order_id,
        request.payment_id,
        request.signature,
        current_user,
        db
    )

@router.get("/payments/my-plan")
async def my_plan(current_user: str = Depends(get_current_user)):
    return await get_user_plan(current_user, db)