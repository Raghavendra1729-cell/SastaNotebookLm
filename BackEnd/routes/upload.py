# routes/upload.py
import os
import shutil
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException
from models.schemas import UploadResponse
from services.rag_service import ingest_document, clear_all_data

router = APIRouter()

@router.delete("/clear")
async def clear_data():
    try:
        await clear_all_data()
        return {"message": "All data cleared successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="File name is missing.")
    
    filename = file.filename
    extension = os.path.splitext(filename)[1].lower()
    
    if extension not in [".pdf", ".txt"]:
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported.")

    with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as temp_file:
        shutil.copyfileobj(file.file, temp_file)
        temp_path = temp_file.name

    try:
        chunks_created = await ingest_document(temp_path, extension)
        return UploadResponse(
            filename=filename, 
            message="Successfully processed and stored document.", 
            chunks=chunks_created
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)