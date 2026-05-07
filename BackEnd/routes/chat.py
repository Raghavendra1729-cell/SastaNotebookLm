# routes/chat.py
from fastapi import APIRouter, HTTPException
from models.schemas import ChatRequest, ChatResponse
from services.rag_service import get_context
from services.llm_service import get_llm_answer

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        context = await get_context(request.message)
        
        history_list = [msg.model_dump() for msg in request.history]
        
        answer = await get_llm_answer(request.message, context, history_list)
        
        return ChatResponse(answer=answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))