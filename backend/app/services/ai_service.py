# backend/app/services/ai_service.py

import os
import google.generativeai as genai
import json
from typing import List, Dict

# Configure the Gemini API client
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables.")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash-latest')

def estimate_calories(description: str) -> dict:
    """
    Estimates nutritional information for a meal description using the Gemini API.
    """
    prompt = f"""
    Analyze the following meal description and provide its estimated nutritional information.
    The meal is: "{description}"

    Return the data ONLY as a JSON object with these exact keys:
    - "calories" (number)
    - "protein" (number, in grams)
    - "carbs" (number, in grams)
    - "fat" (number, in grams)
    - "fiber" (number, in grams)

    If a value cannot be determined, use 0. Do not include any text, explanation, or markdown formatting like ```json ... ``` outside of the JSON object itself.
    """
    try:
        response = model.generate_content(prompt)
        content = response.text
        
        if '```json' in content:
            start = content.find('{')
            end = content.rfind('}') + 1
            content = content[start:end]

        nutrition_data = json.loads(content)
        return nutrition_data
    except Exception as e:
        print(f"An unexpected error occurred while calling Gemini API for calorie estimation: {e}")
        return {"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0}


def generate_meal_plan(
    goal: str,
    current_weight: float,
    grocery_list: List[str],
    recent_macros: Dict
) -> Dict:
    """
    Generates a personalized one-day meal plan using the Gemini API, considering user data and available ingredients.
    """
    # Create a detailed prompt with all the user's context
    prompt = f"""
    You are a nutrition assistant. Create a simple one-day meal plan (breakfast, lunch, dinner) for a user with the following details:
    - Goal: {goal}
    - Current Weight: {current_weight} kg
    - Recent Average Macros: {json.dumps(recent_macros)}
    - Ingredients available at home (pantry): {', '.join(grocery_list) if grocery_list else 'None'}

    Instructions:
    1. Prioritize using the ingredients from the pantry list.
    2. If you need ingredients that are NOT in the pantry, list them in a "shopping_list".
    3. If all ingredients are in the pantry, the "shopping_list" should be an empty list [].
    4. Provide simple, healthy, and easy-to-make meal ideas.
    5. Return the response ONLY as a single, valid JSON object with no other text or markdown.

    The JSON object must have this exact structure:
    {{
      "breakfast": "...",
      "lunch": "...",
      "dinner": "...",
      "shopping_list": ["item 1", "item 2", ...]
    }}
    """
    try:
        response = model.generate_content(prompt)
        content = response.text

        # Clean the response to ensure it's a valid JSON object
        if '```json' in content:
            start = content.find('{')
            end = content.rfind('}') + 1
            content = content[start:end]

        plan_data = json.loads(content)
        return plan_data
    except Exception as e:
        print(f"An unexpected error occurred while calling Gemini API for meal generation: {e}")
        # Return a fallback plan in case of an error
        return {
            "breakfast": "Oatmeal with berries",
            "lunch": "Grilled chicken salad",
            "dinner": "Baked salmon with steamed vegetables",
            "shopping_list": ["oats", "berries", "chicken", "lettuce", "salmon", "broccoli"]
        }


async def get_chatbot_response(message: str, history: list) -> str:
    """Placeholder for a Gemini-powered chatbot response."""
    # This can be fully implemented later using the same 'model.generate_content' method
    return "I am a helpful assistant powered by Google Gemini!"
