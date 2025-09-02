from fastapi import APIRouter, Depends
from ..services.auth_service import get_current_user
from ..services.mistral_service import get_chatbot_response
from ..models.chatbot import ChatRequest, ChatResponse

router = APIRouter()

@router.post("/", response_model=ChatResponse)
async def handle_chat(
    request: ChatRequest,
    current_user=Depends(get_current_user)
):
    """
    Handles a user's chat message and returns an AI-generated response.
    """
    reply_text = await get_chatbot_response(request.message, [msg.dict() for msg in request.history])
    return ChatResponse(reply=reply_text)
s