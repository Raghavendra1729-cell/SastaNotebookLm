# routes/chat.py
from fastapi import APIRouter, HTTPException, Request
from models.schemas import ChatResponse
from services.rag_service import get_context
from services.llm_service import get_llm_answer

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: Request):
    try:
        payload = await request.json()
        if not isinstance(payload, dict):
            raise HTTPException(status_code=400, detail="Request body must be a JSON object.")

        message = str(payload.get("message") or payload.get("query") or "").strip()
        if not message:
            raise HTTPException(status_code=400, detail="message (or query) is required.")

        raw_history = payload.get("history", [])
        history_list = raw_history if isinstance(raw_history, list) else []

        context = await get_context(message)
        answer = await get_llm_answer(message, context, history_list)
        return ChatResponse(answer=answer)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
