import os
from dotenv import load_dotenv
load_dotenv()

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import upload, chat

app = FastAPI(title="Sasta NotebookLm")

def get_cors_origins() -> list[str]:
    configured_origins = os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,*"
    )
    # Strip trailing slashes and whitespace to avoid common configuration errors
    return [origin.strip().rstrip("/") for origin in configured_origins.split(",") if origin.strip()]


app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(upload.router, tags=["Ingestion"])
app.include_router(chat.router, tags=["Conversation"])

@app.get("/")
def read_root():
    return {"status": "NotebookLM Backend is running perfectly."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
