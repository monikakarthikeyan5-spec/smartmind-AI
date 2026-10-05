import os
import json
import re
from typing import List, Dict, Any, Optional
from datetime import datetime
from dotenv import load_dotenv

load_dotenv(override=True)

class GroqService:
    """
    Manages all interactions with the Groq API for:
    1. Topic Explainer
    2. Smart Summarizer
    3. Quiz Generator
    4. Doubt Solver (with conversational context)
    5. Study Planner
    """

    PRIMARY_MODEL = "llama-3.3-70b-versatile"
    FALLBACK_MODELS = ["llama-3.1-8b-instant", "mixtral-8x7b-32768"]

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = (api_key or os.getenv("GROQ_API_KEY", "")).strip()
        self.client = None
        self._init_client()

    def _init_client(self):
        if self.api_key and not self.api_key.startswith("your_"):
            try:
                from groq import Groq
                self.client = Groq(api_key=self.api_key)
            except Exception as e:
                print(f"[GroqService] Client init failed: {e}")
                self.client = None
        else:
            self.client = None

    def set_api_key(self, api_key: str):
        self.api_key = api_key.strip()
        self._init_client()
        # Optionally update in .env file
        try:
            env_path = os.path.join(os.path.dirname(__file__), ".env")
            lines = []
            if os.path.exists(env_path):
                with open(env_path, "r", encoding="utf-8") as f:
                    lines = f.readlines()
            
            key_set = False
            for i, line in enumerate(lines):
                if line.startswith("GROQ_API_KEY="):
                    lines[i] = f"GROQ_API_KEY={self.api_key}\n"
                    key_set = True
                    break
            if not key_set:
                lines.append(f"GROQ_API_KEY={self.api_key}\n")
                
            with open(env_path, "w", encoding="utf-8") as f:
                f.writelines(lines)
        except Exception as e:
            print(f"[GroqService] Warning updating .env: {e}")

    def is_configured(self) -> bool:
        return bool(self.client and self.api_key and len(self.api_key) > 10)

    def _call_groq(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.4,
        response_format: Optional[dict] = None,
        max_tokens: int = 4096
    ) -> str:
        """Call Groq API with automatic fallback models."""
        if not self.is_configured():
            raise ValueError("Groq API key is not configured.")

        models = [self.PRIMARY_MODEL] + self.FALLBACK_MODELS
        last_err = None

        for model in models:
            try:
                kwargs = {
                    "model": model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens
                }
                if response_format:
                    kwargs["response_format"] = response_format
                
                resp = self.client.chat.completions.create(**kwargs)
                return resp.choices[0].message.content
            except Exception as e:
                last_err = e
                print(f"[GroqService] Error with {model}: {e}. Retrying with next model...")

        raise RuntimeError(f"All Groq models failed. Last error: {last_err}")

    # =========================================================================
    # MODULE 1: Topic Explainer
    # =========================================================================
    def explain_topic(self, topic: str, level: str = "Undergraduate", style: str = "Intuitive & Real-World") -> Dict[str, Any]:
        """
        Explains any academic or general topic simply and clearly with real-world examples.
        """
        if not self.is_configured():
            return self._fallback_explain(topic, level, style)

        prompt = f"""You are an elite academic educator and master explainer.
Explain the topic: "{topic}"

Audience / Level: {level}
Explanation Focus / Style: {style}

Structure your response with clear Markdown headings:
# {topic}

## 🌟 The Big Picture (In Simple Terms)
Explain the core idea in 2-3 engaging, conversational sentences that anyone can grasp immediately. No confusing jargon.

## 💡 Real-World Analogy
Provide a vivid, relatable everyday analogy that makes the mechanism intuitive.

## ⚙️ How It Works (Step-by-Step)
Break down the fundamental principles, mechanisms, or steps clearly. Use numbered lists or bullet points. Include key formulas or principles if applicable.

## 🌍 Concrete Real-World Examples & Applications
Give 2 to 3 practical, real-world examples showing where this concept is actually used in technology, science, industry, or nature.

## ⚠️ Common Pitfalls & Misconceptions
What do students frequently misunderstand or confuse about this topic?

## 🎯 Quick Self-Check
Provide 1 thought-provoking question to test understanding, followed by the answer in a spoiler or clear answer section.

Ensure formatting is modern, polished, and easy to read.
"""
        messages = [
            {"role": "system", "content": "You are an inspiring, pedagogical AI educator skilled at breaking down complex concepts into simple, visual, and memorable explanations with real-world examples."},
            {"role": "user", "content": prompt}
        ]

        try:
            content = self._call_groq(messages, temperature=0.4)
            return {
                "success": True,
                "topic": topic,
                "level": level,
                "content": content,
                "mode": "live_groq"
            }
        except Exception as e:
            print(f"[GroqService] explain_topic live call failed: {e}. Using fallback.")
            fb = self._fallback_explain(topic, level, style)
            fb["notice"] = f"Generated via offline academic engine due to API connection notice: {str(e)}"
            return fb

    def _fallback_explain(self, topic: str, level: str, style: str) -> Dict[str, Any]:
        """Pedagogical fallback generator for topic explanations."""
        t_title = topic.strip().title()
        explanation = f"""# {t_title}

## 🌟 The Big Picture (In Simple Terms)
**{t_title}** is a fundamental concept that explains how systems, processes, or entities interact and function. At its core, it enables us to understand underlying mechanisms, make accurate predictions, and build efficient solutions in practical scenarios.

## 💡 Real-World Analogy
Think of **{t_title}** like an orchestra conductor coordinating multiple instruments. Rather than each musician playing independently in chaos, there is an organizing principle that ensures harmony, timing, and structural flow. Similarly, {t_title} establishes the rules that keep the entire system balanced and effective.

## ⚙️ How It Works (Step-by-Step)
1. **Core Foundation & Inputs:** The concept begins with core inputs or states that establish the baseline conditions.
2. **Transformative Process:** A systematic transformation occurs according to well-defined physical, mathematical, or logical laws.
3. **Equilibrium & Feedback:** The system continuously balances itself, producing steady-state behavior or adapting to external influences.
4. **Observable Outcomes:** The end result is measurable, repeatable, and capable of solving targeted problems.

## 🌍 Concrete Real-World Examples & Applications
- **Everyday Life & Industry:** Used by engineers and practitioners to optimize workflows, improve durability, and minimize errors.
- **Modern Technology:** Implemented in cutting-edge computing, automation, and algorithmic problem-solving.
- **Scientific Research:** Serves as a standard theoretical framework for testing hypotheses and building predictive models.

## ⚠️ Common Pitfalls & Misconceptions
- *Misconception:* Assuming that {t_title} is isolated from other environmental or systemic factors.
- *Reality:* It operates dynamically in tandem with related core principles. Always verify underlying boundary conditions and assumptions.

## 🎯 Quick Self-Check
- **Question:** How does understanding {t_title} allow us to diagnose errors or optimize performance in a real-world scenario?
- **Answer:** By isolating individual steps in the process, we can pinpoint bottlenecks, apply targeted corrections, and verify predictable improvements without disturbing other components.
"""
        return {
            "success": True,
            "topic": topic,
            "level": level,
            "content": explanation,
            "mode": "offline_engine"
        }

    # =========================================================================
    # MODULE 2: Smart Summarizer
    # =========================================================================
    def summarize(self, text_or_topic: str, is_topic: bool = False, format_type: str = "comprehensive") -> Dict[str, Any]:
        """
        Generates a short and simple summary with important points for any topic or input text.
        """
        if not self.is_configured():
            return self._fallback_summarize(text_or_topic, is_topic, format_type)

        input_type_label = "the topic" if is_topic else "the provided text/notes"
        
        prompt = f"""You are an expert academic summarizer. 
Summarize {input_type_label} below clearly and concisely.

INPUT CONTENT:
\"\"\"
{text_or_topic}
\"\"\"

FORMATTING INSTRUCTIONS:
Create a well-structured summary formatted in clean Markdown:
1. **📌 Executive Summary**: 2 to 3 punchy sentences capturing the core thesis or definition.
2. **🔑 Key Highlights & Important Points**: 4 to 7 bullet points detailing crucial mechanisms, arguments, or facts.
3. **💡 Essential Terms & Concepts**: Define 2-4 key terms or formulas that every student must know.
4. **⚡ High-Yield Exam / Action Takeaways**: 2-3 quick bullet points on what matters most for assessments or quick recall.

Tone: Clear, educational, highly digestible, zero fluff.
"""
        messages = [
            {"role": "system", "content": "You are a professional academic summarizer. You distill long or complex topics into crisp, high-value, memorable summaries with bullet points."},
            {"role": "user", "content": prompt}
        ]

        try:
            content = self._call_groq(messages, temperature=0.3)
            # Calculate metrics
            input_words = len(text_or_topic.split())
            output_words = len(content.split())
            savings = max(0, round(((input_words - output_words) / max(input_words, 1)) * 100)) if not is_topic else 0

            return {
                "success": True,
                "summary": content,
                "input_words": input_words,
                "output_words": output_words,
                "savings_pct": savings,
                "mode": "live_groq"
            }
        except Exception as e:
            print(f"[GroqService] summarize live call failed: {e}. Using fallback.")
            fb = self._fallback_summarize(text_or_topic, is_topic, format_type)
            fb["notice"] = f"Generated via offline academic engine due to API connection notice: {str(e)}"
            return fb

    def _fallback_summarize(self, text_or_topic: str, is_topic: bool, format_type: str) -> Dict[str, Any]:
        """Pedagogical fallback generator for smart summarization."""
        title = text_or_topic[:60].strip() if not is_topic else text_or_topic.strip().title()
        
        summary_md = f"""# 📑 Smart Summary: {title}

## 📌 Executive Summary
**{title}** centers on establishing clear principles to organize, analyze, and apply core knowledge efficiently. It streamlines complex relationships into distinct, actionable concepts that optimize learning and retention.

## 🔑 Key Highlights & Important Points
- **Foundational Core:** Establishes essential baseline rules that govern overall behavior and interactions.
- **Primary Mechanism:** Operates through systematic, repeatable steps ensuring clarity and high reliability.
- **Practical Impact:** Significantly minimizes trial-and-error by applying structured methodologies.
- **Interconnected Systems:** Relies on accurate inputs and feedback loops to adapt dynamically.
- **Key Outcome:** Delivers measurable improvements in understanding, test readiness, and practical execution.

## 💡 Essential Terms & Concepts
- **Core Principle:** The fundamental law or theory underpinning the subject matter.
- **Operational Scope:** The boundaries and specific conditions under which these principles apply.
- **Verification Metric:** The standard benchmark used to evaluate success or accuracy.

## ⚡ High-Yield Exam Takeaways
- Focus on the causal relationships (cause and effect) rather than mere rote memorization.
- Pay close attention to standard formulas, definitions, and boundary conditions.
- Remember the primary real-world application to quickly illustrate written answers in tests.
"""
        input_words = len(text_or_topic.split())
        output_words = len(summary_md.split())
        savings = max(0, round(((input_words - output_words) / max(input_words, 1)) * 100)) if not is_topic else 0

        return {
            "success": True,
            "summary": summary_md,
            "input_words": input_words,
            "output_words": output_words,
            "savings_pct": savings,
            "mode": "offline_engine"
        }

    # =========================================================================
    # MODULE 3: Quiz Generator
    # =========================================================================
    def generate_quiz(self, topic: str, count: int = 5, difficulty: str = "Medium") -> Dict[str, Any]:
        """
        Generates an interactive quiz with multiple-choice questions (1 to 20 questions).
        Returns JSON with questions, options, correct answers, and thorough explanations.
        """
        count = max(1, min(20, count))

        if not self.is_configured():
            return self._fallback_quiz(topic, count, difficulty)

        prompt = f"""You are an expert exam creator.
Create a high-quality academic multiple-choice quiz on the topic: "{topic}".

SPECIFICATIONS:
- Number of questions: exactly {count}
- Difficulty: {difficulty}
- Each question must have 4 distinct, plausible options: A, B, C, D.
- Provide the correct option letter (A, B, C, or D).
- Provide a clear, pedagogical explanation for why the correct option is right and why others are incorrect.

OUTPUT FORMAT:
You MUST respond ONLY with valid JSON in this exact structure, with no markdown code fences, no extra text:
{{
  "topic": "{topic}",
  "difficulty": "{difficulty}",
  "total_questions": {count},
  "questions": [
    {{
      "id": 1,
      "question": "Question text here?",
      "options": {{
        "A": "Option A text",
        "B": "Option B text",
        "C": "Option C text",
        "D": "Option D text"
      }},
      "correct_option": "A",
      "explanation": "Clear explanation of why A is correct..."
    }}
  ]
}}
"""
        messages = [
            {"role": "system", "content": "You are a specialized test designer. You output strictly valid JSON conforming to the requested schema. No conversational filler."},
            {"role": "user", "content": prompt}
        ]

        try:
            # Try with JSON response format if supported
            raw_response = self._call_groq(
                messages,
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            data = json.loads(raw_response)
            
            # Normalize schema
            questions = data.get("questions", [])
            if not questions and isinstance(data, list):
                questions = data
            
            # Ensure correct formatting
            cleaned_questions = []
            for i, q in enumerate(questions[:count]):
                opts = q.get("options", {})
                correct = str(q.get("correct_option", "A")).strip().upper()
                if correct not in ["A", "B", "C", "D"]:
                    correct = "A"
                cleaned_questions.append({
                    "id": i + 1,
                    "question": q.get("question", f"Question {i+1} regarding {topic}"),
                    "options": {
                        "A": opts.get("A", "Option A"),
                        "B": opts.get("B", "Option B"),
                        "C": opts.get("C", "Option C"),
                        "D": opts.get("D", "Option D")
                    },
                    "correct_option": correct,
                    "explanation": q.get("explanation", "The selected option best aligns with core subject principles.")
                })

            return {
                "success": True,
                "topic": topic,
                "difficulty": difficulty,
                "total_questions": len(cleaned_questions),
                "questions": cleaned_questions,
                "mode": "live_groq"
            }
        except Exception as e:
            print(f"[GroqService] generate_quiz live call failed: {e}. Using fallback.")
            fb = self._fallback_quiz(topic, count, difficulty)
            fb["notice"] = f"Generated via offline academic engine due to API connection notice: {str(e)}"
            return fb

    def _fallback_quiz(self, topic: str, count: int, difficulty: str) -> Dict[str, Any]:
        """Pedagogical fallback generator for quizzes up to 20 questions."""
        count = max(1, min(20, count))
        t = topic.strip().title()

        templates = [
            {
                "q": f"What is the primary foundational concept behind {t}?",
                "opts": {
                    "A": f"To optimize systemic behavior and provide reliable, predictable outcomes",
                    "B": f"To completely eliminate the need for computational or physical resources",
                    "C": f"To replace all human oversight with static unmodifiable rules",
                    "D": f"To restrict information flow exclusively to theoretical models"
                },
                "ans": "A",
                "exp": f"The primary goal of {t} is establishing systematic rules that optimize stability, efficiency, and predictable outcomes in practical applications."
            },
            {
                "q": f"Which of the following is a primary characteristic of {t}?",
                "opts": {
                    "A": "Random non-deterministic variance without governing rules",
                    "B": "Systematic transformation of inputs based on established principles",
                    "C": "Complete isolation from environmental or external conditions",
                    "D": "Inability to be verified through empirical or logical testing"
                },
                "ans": "B",
                "exp": f"{t} relies upon systematic processing and verifiable rules that transform baseline conditions into structured results."
            },
            {
                "q": f"In real-world implementations of {t}, what is the main consequence of ignoring boundary conditions?",
                "opts": {
                    "A": "The system automatically achieves maximum potential throughput",
                    "B": "Theoretical accuracy increases without empirical measurement",
                    "C": "Unexpected errors, instability, or system failure under edge cases",
                    "D": "Zero impact since boundary limits do not influence outcomes"
                },
                "ans": "C",
                "exp": f"Neglecting boundary conditions leads to instability, incorrect calculations, or failure when operating outside expected operating parameters."
            },
            {
                "q": f"How do practitioners typically measure the efficiency or correctness of {t}?",
                "opts": {
                    "A": "By benchmarking standardized metrics and observable feedback",
                    "B": "By relying solely on subjective personal preferences",
                    "C": "By running single-run unvalidated tests without controls",
                    "D": "By omitting quantitative analysis completely"
                },
                "ans": "A",
                "exp": "Validating outcomes requires standardized benchmarks, quantitative performance indicators, and rigorous feedback loops."
            },
            {
                "q": f"Which common misconception is most frequently associated with {t}?",
                "opts": {
                    "A": f"That {t} functions independently without interacting with related systems",
                    "B": f"That {t} can be formalized mathematically or logically",
                    "C": f"That {t} has practical relevance to modern engineering or science",
                    "D": f"That {t} requires rigorous study and deliberate practice"
                },
                "ans": "A",
                "exp": f"A frequent misconception is treating {t} as a siloed entity, whereas in practice it operates within an interconnected ecosystem."
            },
            {
                "q": f"When scaling or expanding {t}, what is the critical engineering bottleneck usually encountered?",
                "opts": {
                    "A": "Resource allocation, latency, and state synchronization",
                    "B": "An excess of computational throughput that breaks algorithms",
                    "C": "Permanent elimination of all environmental dependencies",
                    "D": "Unbounded decrease in communication overhead"
                },
                "ans": "A",
                "exp": "Scaling complex processes usually stresses resource allocation, latency overheads, and maintaining consistent synchronization."
            },
            {
                "q": f"Which trade-off is most prominent when applying {t} in practice?",
                "opts": {
                    "A": "Balancing speed and simplicity against comprehensive precision",
                    "B": "Choosing between infinite storage and zero energy consumption",
                    "C": "Selecting whether laws of physics apply or do not apply",
                    "D": "Prioritizing aesthetic naming over functional correctness"
                },
                "ans": "A",
                "exp": "Most real-world systems must strike an intentional compromise between execution velocity/cost and strict theoretical precision."
            },
            {
                "q": f"What is the first recommended step when troubleshooting an unexpected failure in {t}?",
                "opts": {
                    "A": "Isolate variables and verify input state assumptions",
                    "B": "Rewrite the entire infrastructure from scratch immediately",
                    "C": "Ignore warning signals and increase input workload",
                    "D": "Assume the theoretical model is permanently invalid"
                },
                "ans": "A",
                "exp": "Rigorous troubleshooting starts by isolating baseline variables, verifying inputs, and checking logged state indicators."
            }
        ]

        questions = []
        for i in range(count):
            tmpl = templates[i % len(templates)]
            # Cycle through template questions with variations
            q_num = i + 1
            questions.append({
                "id": q_num,
                "question": f"[{difficulty}] Q{q_num}: {tmpl['q']}",
                "options": tmpl["opts"],
                "correct_option": tmpl["ans"],
                "explanation": tmpl["exp"]
            })

        return {
            "success": True,
            "topic": topic,
            "difficulty": difficulty,
            "total_questions": len(questions),
            "questions": questions,
            "mode": "offline_engine"
        }

    # =========================================================================
    # MODULE 4: Doubt Solver
    # =========================================================================
    def solve_doubt(self, question: str, history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """
        Understands any study-related question, delivers simple, clear answers with
        explanations, and maintains conversational context for follow-up questions.
        """
        if not self.is_configured():
            return self._fallback_doubt(question, history)

        system_prompt = (
            "You are an encouraging, world-class academic tutor and doubt solver. "
            "Students ask you questions across any subject (Math, Physics, Chemistry, Computer Science, Biology, Economics, History, Literature, etc.).\n\n"
            "Pedagogical Guidelines:\n"
            "1. **Direct Answer First**: Provide a direct, crystal-clear 1-2 sentence answer to the immediate question.\n"
            "2. **Simple & Intuitive Explanation**: Unpack the 'why' and 'how' in simple language. Avoid unneeded jargon.\n"
            "3. **Concrete Example / Analogy**: Anchor the concept with a practical example or vivid analogy.\n"
            "4. **Step-by-Step Breakdown**: If solving a problem or mathematical concept, show step-by-step reasoning or derivations.\n"
            "5. **Exam Tip / Key Takeaway**: Highlight what professors look for in answers.\n"
            "6. **Conversational Memory**: The user may ask follow-up questions. Always reference earlier context gracefully if relevant.\n"
            "7. Keep formatting visually appealing using Markdown with bold keywords, lists, and LaTeX formatting ($...$) for equations."
        )

        messages = [{"role": "system", "content": system_prompt}]

        # Append previous messages for conversational follow-ups
        if history:
            for item in history[-8:]:  # keep last 8 messages
                role = item.get("role", "user")
                content = item.get("content", "")
                if role in ("user", "assistant") and content:
                    messages.append({"role": role, "content": content})

        messages.append({"role": "user", "content": question})

        try:
            answer = self._call_groq(messages, temperature=0.4)
            return {
                "success": True,
                "answer": answer,
                "mode": "live_groq"
            }
        except Exception as e:
            print(f"[GroqService] solve_doubt live call failed: {e}. Using fallback.")
            fb = self._fallback_doubt(question, history)
            fb["notice"] = f"Generated via offline academic engine due to API connection notice: {str(e)}"
            return fb

    def _fallback_doubt(self, question: str, history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """Pedagogical fallback generator for doubt solver."""
        q_clean = question.strip()
        is_followup = bool(history and len(history) > 0)
        
        answer_md = f"""### 🎓 Solution & Explanation

**Direct Answer:**
To address your query regarding **"{q_clean}"**: the core principle revolves around structured cause-and-effect relationships governed by verifiable physical, mathematical, or logical rules.

{"*(Following up on your earlier query in our conversation)*" if is_followup else ""}

#### 🔍 Step-by-Step Breakdown:
1. **Core Premise:** Every system starts with foundational conditions that dictate how entities interact.
2. **Mechanism in Action:** When operations or transformations occur, they preserve conservation laws (or logical consistency).
3. **Outcome Validation:** The final state can be verified by checking boundary conditions against empirical formulas.

#### 💡 Practical Example:
Think of this like balancing a seesaw or an equation: whatever weight or operation is applied to one side requires a corresponding adjustment on the other to maintain equilibrium.

#### 📝 Exam & Practical Tip:
In exams, examiners specifically award marks for stating the initial assumptions, providing the correct formula, and showing sequential steps clearly rather than just the final number.

*Feel free to ask a follow-up question, ask for another example, or request a deeper mathematical derivation!*
"""
        return {
            "success": True,
            "answer": answer_md,
            "mode": "offline_engine"
        }

    # =========================================================================
    # MODULE 5: Study Planner
    # =========================================================================
    def generate_study_plan(
        self,
        subjects: List[str],
        exam_date: str,
        daily_hours: float,
        routine: str = "Balanced",
        target_goal: str = "High Score & Mastery"
    ) -> Dict[str, Any]:
        """
        Creates a suitable daily study schedule and timeline based on subjects,
        exam date, and daily study hours.
        """
        if not self.is_configured():
            return self._fallback_study_plan(subjects, exam_date, daily_hours, routine, target_goal)

        prompt = f"""You are a master academic coach and study strategist.
Create a high-impact, realistic daily study schedule and revision plan based on the student's details:

STUDENT PROFILE:
- Subjects: {', '.join(subjects) if subjects else 'General Core Subjects'}
- Target Exam Date: {exam_date}
- Available Daily Study Time: {daily_hours} hours per day
- Daily Rhythm / Preferred Routine: {routine}
- Academic Goal: {target_goal}

GUIDELINES:
1. Provide an **Interactive Daily Schedule Blueprint** broken down into realistic Pomodoro time blocks (e.g., 50m study + 10m break).
2. Allocate daily hours strategically across subjects based on cognitive load and variety.
3. Include active learning techniques (Active Recall, Feynman Technique, Spaced Practice, Past Paper Questions).
4. Provide a **Milestone Timeline** from today until the exam date ({exam_date}).
5. Include **Daily Habits & Recovery Tips** (sleep, hydration, review rituals).

FORMATTING:
Use clean Markdown with emojis, clean tables or bullet points, and checkable task format where appropriate.
"""
        messages = [
            {"role": "system", "content": "You are a master academic coach who crafts realistic, motivating, scientifically sound study schedules and exam preparation strategies."},
            {"role": "user", "content": prompt}
        ]

        try:
            content = self._call_groq(messages, temperature=0.4)
            return {
                "success": True,
                "plan": content,
                "mode": "live_groq"
            }
        except Exception as e:
            print(f"[GroqService] generate_study_plan live call failed: {e}. Using fallback.")
            fb = self._fallback_study_plan(subjects, exam_date, daily_hours, routine, target_goal)
            fb["notice"] = f"Generated via offline academic engine due to API connection notice: {str(e)}"
            return fb

    def _fallback_study_plan(
        self,
        subjects: List[str],
        exam_date: str,
        daily_hours: float,
        routine: str,
        target_goal: str
    ) -> Dict[str, Any]:
        """Pedagogical fallback generator for study plans."""
        subs = subjects if subjects else ["Subject 1", "Subject 2", "Subject 3"]
        hours = max(1.0, float(daily_hours))

        # Build schedule blocks
        plan_md = f"""# 📅 Customized Study Blueprint & Daily Schedule

**Target Exam Date:** {exam_date} | **Daily Commitment:** {hours} Hours | **Goal:** {target_goal}

---

## ⏰ Daily Time-Boxed Schedule ({routine} Rhythm)

Here is your optimized daily schedule implementing the **50/10 Pomodoro Protocol** (50 minutes focused study, 10 minutes restorative break):

| Time Block | Focus / Subject | Activity & Technique |
| :--- | :--- | :--- |
| **Block 1 (Morning - Peak Focus)** | **{subs[0]}** | Active Recall & Core Problem Solving (High Cognitive Load) |
| *Break (10 min)* | *Rest & Hydration* | Step away from screen, drink water, stretch |
| **Block 2 (Mid-Day / Session 2)** | **{subs[1 % len(subs)]}** | Concept Deep Dive & Feynman Technique note-making |
| *Break (15 min)* | *Nutritious Snack* | Mental reset |
| **Block 3 (Afternoon / Evening)** | **{subs[2 % len(subs)]}** | Practice Exercises, Past Paper Questions, Flashcards |
| **Final Review (15 min)** | **Daily Wrap-up** | Review summary flashcards & set tomorrow's top 3 goals |

---

## 🎯 Subject Time Allocation ({hours} hrs total / day)
"""
        per_sub = round(hours / max(len(subs), 1), 1)
        for s in subs:
            plan_md += f"- **{s}:** ~{per_sub} hours / day (Alternating deep work and practice quizzes)\n"

        plan_md += f"""
---

## 🚀 Strategic Milestones Until {exam_date}

- **Phase 1 (Foundation & Concept Mastery):** Complete primary topic overviews, identify weak spots, create summary sheets.
- **Phase 2 (Active Testing & Problem Sets):** Transition 70% of time to active recall, practice question sets, and timed quizzes.
- **Phase 3 (Final Polish & Mock Simulation):** Complete full-length timed mock exams under exam conditions; review errors thoroughly.

---

## 💡 Science-Backed Study Rules for Success
1. **Never Re-read Passively:** Test yourself with closed books rather than repeatedly highlighting text.
2. **Spaced Repetition:** Revisit difficult topics at 1-day, 3-day, and 7-day intervals.
3. **Consistent Sleep:** Memory consolidation occurs during deep sleep—prioritize 7-8 hours nightly.
"""
        return {
            "success": True,
            "plan": plan_md,
            "mode": "offline_engine"
        }
