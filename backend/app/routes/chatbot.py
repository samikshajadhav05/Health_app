# backend/app/routes/chatbot.py
from fastapi import APIRouter, Depends
from ..services.auth_service import get_current_user
from ..services.ai_service import get_chatbot_response # Changed to ai_service
from ..models.chatbot import ChatRequest, ChatResponse

router = APIRouter()

@router.post("/", response_model=ChatResponse)
async def handle_chat(
    request: ChatRequest,
    current_user=Depends(get_current_user)
):
    reply_text = await get_chatbot_response(request.message, [msg.dict() for msg in request.history])
    return ChatResponse(reply=reply_text)