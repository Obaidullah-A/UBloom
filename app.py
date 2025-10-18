# app.py

from flask import Flask, request, jsonify
from flask_cors import CORS
from kronoslabs import KronosLabs, APIError, AuthenticationError
from dotenv import load_dotenv
import os
import json

# --- Configuration & Initialization ---

# 1. Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
# Enable CORS for development: allows your React frontend (on a different port) to access this API
CORS(app) 

KRONOS_API_KEY = os.getenv("KRONOS_API_KEY")

if not KRONOS_API_KEY:
    # Fail fast if the environment key is missing
    raise ValueError("FATAL: KRONOS_API_KEY not found in .env file. Please check your .env file.")

# Initialize Kronos Labs Client
try:
    client = KronosLabs(api_key=KRONOS_API_KEY)
except AuthenticationError as e:
    # If API key is rejected immediately, set client to None and print error
    print(f"FATAL: Kronos Labs Authentication failed. Check API key validity: {e}")
    client = None
except Exception as e:
    print(f"FATAL: Could not initialize Kronos Labs client: {e}")
    client = None

# --- Guardrail and Structured Prompt for the AI Reflection Engine ---

# Define the JSON structure the model MUST follow
OUTPUT_STRUCTURE = """
{
  "insight": "A short, empathetic mirror of the user's feelings, starting with 'It sounds like...'.",
  "growth_category": "Resilience" | "Self-Discipline" | "Emotional Regulation" | "Motivation" | "Relationships",
  "growth_path": "A single, small, concrete next step (a 'mini-goal') for action, starting with 'Try setting a mini-goal:'.",
  "reflection_prompt": "An open-ended question for deeper self-reflection, starting with a question word like 'What' or 'How'."
}
"""

SYSTEM_INSTRUCTIONS = f"""
You are a non-interactive 'Reflection Engine' designed for a mental wellness app called UBloom. Your sole function is to analyze the user's journal entry and output a structured JSON response.

RULES:
1. DO NOT provide direct therapeutic advice, diagnosis, or any conversational replies.
2. Your response MUST be a valid JSON object that strictly adheres to the 'OUTPUT FORMAT'.
3. The response must ONLY contain the JSON object itself. Do not include markdown fences (```json) or any other prose.
4. The 'insight' must gently mirror the user's emotion and validate their feelings.

OUTPUT FORMAT:
{OUTPUT_STRUCTURE}

USER JOURNAL ENTRY FOR ANALYSIS:
"""

# --- API Endpoint ---

@app.route('/api/reflect', methods=['POST'])
def reflect():
    if client is None:
        return jsonify({"error": "AI Service is currently offline due to initialization failure."}), 503
    
    # 1. Get the journal text from the frontend request
    data = request.get_json()
    journal_text = data.get('journal_text', '').strip()

    if not journal_text:
        return jsonify({"error": "No journal entry provided to analyze."}), 400

    # 2. Construct the full prompt
    full_prompt = SYSTEM_INSTRUCTIONS + journal_text
    
    # 3. Call the Kronos Labs API
    try:
        response = client.chat.completions.create(
            prompt=full_prompt,
            model="hermes", # 'hermes' is often faster/cheaper for simple instruction following
            temperature=0.4, # Low temperature encourages structured, reliable output
            is_stream=False
        )

        # 4. Extract, clean, and parse the JSON string
        json_string = response.choices[0].message.content.strip()
        
        # Robust check to remove potential markdown fences the model might still use
        if json_string.startswith('```'):
             json_string = json_string.strip('```json').strip('```').strip()
        
        reflection_data = json.loads(json_string)

        return jsonify(reflection_data), 200

    except APIError as e:
        print(f"Kronos Labs API Error: {e.message}")
        return jsonify({"error": f"LLM API Communication Error: {e.message}"}), 500
        
    except json.JSONDecodeError:
        print(f"CRITICAL: Failed to parse JSON from AI. Model did not follow the prompt. Raw output: {json_string[:100]}...")
        # Fallback to a gentle, static reflection so the user doesn't hit a blank page
        return jsonify({
            "insight": "It sounds like you put a lot of emotion into that entry. That takes courage.",
            "growth_category": "Emotional Regulation",
            "growth_path": "Try setting a mini-goal: Drink a glass of water and stretch for 30 seconds.",
            "reflection_prompt": "What is one non-judgmental thought you can offer yourself right now?"
        }), 200 # Return OK status with the fallback reflection
        
    except Exception as e:
        print(f"General Server Error: {e}")
        return jsonify({"error": "An unexpected server error occurred."}), 500


if __name__ == '__main__':
    # Run the server on the specified port
    print("------------------------------------------------")
    print("       STARTING UBLOOM PYTHON BACKEND")
    print("------------------------------------------------")
    print("AI Engine Status: Active" if client is not None else "AI Engine Status: FAILED TO AUTHENTICATE")
    print("Access URL: http://127.0.0.1:5000/api/reflect")
    print("------------------------------------------------")
    app.run(port=5000, debug=True)