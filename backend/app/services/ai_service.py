# app/services/ai_service.py

import os
import google.generativeai as genai
import json

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

        # --- THIS BLOCK NOW HAS THE CORRECT INDENTATION ---
        if '```json' in content:
            start = content.find('{')
            end = content.rfind('}') + 1
            content = content[start:end]

        nutrition_data = json.loads(content)

        required_keys = {"calories", "protein", "carbs", "fat", "fiber"}
        if not all(key in nutrition_data for key in required_keys):
            print(f"Warning: Gemini response was missing keys. Got: {nutrition_data}")
            return {"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0}

        return nutrition_data

    except json.JSONDecodeError:
        print(f"Error: Failed to decode JSON from Gemini response: {content}")
        return {"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0}
    except Exception as e:
        print(f"An unexpected error occurred while calling Gemini API: {e}")
        raise

def generate_meal_plan(goal: str, current_weight: float, grocery_list: list):
    """Placeholder for generating a meal plan with Gemini."""
    return {
        "breakfast": "Scrambled eggs with spinach",
        "lunch": "Quinoa bowl with black beans and avocado",
        "dinner": "Baked chicken with sweet potato and broccoli",
    }

async def get_chatbot_response(message: str, history: list) -> str:
    """Placeholder for a Gemini-powered chatbot response."""
    # This can be fully implemented later using the same 'model.generate_content' method
    return "I am a helpful assistant powered by Google Gemini!"