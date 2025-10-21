# UBloom: AI-Powered Goal & Wellness Companion (MVP)

UBloom is a minimum viable product (MVP) demonstrating a goal-based mental health application. It connects user journaling with AI-powered reflection and gamification (pet status and points) to encourage positive habits and growth.

## Core MVP Features

The primary loop of the MVP validates the core value proposition: **Journaling $\leftrightarrow$ AI Reflection $\leftrightarrow$ Goal Action $\leftrightarrow$ Pet Reward.**

1.  **AI Reflection Engine:** Users submit a journal entry, and the Python backend uses the **Kronos Labs API** with a **structured prompt** (Guardrail) to return a three-part, non-therapeutic reflection:
    * **Insight:** Empathetic mirroring of the user's emotion.
    * **Growth Path:** A concrete mini-goal suggestion.
    * **Reflection Prompt:** A question for deeper self-assessment.
2.  **Goal-Based Gamification:** The user can instantly convert an AI-suggested "Growth Path" into an actionable goal.
3.  **Pet Status & Points:** Completing a goal awards **10 points** and sets the virtual pet to **"Happy"**. Failing a goal sets the pet to **"Sad"**, closing the gamification feedback loop.
4.  **Dark Mode UI:** A clean, dark-mode interface built with React, focusing on accessibility and a calming user experience.

***

## Project Setup Instructions

This project requires **two separate servers** running concurrently: a **Python Backend** (for the AI) and a **React Frontend** (for the UI).

### Prerequisites

* Python (3.8+)
* Node.js and npm
* A **Kronos Labs API Key**

### Step 1: Backend Setup (AI Reflection)

1.  **Navigate to the Root Directory** (where `app.py` is located):
    ```bash
    cd ~/byte/
    ```
2.  **Create and Activate Virtual Environment (Recommended):**
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```
3.  **Install Dependencies:**
    ```bash
    pip install flask kronoslabs python-dotenv flask-cors
    ```
    
    **Or install from requirements.txt:**
    ```bash
    pip install -r requirements.txt
    ```
4.  **Set API Key:** Create a file named **`.env`** in the root directory and add your key:
    ```
    # .env
    KRONOS_API_KEY="your-api-key-here"
    ```
5.  **Run the Server:**
    ```bash
    python app.py
    ```
    *Keep this terminal window open. The server listens on `http://127.0.0.1:5000`.*

### Step 2: Frontend Setup (React UI)

1.  **Open a New Terminal Tab** and navigate to the React app folder:
    ```bash
    cd bloombuddy-app
    ```
2.  **Install Dependencies:**
    ```bash
    npm install react-router-dom
    ```
3.  **Start the React Development Server:**
    ```bash
    npm start
    ```
    *This will open the UBloom app in your browser (typically `http://localhost:3000`).*

***

## How to Use the MVP

1.  **Journal:** Navigate to the **"Journal"** tab. Write an entry and click **"Get Insight"** (or **"ANALYZE"**).
2.  **Action:** The AI reflection card appears. Click **"Set as Goal"** on the generated Growth Path (mini-goal).
3.  **Goals:** Navigate to the **"Goals"** tab and find your new mini-goal. Click **"Done"** (or **"Failed"**).
4.  **Reward:** Navigate to the **"Home"** tab. Your **Growth Points** will increase, and your **Pet Status** will change to "Happy," validating the core gamification loop.

***

## Tech Stack

* **Frontend:** React (JavaScript, JSX), React Router.
* **Backend:** Python 3, Flask, `python-dotenv`.
* **AI:** Kronos Labs API (`hermes` model).
* **Styling:** Custom component-scoped dark-mode CSS.
