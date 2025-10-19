# app.py

from flask import Flask, request, jsonify, session
from flask_cors import CORS
from kronoslabs import KronosLabs, APIError, AuthenticationError
from dotenv import load_dotenv
import os
import json
import hashlib
from database import db

# --- Configuration & Initialization ---

# 1. Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
app.secret_key = 'ubloom-secret-key-change-in-production'
# Enable CORS for development: allows your React frontend (on a different port) to access this API
CORS(app, supports_credentials=True) 

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

# --- API Endpoints ---

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '').strip()
    avatar_id = data.get('avatar_id', 1)
    
    if not username or not email or not password:
        return jsonify({"error": "All fields are required"}), 400
    
    # Hash password
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    # Create user
    user_id = db.create_user(username, email, password_hash, avatar_id)
    
    if user_id is None:
        return jsonify({"error": "Email already exists"}), 400
    
    # Set session
    session['user_id'] = user_id
    session['username'] = username
    
    return jsonify({
        "success": True,
        "user_id": user_id,
        "username": username
    }), 200

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '').strip()
    password = data.get('password', '').strip()
    
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
    
    user = db.get_user_by_email(email)
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401
    
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    if user[3] != password_hash:  # password_hash is at index 3
        return jsonify({"error": "Invalid credentials"}), 401
    
    # Set session
    session['user_id'] = user[0]
    session['username'] = user[1]
    
    return jsonify({
        "success": True,
        "user_id": user[0],
        "username": user[1],
        "avatar_id": user[4],
        "coins": user[6],
        "streak": user[7]
    }), 200

@app.route('/api/save-progress', methods=['POST'])
def save_progress():
    if 'user_id' not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    data = request.get_json()
    user_id = session['user_id']
    
    # Update user stats
    user_stats = {
        'coins': data.get('coins', 0),
        'streak': data.get('streak', 0),
        'points_today': data.get('pointsToday', 0),
        'goals_completed_today': data.get('goalsCompletedToday', 0),
        'journal_count_today': data.get('journalCountToday', 0),
        'last_active_date': data.get('lastActiveDate'),
        'daily_journal_awarded': data.get('dailyJournalAwarded')
    }
    
    db.update_user_stats(user_id, **user_stats)
    
    return jsonify({"success": True}), 200

@app.route('/api/save-goal', methods=['POST'])
def save_goal():
    if 'user_id' not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    data = request.get_json()
    user_id = session['user_id']
    
    goal_id = db.save_goal(
        user_id=user_id,
        text=data.get('text', ''),
        status=data.get('status', 'active'),
        rewarded=data.get('rewarded', False),
        points_awarded=data.get('pointsAwarded', False)
    )
    
    return jsonify({"success": True, "goal_id": goal_id}), 200

@app.route('/api/update-goal', methods=['POST'])
def update_goal():
    if 'user_id' not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    data = request.get_json()
    goal_id = data.get('goal_id')
    
    updates = {}
    if 'status' in data:
        updates['status'] = data['status']
    if 'rewarded' in data:
        updates['rewarded'] = data['rewarded']
    if 'points_awarded' in data:
        updates['points_awarded'] = data['points_awarded']
    if 'completed_at' in data:
        updates['completed_at'] = data['completed_at']
    if 'skipped_at' in data:
        updates['skipped_at'] = data['skipped_at']
    
    db.update_goal(goal_id, **updates)
    
    return jsonify({"success": True}), 200

@app.route('/api/save-journal', methods=['POST'])
def save_journal():
    if 'user_id' not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    data = request.get_json()
    user_id = session['user_id']
    
    entry_id = db.save_journal_entry(
        user_id=user_id,
        text=data.get('text', ''),
        reflection_data=data.get('reflection')
    )
    
    return jsonify({"success": True, "entry_id": entry_id}), 200

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
    print("Access URLs:")
    print("  - Registration: http://127.0.0.1:5000/api/register")
    print("  - Login: http://127.0.0.1:5000/api/login")
    print("  - AI Reflection: http://127.0.0.1:5000/api/reflect")
    print("  - Save Progress: http://127.0.0.1:5000/api/save-progress")
    print("  - Save Goal: http://127.0.0.1:5000/api/save-goal")
    print("  - Save Journal: http://127.0.0.1:5000/api/save-journal")
    print("------------------------------------------------")
    app.run(port=5000, debug=True)