import requests
import json
import time
import sys

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_URL = "http://127.0.0.1:5000"

def test_ai_study_assistant():
    print("==================================================")
    print("Testing AI Study Assistant - All 5 Modules")
    print("==================================================")

    # 0. Static Assets & HTML
    print("\n0. Testing HTML and Static Assets delivery...")
    html_res = requests.get(f"{BASE_URL}/")
    assert html_res.status_code == 200 and "StudyMind" in html_res.text
    css_res = requests.get(f"{BASE_URL}/static/css/style.css")
    assert css_res.status_code == 200 and len(css_res.text) > 1000
    js_res = requests.get(f"{BASE_URL}/static/js/app.js")
    assert js_res.status_code == 200 and len(js_res.text) > 1000
    print("  HTML, CSS, and JS static assets loaded successfully (200 OK).")

    # 1. API Status
    print("\n1. Testing /api/status...")
    res = requests.get(f"{BASE_URL}/api/status")
    print(f"Status Code: {res.status_code}")
    print(f"Response: {res.json()}")
    assert res.status_code == 200

    # 2. Module 1: Topic Explainer
    print("\n2. Testing Module 1: Topic Explainer (/api/explain)...")
    res = requests.post(f"{BASE_URL}/api/explain", json={
        "topic": "Photosynthesis",
        "level": "Undergraduate / College",
        "style": "Intuitive & Real-World Examples"
    })
    print(f"Status Code: {res.status_code}")
    data = res.json()
    assert res.status_code == 200 and data.get("success") is True
    print(f"Snippet: {data.get('content')[:180]}...\n")

    # 3. Module 2: Smart Summarizer
    print("\n3. Testing Module 2: Smart Summarizer (/api/summarize)...")
    sample_text = (
        "Artificial Intelligence (AI) refers to the simulation of human intelligence in machines "
        "that are programmed to think and learn. The core components of AI include Machine Learning, "
        "Deep Learning, Natural Language Processing, and Computer Vision. Supervised learning requires labeled data, "
        "unsupervised learning finds patterns in unlabeled data, and reinforcement learning learns through rewards and penalties."
    )
    res = requests.post(f"{BASE_URL}/api/summarize", json={
        "content": sample_text,
        "is_topic": False,
        "format_type": "comprehensive"
    })
    print(f"Status Code: {res.status_code}")
    data = res.json()
    assert res.status_code == 200 and data.get("success") is True
    print(f"Summary Snippet: {data.get('summary')[:180]}...\n")

    # 4. Module 3: Quiz Generator (Up to 20 questions)
    print("\n4. Testing Module 3: Quiz Generator (/api/quiz/generate)...")
    res = requests.post(f"{BASE_URL}/api/quiz/generate", json={
        "topic": "Data Structures & Algorithms",
        "count": 5,
        "difficulty": "Medium"
    })
    print(f"Status Code: {res.status_code}")
    data = res.json()
    assert res.status_code == 200 and data.get("success") is True
    qs = data.get("questions", [])
    print(f"Generated {len(qs)} questions:")
    for q in qs[:2]:
        print(f"  Q{q['id']}: {q['question']}")
        print(f"     Answer: {q['correct_option']} - {q['explanation'][:80]}...")

    # 5. Module 4: Doubt Solver (with follow-ups)
    print("\n5. Testing Module 4: Doubt Solver (/api/doubt/ask)...")
    q1 = "Why does ice float on liquid water?"
    res1 = requests.post(f"{BASE_URL}/api/doubt/ask", json={
        "question": q1,
        "history": []
    })
    print(f"Status Code: {res1.status_code}")
    data1 = res1.json()
    assert res1.status_code == 200 and data1.get("success") is True
    print(f"Answer Snippet: {data1.get('answer')[:180]}...")

    # Follow-up test
    q2 = "How does this property of water affect marine life in frozen lakes during winter?"
    res2 = requests.post(f"{BASE_URL}/api/doubt/ask", json={
        "question": q2,
        "history": [
            {"role": "user", "content": q1},
            {"role": "assistant", "content": data1.get("answer")}
        ]
    })
    print(f"Follow-up Status Code: {res2.status_code}")
    data2 = res2.json()
    assert res2.status_code == 200 and data2.get("success") is True
    print(f"Follow-up Answer Snippet: {data2.get('answer')[:180]}...\n")

    # 6. Module 5: Study Planner
    print("\n6. Testing Module 5: Study Planner (/api/planner/generate)...")
    res = requests.post(f"{BASE_URL}/api/planner/generate", json={
        "subjects": ["Calculus", "Physics", "Computer Science"],
        "exam_date": "2026-11-15",
        "daily_hours": 4.0,
        "routine": "Balanced Throughout Day",
        "target_goal": "High Score & Complete Mastery"
    })
    print(f"Status Code: {res.status_code}")
    data = res.json()
    assert res.status_code == 200 and data.get("success") is True
    print(f"Plan Snippet: {data.get('plan')[:180]}...\n")

    print("==================================================")
    print("✅ ALL 5 MODULES PASSED VALIDATION SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    test_ai_study_assistant()
