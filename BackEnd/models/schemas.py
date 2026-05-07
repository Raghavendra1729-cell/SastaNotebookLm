from pydantic import BaseModel
from typing import List

class Message(BaseModel):
    role: str 
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[Message]

class ChatResponse(BaseModel):
    answer: str

class UploadResponse(BaseModel):
    filename: str
    message: str
    chunks: int