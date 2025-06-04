
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Dict
from pathlib import Path
import json
import os
from datetime import datetime


app = FastAPI()

# Configuration
DATA_DIR = Path(os.getenv("DATA_DIR", "/app/data"))
QUIZ_DIR = Path(os.getenv("QUIZ_DIR", "/app/quiz_data"))
IMAGES_DIR = Path(os.getenv("IMAGES_DIR", "/app/images"))

# Ensure directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
QUIZ_DIR.mkdir(parents=True, exist_ok=True)
IMAGES_DIR.mkdir(parents=True, exist_ok=True)

# CORS
app.add_middleware(
    CORSMiddleware,
    #allow_origins=["http://localhost:3000"],
    allow_origins=["*"], # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
if IMAGES_DIR.exists():
    app.mount("/NEET-2025-Code-48_extracted_images", StaticFiles(directory=str(IMAGES_DIR)), name="images")
else:
    print(f"❌ Static image folder not found: {IMAGES_DIR}")
    # Fallback to original path for development
    static_path = Path(__file__).parent.parent / "frontend" / "NEET-2025-Code-48_extracted_images"
    if static_path.exists():
        app.mount("/NEET-2025-Code-48_extracted_images", StaticFiles(directory=str(static_path)), name="images")
        print(f"✅ Using fallback image path: {static_path}")
    else:
        print(f"❌ Fallback image folder also not found: {static_path}")

# Models
class StudentAnswer(BaseModel):
    questionNumber: int
    selectedOption: int
    timeSpent: float
    isMarked: bool = False

class QuizSubmission(BaseModel):
    studentName: str
    studentEmail: str
    quizName: str
    answers: List[StudentAnswer]
    totalTimeSpent: str
    submittedAt: str

class QuestionResult(BaseModel):
    questionNumber: int
    questionText: str
    selectedOption: int
    correctAnswer: str
    isCorrect: bool
    timeSpent: float
    isMarked: bool
    options: List[str]

class StudentResult(BaseModel):
    studentName: str
    studentEmail: str
    quizName: str
    totalQuestions: int
    answeredQuestions: int
    correctAnswers: int
    score: float
    timeSpent: str
    submittedAt: str
    detailedResults: List[QuestionResult]

# In-memory storage
student_results: List[StudentResult] = []
results_file = DATA_DIR / "student_results.json"

@app.on_event("startup")
def load_results():
    if results_file.exists():
        with open(results_file, "r", encoding="utf-8") as f:
            for r in json.load(f):
                for d in r["detailedResults"]:
                    if isinstance(d["correctAnswer"], int):
                        d["correctAnswer"] = ["A", "B", "C", "D"][d["correctAnswer"]]
                student_results.append(StudentResult(**r))

def save_results():
    with open(results_file, "w", encoding="utf-8") as f:
        json.dump([r.dict() for r in student_results], f, indent=2)

# Load questions
def load_quiz_questions(quiz_name: str):
    # Try quiz directory first
    path = QUIZ_DIR / f"{quiz_name}.json"
    if not path.exists():
        # Fallback to original path for development
        path = Path(__file__).parent.parent / "frontend" / f"{quiz_name}.json"
        if not path.exists():
            raise HTTPException(status_code=404, detail="Quiz not found")
    
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

# Scoring logic with A/B/C/D comparison
def calculate_score(answers: List[StudentAnswer], questions: List[Dict]):
    q_map = {q["questionNumber"]: q for q in questions}
    correct = 0
    details = []

    for a in answers:
        q = q_map.get(a.questionNumber)
        if not q:
            continue

        correct_raw = q.get("correct_answer", "X")
        correct_letter = (
            ["A", "B", "C", "D"][correct_raw] if isinstance(correct_raw, int) else correct_raw
        )
        selected_letter = ["A", "B", "C", "D"][a.selectedOption] if 0 <= a.selectedOption <= 3 else "X"
        is_correct = correct_letter == selected_letter

        details.append({
            "questionNumber": a.questionNumber,
            "questionText": q.get("questionText", ""),
            "selectedOption": a.selectedOption,
            "correctAnswer": correct_letter,
            "isCorrect": is_correct,
            "timeSpent": a.timeSpent,
            "isMarked": a.isMarked,
            "options": q.get("option_with_images_", [])
        })

    return {
        "correct": correct,
        "total": len(questions),
        "details": details
    }

@app.post("/quiz/submit")
def submit_quiz(data: QuizSubmission):
    questions = load_quiz_questions(data.quizName)
    score_data = calculate_score(data.answers, questions)

    result = StudentResult(
        studentName=data.studentName,
        studentEmail=data.studentEmail,
        quizName=data.quizName,
        totalQuestions=score_data["total"],
        answeredQuestions=len(data.answers),
        correctAnswers=score_data["correct"],
        score=round((score_data["correct"] / score_data["total"]) * 100, 2),
        timeSpent=data.totalTimeSpent,
        submittedAt=data.submittedAt,
        detailedResults=score_data["details"]
    )

    student_results.append(result)
    save_results()

    return {"message": "✅ Submission received", "score": result.score}

@app.get("/teacher/results")
def get_all_results():
    return {
        "results": student_results,
        "totalStudents": len(student_results),
        "summary": {
            "averageScore": round(
                sum(r.score for r in student_results) / len(student_results), 2
            ) if student_results else 0
        }
    }
