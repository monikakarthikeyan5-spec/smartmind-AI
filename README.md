# AI Study Assistant (StudyMind AI)

A modern, comprehensive, and responsive AI Study Assistant web application powered by **Groq API** (`llama-3.3-70b-versatile` and `llama-3.1-8b-instant`). Built with **HTML5, Vanilla CSS3, JavaScript**, and a **Python Flask** backend.

---

## 🚀 Features & Modules

### 📘 Module 1: Topic Explainer
- **Simple, Pedagogical Explanations:** Enter any subject or topic (e.g., Photosynthesis, Dynamic Programming, Quantum Computing, Black Holes).
- **Rich Pedagogy:** Breaks down complex concepts with:
  - 🌟 The Big Picture (in simple terms, ELI5 option)
  - 💡 Relatable Everyday Analogies & Mental Models
  - ⚙️ Step-by-Step Mechanisms & Formulas
  - 🌍 Concrete Real-World Examples & Applications
  - ⚠️ Common Pitfalls & Misconceptions
  - 🎯 Quick Self-Check Questions
- **Interactive Tools:** One-click Copy, Listen (Text-to-Speech), and "Quiz Me On This" cross-module shortcut.

### 📝 Module 2: Smart Summarizer
- **Dual Mode:** Summarize by topic or paste custom study notes / lecture transcripts.
- **Structured High-Yield Takeaways:**
  - 📌 Executive Summary
  - 🔑 Key Concepts & Definitions
  - 💡 Crucial Formulas & Mechanisms
  - ⚡ High-Yield Exam Takeaways
- **Reading Time & Compression Metrics:** Automatically displays word counts and compression savings percentage.

### 🎯 Module 3: Quiz Generator (Up to 20 Questions)
- **Customizable Question Count:** Slider selection from **1 to 20 questions** (maximum 20 as specified).
- **Difficulty Options:** Beginner, Medium, or Advanced.
- **Interactive Testing Experience:** 
  - Dynamic question stepper with progress bar and visual dot indicators.
  - Option selection with instant feedback states.
- **Post-Quiz Analytics & Review:**
  - Overall score percentage gauge with animated circle and achievement rating.
  - Correct and Wrong answers breakdown.
  - Question-by-question review cards showing **Your Answer**, **Correct Answer**, and an **in-depth pedagogical explanation** for every question.
  - Filter tabs: View **All Questions**, **Correct Answers**, or **Wrong Answers**.
  - Retake Quiz or Generate New Quiz buttons.

### 💡 Module 4: Doubt Solver
- **Conversational Academic Tutor:** Ask any study-related question across any subject (Math, Physics, Chemistry, Computer Science, History, Biology, etc.).
- **Follow-Up Questions Supported:** Preserves conversational dialogue memory so students can ask follow-ups, request simplifications, or ask for additional examples.
- **Formatted Explanations:** Clear mathematical formulas, code blocks, bullet points, and quick suggestion chips.

### 📅 Module 5: Study Planner
- **Customized Daily Routine:** Enter multiple subjects with interactive tag addition/removal.
- **Exam Countdown:** Date picker automatically calculates days remaining until target exams.
- **Time Allocation:** Select available study hours (1 to 10 hours/day), daily rhythm (Morning, Balanced, Night Owl), and prep goals.
- **Actionable Outputs:**
  - Time-boxed 50/10 Pomodoro schedule blocks.
  - Strategic subject time distribution.
  - Milestone roadmap (Foundation, Active Testing, Mock Simulation).
  - Print / Save as PDF support.

---

## 🛠️ Technology Stack

- **Frontend:** HTML5, Modern Vanilla CSS (Glassmorphism, dark/light themes, responsive layout), Vanilla JavaScript.
- **Audio Feedback:** Web Audio API sound synthesis (subtle haptic-style clicks and fanfare chimes).
- **Backend:** Python 3 (Flask, Flask-CORS, python-dotenv).
- **AI Engine:** Groq API (`llama-3.3-70b-versatile`, `llama-3.1-8b-instant`), with an intelligent built-in academic fallback engine for offline resilience.

---

## ⚙️ Setup & Running

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Groq API Key
You can configure your Groq API key in two ways:
- **Option A (In `.env` file):**
  Open `.env` and set:
  ```env
  GROQ_API_KEY=gsk_your_groq_api_key_here
  PORT=5000
  ```
- **Option B (Directly in Web UI):**
  Click the **Key** button in the sidebar footer and paste your Groq API key directly. It connects instantly without requiring a server restart!

### 3. Start the Server
```bash
python app.py
```
Open your browser and navigate to:
```
http://127.0.0.1:5000
```

---

## 🧪 Automated Testing
Run the test suite to verify all endpoints and modules:
```bash
python test_app.py
```
