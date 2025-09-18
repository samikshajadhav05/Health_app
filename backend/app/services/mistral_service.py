# app/services/mistral_service.py

import os
from mistralai import Mistral
import json

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")

client = Mistral(api_key=MISTRAL_API_KEY)

# --- (existing estimate_calories and generate_meal_plan functions remain here) ---
# ... existing code ...

# --- NEW CHATBOT FUNCTION ---
async def get_chatbot_response(message: str, history: list) -> str:
    """
    Gets a conversational response from Mistral AI.
    """
    system_prompt = {
        "role": "system",
        "content": """You are Pebbl, a friendly and knowledgeable health assistant.
        Answer user questions about nutrition, exercise, and healthy living.
        Keep your answers concise, encouraging, and easy to understand.
        Do not give medical advice."""
    }
    
    messages = [system_prompt] + history + [{"role": "user", "content": message}]

    try:
        response = client.chat.complete(
            model="mistral-large-latest",
            messages=messages
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error calling Mistral for chatbot: {e}")
        return "I'm sorry, I'm having a little trouble thinking right now. Please try again in a moment."
