from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from backend.app.database import db
from backend.app.auth import get_current_user
import pandas as pd
import io

router = APIRouter()

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    # Check file type
    if not file.filename.endswith((".csv", ".xlsx")):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files allowed")

    # Read file contents into memory
    contents = await file.read()

    # Parse with pandas
    if file.filename.endswith(".csv"):
        df = pd.read_csv(io.BytesIO(contents))
    else:
        df = pd.read_excel(io.BytesIO(contents))

    # Save metadata to MongoDB
    file_meta = {
        "filename": file.filename,
        "rows": len(df),
        "columns": list(df.columns),
        "uploaded_by": current_user
    }
    result = await db.files.insert_one(file_meta)

    return {
        "message": "File uploaded successfully",
        "filename": file.filename,
        "rows": len(df),
        "columns": list(df.columns),
        "file_id": str(result.inserted_id),
        "uploaded_by": current_user
    }