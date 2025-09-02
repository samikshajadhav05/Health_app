# app/services/mistral_service.py

import os
from mistralai import Mistral

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")

# Initialize client with new SDK
client = Mistral(api_key=MISTRAL_API_KEY)


# Function: estimate calories
def estimate_calories(description: str) -> str:
    response = client.chat.complete(
        model="mistral-large-latest",
        messages=[
            {"role": "user", "content": f"Estimate calories for: {description}"}
        ]
    )
    return response.choices[0].message["content"]


# Function: generate meal plan
def generate_meal_plan(dietary_pref: str, calories: int) -> str:
    response = client.chat.complete(
        model="mistral-large-latest",
        messages=[
            {"role": "user", "content": f"Generate a {calories} calorie meal plan for someone with {dietary_pref} preferences."}
        ]
    )
    return response.choices[0].message["content"]
