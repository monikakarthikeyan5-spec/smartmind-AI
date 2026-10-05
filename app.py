import os
import sys

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
if sys.stderr.encoding != 'utf-8':
    try:
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv(override=True)

from groq_service import GroqService

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

# Initialize AI Service
groq_service = GroqService()

@app.route("/")
def index():
    """Render the primary single-page application."""
    return render_template("index.html")

@app.route("/api/status", methods=["GET"])
def get_status():
    """Return AI service configuration status."""
    is_cfg = groq_service.is_configured()
    masked_key = ""
    if groq_service.api_key:
        k = groq_service.api_key
        masked_key = k[:4] + "..." + k[-4:] if len(k) > 8 else "***"
    
    return jsonify({
        "configured": is_cfg,
        "masked_key": masked_key,
        "primary_model": groq_service.PRIMARY_MODEL,
        "fallback_models": groq_service.FALLBACK_MODELS,
        "modules": [
            {"id": "explainer", "name": "Topic Explainer"},
            {"id": "summarizer", "name": "Smart Summarizer"},
            {"id": "quiz", "name": "Quiz Generator"},
            {"id": "doubts", "name": "Doubt Solver"},
            {"id": "planner", "name": "Study Planner"}
        ]
    })

@app.route("/api/settings/key", methods=["POST"])
def update_api_key():
    """Update Groq API Key dynamically."""
    data = request.get_json() or {}
    new_key = data.get("api_key", "").strip()
    
    if not new_key:
        return jsonify({"success": False, "error": "API key cannot be empty"}), 400
        
    groq_service.set_api_key(new_key)
    masked = new_key[:4] + "..." + new_key[-4:] if len(new_key) > 8 else "***"
    
    return jsonify({
        "success": True,
        "message": "Groq API key updated successfully",
        "configured": groq_service.is_configured(),
        "masked_key": masked
    })

# =============================================================================
# MODULE 1: Topic Explainer
# =============================================================================
@app.route("/api/explain", methods=["POST"])
def explain_topic():
    data = request.get_json() or {}
    topic = data.get("topic", "").strip()
    level = data.get("level", "Undergraduate / College").strip()
    style = data.get("style", "Intuitive & Real-World").strip()

    if not topic:
        return jsonify({"success": False, "error": "Topic is required"}), 400

    try:
        result = groq_service.explain_topic(topic=topic, level=level, style=style)
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# =============================================================================
# MODULE 2: Smart Summarizer
# =============================================================================
@app.route("/api/summarize", methods=["POST"])
def summarize_content():
    data = request.get_json() or {}
    content = data.get("content", "").strip()
    is_topic = bool(data.get("is_topic", False))
    format_type = data.get("format_type", "comprehensive").strip()

    if not content:
        return jsonify({"success": False, "error": "Content or topic to summarize is required"}), 400

    try:
        result = groq_service.summarize(text_or_topic=content, is_topic=is_topic, format_type=format_type)
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# =============================================================================
# MODULE 3: Quiz Generator
# =============================================================================
@app.route("/api/quiz/generate", methods=["POST"])
def generate_quiz():
    data = request.get_json() or {}
    topic = data.get("topic", "").strip()
    count = int(data.get("count", 5))
    difficulty = data.get("difficulty", "Medium").strip()

    if not topic:
        return jsonify({"success": False, "error": "Topic is required to generate quiz"}), 400

    # Constraint: Maximum 20 questions as required by user
    if count < 1:
        count = 1
    elif count > 20:
        count = 20

    try:
        result = groq_service.generate_quiz(topic=topic, count=count, difficulty=difficulty)
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# =============================================================================
# MODULE 4: Doubt Solver
# =============================================================================
@app.route("/api/doubt/ask", methods=["POST"])
def ask_doubt():
    data = request.get_json() or {}
    question = data.get("question", "").strip()
    history = data.get("history", [])

    if not question:
        return jsonify({"success": False, "error": "Question is required"}), 400

    try:
        result = groq_service.solve_doubt(question=question, history=history)
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# =============================================================================
# MODULE 5: Study Planner
# =============================================================================
@app.route("/api/planner/generate", methods=["POST"])
def generate_planner():
    data = request.get_json() or {}
    subjects = data.get("subjects", [])
    exam_date = data.get("exam_date", "").strip()
    daily_hours = float(data.get("daily_hours", 3.0))
    routine = data.get("routine", "Balanced").strip()
    target_goal = data.get("target_goal", "High Score & Mastery").strip()

    if not subjects or not isinstance(subjects, list):
        return jsonify({"success": False, "error": "At least one subject is required"}), 400

    if not exam_date:
        return jsonify({"success": False, "error": "Target exam date is required"}), 400

    try:
        result = groq_service.generate_study_plan(
            subjects=subjects,
            exam_date=exam_date,
            daily_hours=daily_hours,
            routine=routine,
            target_goal=target_goal
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"[StudyMind Server] starting on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
