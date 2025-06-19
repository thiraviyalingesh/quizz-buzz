
from fastapi import FastAPI, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
from pathlib import Path
import json
import os
from datetime import datetime
from pymongo import MongoClient
from dotenv import load_dotenv
import bcrypt
from bson import ObjectId


# Load environment variables
load_dotenv()

app = FastAPI()

# Configuration
DATA_DIR = Path(os.getenv("DATA_DIR", "/app/data"))
QUIZ_DIR = Path(os.getenv("QUIZ_DIR", "/app/quiz_data"))
IMAGES_DIR = Path(os.getenv("IMAGES_DIR", "/app/images"))

# MongoDB Configuration
MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE")

# Initialize MongoDB client
mongo_client = None
db = None

if MONGODB_URI and MONGODB_DATABASE:
    try:
        mongo_client = MongoClient(MONGODB_URI)
        db = mongo_client[MONGODB_DATABASE]
        print(f"✅ Connected to MongoDB: {MONGODB_DATABASE}")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
else:
    print("⚠️ MongoDB credentials not found in environment variables")

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

# Mount static files for React frontend
static_build_dir = Path("/app/static")
if static_build_dir.exists():
    # Mount the entire static directory
    app.mount("/static", StaticFiles(directory=str(static_build_dir / "static")), name="react_static")
    print(f"✅ Serving React static files from: {static_build_dir}/static")
    
    # Also serve root level assets (favicon, manifest, etc.)
    app.mount("/assets", StaticFiles(directory=str(static_build_dir)), name="assets")
    print(f"✅ Serving React assets from: {static_build_dir}")
else:
    print(f"❌ React build directory not found: {static_build_dir}")

# Mount quiz data files
if QUIZ_DIR.exists():
    app.mount("/quiz_data", StaticFiles(directory=str(QUIZ_DIR)), name="quiz_data")
    print(f"✅ Serving quiz data from: {QUIZ_DIR}")
else:
    print(f"❌ Quiz data folder not found: {QUIZ_DIR}")
    # Fallback to original path for development
    quiz_fallback_path = Path(__file__).parent.parent / "quiz_data"
    if quiz_fallback_path.exists():
        app.mount("/quiz_data", StaticFiles(directory=str(quiz_fallback_path)), name="quiz_data")
        print(f"✅ Using fallback quiz data path: {quiz_fallback_path}")

# Mount images directory - serve all image subdirectories
if IMAGES_DIR.exists():
    app.mount("/images", StaticFiles(directory=str(IMAGES_DIR)), name="images")
    print(f"✅ Serving images from: {IMAGES_DIR}")
else:
    print(f"❌ Static image folder not found: {IMAGES_DIR}")
    # Fallback to original path for development
    static_path = Path(__file__).parent.parent / "images"
    if static_path.exists():
        app.mount("/images", StaticFiles(directory=str(static_path)), name="images")
        print(f"✅ Using fallback image path: {static_path}")
    else:
        print(f"❌ Fallback image folder also not found: {static_path}")

# Models
class AdminLoginRequest(BaseModel):
    email: str
    password: str

# New Exam Submission Models
class ExamStudentSubmission(BaseModel):
    name: str
    class_name: str
    section: str
    submitted_at: str
    score: int
    total: int
    percentage: float
    answers: List[Dict]  # Detailed answer breakdown

class ExamSession(BaseModel):
    exam_id: str
    quiz_id: str
    quiz_name: str
    created_at: str
    admin_id: str
    admin_email: str
    link_id: str
    correct_answers: Dict  # Original quiz JSON with correct answers
    students: List[ExamStudentSubmission]
    total_students: int
    
class ExamListResponse(BaseModel):
    exam_id: str
    quiz_name: str  
    created_at: str
    total_students: int
    admin_name: str

class AdminLoginResponse(BaseModel):
    email: str
    name: str
    plan_name: str
    student_limit: int
    token: Optional[str] = None

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

# Quiz links storage with student limits
quiz_links_storage = {}  # {link_id: {"max_allowed": int, "current_count": int, "students": []}}

@app.on_event("startup")
def load_results():
    # Clear old results on each startup - start fresh every run
    print("🔄 Clearing old results and starting fresh...")
    global student_results, quiz_links_storage
    student_results = []
    quiz_links_storage = {}
    
    # Ensure data directory exists and create fresh empty file
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(results_file, "w", encoding="utf-8") as f:
        json.dump([], f)
    print("✅ Fresh results file created - old data cleared")

def save_results():
    with open(results_file, "w", encoding="utf-8") as f:
        json.dump([r.dict() for r in student_results], f, indent=2)

# New MongoDB Exam Session Functions
def create_exam_session(quiz_id: str, admin_id: str, admin_email: str, link_id: str, questions: List[Dict]):
    """Create a new exam session in MongoDB"""
    if db is None:
        print("⚠️ MongoDB not available, skipping exam session creation")
        return None
        
    try:
        # Generate unique exam_id with timestamp
        now = datetime.utcnow()
        exam_id = f"{quiz_id}_{now.strftime('%Y-%m-%d_%H-%M')}"
        
        # Get admin name from database
        admin_user = db.admin_users.find_one({"_id": ObjectId(admin_id)})
        admin_name = admin_user.get("name", "Unknown Admin") if admin_user else "Unknown Admin"
        
        exam_session = {
            "exam_id": exam_id,
            "quiz_id": quiz_id,
            "quiz_name": quiz_id.replace("-", " ").title(),
            "created_at": now.isoformat(),
            "admin_id": admin_id,
            "admin_email": admin_email,
            "admin_name": admin_name,
            "link_id": link_id,
            "correct_answers": {
                "questions": questions,
                "total_questions": len(questions)
            },
            "students": [],
            "total_students": 0
        }
        
        result = db.exam_submissions.insert_one(exam_session)
        print(f"✅ Created exam session: {exam_id}")
        return exam_id
        
    except Exception as e:
        print(f"❌ Error creating exam session: {e}")
        return None

def add_student_to_exam(exam_id: str, student_data: Dict):
    """Add a student submission to an existing exam session"""
    if db is None:
        print("⚠️ MongoDB not available, skipping student addition")
        return False
        
    try:
        # Add student to the exam session
        result = db.exam_submissions.update_one(
            {"exam_id": exam_id},
            {
                "$push": {"students": student_data},
                "$inc": {"total_students": 1}
            }
        )
        
        if result.modified_count > 0:
            print(f"✅ Added student {student_data['name']} to exam {exam_id}")
            return True
        else:
            print(f"❌ Failed to add student to exam {exam_id}")
            return False
            
    except Exception as e:
        print(f"❌ Error adding student to exam: {e}")
        return False

def get_exam_sessions(admin_email: str = None):
    """Get all exam sessions, optionally filtered by admin"""
    if db is None:
        return []
        
    try:
        query = {}
        if admin_email:
            query["admin_email"] = admin_email
            
        sessions = list(db.exam_submissions.find(query).sort("created_at", -1))
        
        # Convert ObjectId to string for JSON serialization
        for session in sessions:
            session["_id"] = str(session["_id"])
            
        return sessions
        
    except Exception as e:
        print(f"❌ Error fetching exam sessions: {e}")
        return []

def get_exam_session_by_id(exam_id: str):
    """Get a specific exam session with all student data"""
    if db is None:
        return None
        
    try:
        session = db.exam_submissions.find_one({"exam_id": exam_id})
        if session:
            session["_id"] = str(session["_id"])
            return session
        return None
        
    except Exception as e:
        print(f"❌ Error fetching exam session {exam_id}: {e}")
        return None

# Load questions - Dynamic quiz file loading
def load_quiz_questions(quiz_name: str):
    """
    Dynamically load quiz questions from source directories
    Searches multiple locations for the same quiz name
    """
    # Search paths in priority order
    search_paths = [
        QUIZ_DIR / f"{quiz_name}.json",                                    # /app/quiz_data/
        Path(__file__).parent.parent / "quiz_data" / f"{quiz_name}.json",  # /quiz_data/
        Path(__file__).parent.parent / "frontend" / "public" / "quiz_data" / f"{quiz_name}.json",  # /frontend/public/quiz_data/
        Path(__file__).parent.parent / f"{quiz_name}.json"                 # Root directory
    ]
    
    for path in search_paths:
        if path.exists():
            print(f"✅ Found quiz file: {path}")
            with open(path, "r", encoding="utf-8") as f:
                quiz_data = json.load(f)
                print(f"✅ Loaded {len(quiz_data)} questions from {quiz_name}.json")
                return quiz_data
    
    # If no file found, list available files for debugging
    print(f"❌ Quiz file '{quiz_name}.json' not found in any location")
    print("📁 Available quiz files:")
    for search_path in search_paths:
        if search_path.parent.exists():
            for file in search_path.parent.glob("*.json"):
                print(f"   - {file.name}")
    
    raise HTTPException(status_code=404, detail=f"Quiz '{quiz_name}' not found")

# Enhanced scoring logic with detailed validation
def calculate_score(answers: List[StudentAnswer], questions: List[Dict], quiz_name: str):
    """
    Calculate detailed score with proper answer validation
    """
    print(f"🔍 Starting score calculation for {quiz_name}")
    print(f"📝 Student submitted {len(answers)} answers")
    print(f"📋 Source quiz has {len(questions)} questions")
    
    q_map = {q["questionNumber"]: q for q in questions}
    correct_count = 0
    wrong_count = 0
    unanswered_count = 0
    details = []

    # Check all questions from source
    for q in questions:
        question_num = q["questionNumber"]
        
        # Find student's answer for this question
        student_answer = next((a for a in answers if a.questionNumber == question_num), None)
        
        if not student_answer:
            # Student didn't answer this question
            unanswered_count += 1
            details.append({
                "questionNumber": question_num,
                "questionText": q.get("questionText", ""),
                "selectedOption": -1,  # -1 means not answered
                "selectedLetter": "NOT ANSWERED",
                "correctAnswer": q.get("correct_answer", "X"),
                "correctLetter": ["A", "B", "C", "D"][q.get("correct_answer", 0)] if isinstance(q.get("correct_answer"), int) else q.get("correct_answer", "X"),
                "isCorrect": False,
                "status": "UNANSWERED",
                "timeSpent": 0,
                "isMarked": False,
                "options": q.get("option_with_images_", [])
            })
            continue
        
        # Get correct answer from source JSON
        correct_raw = q.get("correct_answer", "X")
        correct_letter = (
            ["A", "B", "C", "D"][correct_raw] if isinstance(correct_raw, int) else str(correct_raw)
        )
        
        # Get student's selected answer
        if 0 <= student_answer.selectedOption <= 3:
            selected_letter = ["A", "B", "C", "D"][student_answer.selectedOption]
        else:
            selected_letter = "INVALID"
        
        # Validate answer
        is_correct = (correct_letter == selected_letter)
        
        if is_correct:
            correct_count += 1
            status = "CORRECT"
        else:
            wrong_count += 1
            status = "WRONG"

        details.append({
            "questionNumber": question_num,
            "questionText": q.get("questionText", ""),
            "selectedOption": student_answer.selectedOption,
            "selectedLetter": selected_letter,
            "correctAnswer": correct_raw,
            "correctLetter": correct_letter,
            "isCorrect": is_correct,
            "status": status,
            "timeSpent": student_answer.timeSpent,
            "isMarked": student_answer.isMarked,
            "options": q.get("option_with_images_", [])
        })
        
        print(f"Q{question_num}: Student={selected_letter}, Correct={correct_letter}, Result={status}")

    total_questions = len(questions)
    percentage = round((correct_count / total_questions) * 100, 2) if total_questions > 0 else 0
    
    print(f"📊 FINAL SCORE:")
    print(f"   ✅ Correct: {correct_count}")
    print(f"   ❌ Wrong: {wrong_count}")
    print(f"   ⚪ Unanswered: {unanswered_count}")
    print(f"   📈 Percentage: {percentage}%")

    return {
        "correct": correct_count,
        "wrong": wrong_count,
        "unanswered": unanswered_count,
        "total": total_questions,
        "percentage": percentage,
        "details": details
    }

@app.post("/quiz/submit")
def submit_quiz(data: QuizSubmission):
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not available")
    
    questions = load_quiz_questions(data.quizName)
    score_data = calculate_score(data.answers, questions, data.quizName)

    # Create individual submission document
    submission_doc = {
        "quiz_json_name": data.quizName,
        "admin_email": "system@admin.com",  # Regular quizzes go to system admin
        "student_name": data.studentName,
        "student_email": data.studentEmail,
        "total_questions": score_data["total"],
        "answered_questions": len(data.answers),
        "correct_answers": score_data["correct"],
        "wrong_answers": score_data["wrong"],
        "unanswered": score_data["unanswered"],
        "score": round((score_data["correct"] / score_data["total"]) * 100, 2),
        "percentage": score_data["percentage"],
        "time_spent": data.totalTimeSpent,
        "submitted_at": data.submittedAt,
        "timestamp": datetime.utcnow(),
        "detailed_results": score_data["details"],
        "answers": [answer.dict() for answer in data.answers]
    }

    try:
        # Save individual submission to MongoDB
        db.exam_submissions.insert_one(submission_doc)
        print(f"✅ Saved submission for {data.studentName} - Quiz: {data.quizName}")
        
        # Also save to JSON for backward compatibility
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
        
    except Exception as e:
        print(f"❌ Error saving submission: {e}")
        raise HTTPException(status_code=500, detail="Failed to save submission")

    return {"message": "✅ Submission received", "score": submission_doc["score"]}

@app.post("/admin/login")
def admin_login(login_data: AdminLoginRequest):
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not available")
    
    try:
        # Find admin user by email
        admin_user = db.admin_users.find_one({"email": login_data.email})
        
        if not admin_user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Check if user is active
        if not admin_user.get("is_active", False):
            raise HTTPException(status_code=401, detail="Account is inactive")
        
        # Verify password
        password_bytes = login_data.password.encode('utf-8')
        stored_hash = admin_user["password_hash"]
        
        if isinstance(stored_hash, str):
            stored_hash = stored_hash.encode('utf-8')
        
        if not bcrypt.checkpw(password_bytes, stored_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Get plan information
        plan = db.plans.find_one({"_id": admin_user["plan_id"]})
        
        if not plan:
            raise HTTPException(status_code=500, detail="Plan not found")
        
        # Return admin data with plan info
        return AdminLoginResponse(
            email=admin_user["email"],
            name=admin_user["name"],
            plan_name=plan["name"].upper(),
            student_limit=plan["student_limit"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

# Add missing models for generate-link
class GenerateLinkRequest(BaseModel):
    quiz_id: str

class GenerateLinkResponse(BaseModel):
    link_id: str
    link_url: str
    quiz_json_file: str
    max_allowed: int

@app.post("/admin/generate-link")
def generate_quiz_link(request: GenerateLinkRequest, admin_email: str = Header(..., alias="X-Admin-Email"), http_request: Request = None):
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not available")
    
    try:
        # Find admin user by email to get their plan dynamically
        admin_user = db.admin_users.find_one({"email": admin_email})
        if not admin_user:
            raise HTTPException(status_code=401, detail="Admin not found")
        
        # Get admin's plan from DB dynamically
        plan = db.plans.find_one({"_id": admin_user["plan_id"]})
        if not plan:
            raise HTTPException(status_code=500, detail="Plan not found")
        
        # Use dynamic student limit from database
        max_students = plan.get("max_students", plan.get("student_limit", 1))
        
        # Load quiz questions to store in exam session
        questions = load_quiz_questions(request.quiz_id)
        
        # Generate unique link with dynamic limit
        import secrets
        link_id = secrets.token_urlsafe(8)
        
        # Create exam session in MongoDB
        exam_id = create_exam_session(
            quiz_id=request.quiz_id,
            admin_id=str(admin_user["_id"]),
            admin_email=admin_email,
            link_id=link_id,
            questions=questions
        )
        
        # Store link with dynamic tracking (keep in-memory for quick access)
        quiz_links_storage[link_id] = {
            "max_allowed": max_students,
            "current_count": 0,
            "students": [],
            "quiz_id": request.quiz_id,
            "admin_id": str(admin_user["_id"]),
            "admin_email": admin_email,
            "plan_name": plan["name"],
            "exam_id": exam_id  # Link to MongoDB exam session
        }
        
        print(f"✅ Generated quiz link {link_id} for admin {admin_user['name']} with {max_students} student limit ({plan['name']} plan)")
        print(f"✅ Created exam session: {exam_id}")
        
        # Generate URL based on the request's host (works with tunnels)
        base_url = f"{http_request.url.scheme}://{http_request.url.netloc}" if http_request else "http://localhost:8080"
        
        return GenerateLinkResponse(
            link_id=link_id,
            link_url=f"{base_url}/quiz/{link_id}",
            quiz_json_file=f"{request.quiz_id}.json",
            max_allowed=max_students
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Generate link error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate quiz link")

@app.get("/api/quiz/{link_id}")
def get_quiz_by_link(link_id: str):
    # Check if link exists and validate access
    if link_id not in quiz_links_storage:
        raise HTTPException(status_code=404, detail="Quiz link not found or expired")
    
    link_data = quiz_links_storage[link_id]
    
    # Check if max students reached
    if link_data["current_count"] >= link_data["max_allowed"]:
        raise HTTPException(
            status_code=403, 
            detail=f"Maximum student limit reached ({link_data['current_count']}/{link_data['max_allowed']})"
        )
    
    # Load quiz questions - use the specific quiz from the link
    try:
        questions = load_quiz_questions(link_data["quiz_id"])
        print(f"✅ Loaded quiz questions from {link_data['quiz_id']}.json")
    except:
        # Fallback to default quiz files if specific quiz not found
        quiz_files = ["NEET-2025-Code-48", "JEE", "7th std Maths", "7th std Science"]
        questions = None
        
        for quiz_file in quiz_files:
            try:
                questions = load_quiz_questions(quiz_file)
                print(f"⚠️ Using fallback quiz file: {quiz_file}.json")
                break
            except:
                continue
        
        if not questions:
            raise HTTPException(status_code=404, detail="Quiz questions not found")
    
    print(f"✅ Quiz access granted for link {link_id} - {link_data['current_count']}/{link_data['max_allowed']} students used")
    
    return {
        "link_id": link_id,
        "quiz_id": link_data["quiz_id"],
        "max_allowed": link_data["max_allowed"],
        "current_count": link_data["current_count"],
        "questions": questions,
        "can_access": link_data["current_count"] < link_data["max_allowed"]
    }

# Add missing models for quiz submission
class StudentInfoRequest(BaseModel):
    name: str
    class_name: str
    section: str

class LinkQuizSubmission(BaseModel):
    link_id: str
    name: str
    class_name: str
    section: str
    answers: List[StudentAnswer]
    totalTimeSpent: str

@app.post("/api/quiz/{link_id}/submit")
def submit_quiz_by_link(link_id: str, submission: LinkQuizSubmission):
    # Check if link exists
    if link_id not in quiz_links_storage:
        raise HTTPException(status_code=404, detail="Quiz link not found")
    
    link_data = quiz_links_storage[link_id]
    
    # Check if student already submitted (prevent duplicates)
    student_id = f"{submission.name}_{submission.class_name}_{submission.section}"
    if student_id in [s["id"] for s in link_data["students"]]:
        raise HTTPException(status_code=409, detail="Student has already submitted this quiz")
    
    # Check if max students reached
    if link_data["current_count"] >= link_data["max_allowed"]:
        raise HTTPException(
            status_code=403, 
            detail=f"Maximum student limit reached ({link_data['current_count']}/{link_data['max_allowed']})"
        )
    
    # Load quiz questions for scoring
    questions = load_quiz_questions(link_data["quiz_id"])
    
    # Calculate score with proper validation
    score_data = calculate_score(submission.answers, questions, link_data["quiz_id"])
    
    # Create individual submission document for new MongoDB structure
    submission_doc = {
        "quiz_json_name": link_data["quiz_id"],  # Use the quiz_id from link
        "admin_email": link_data["admin_email"],  # Track which admin generated this link
        "student_name": submission.name,
        "student_email": f"{submission.name}@{submission.class_name}.school",  # Generate email if not provided
        "class_name": submission.class_name,
        "section": submission.section,
        "total_questions": score_data["total"],
        "answered_questions": len(submission.answers),
        "correct_answers": score_data["correct"],
        "wrong_answers": score_data["wrong"],
        "unanswered": score_data["unanswered"],
        "score": round((score_data["correct"] / score_data["total"]) * 100, 2),
        "percentage": score_data["percentage"],
        "time_spent": submission.totalTimeSpent,
        "submitted_at": datetime.utcnow().isoformat(),
        "timestamp": datetime.utcnow(),
        "detailed_results": score_data["details"],
        "answers": [answer.dict() for answer in submission.answers],
        "link_id": link_id  # Track which link was used
    }

    # Save individual submission to MongoDB
    if db is not None:
        try:
            result = db.exam_submissions.insert_one(submission_doc)
            print(f"✅ Saved individual submission to MongoDB:")
            print(f"   📝 Submission ID: {result.inserted_id}")
            print(f"   👤 Student: {submission.name}")
            print(f"   📚 Quiz: '{link_data['quiz_id']}'")
            print(f"   📊 Score: {submission_doc['score']}%")
        except Exception as e:
            print(f"❌ Error saving submission to MongoDB: {e}")
    
    # Update link tracking (in-memory)
    quiz_links_storage[link_id]["current_count"] += 1
    quiz_links_storage[link_id]["students"].append({
        "id": student_id,
        "name": submission.name,
        "class": submission.class_name,
        "section": submission.section,
        "submitted_at": datetime.utcnow().isoformat()
    })
    
    # Also save to DATA folder for backward compatibility
    student_result = {
        "link_id": link_id,
        "quiz_id": link_data["quiz_id"],
        "name": submission.name,
        "class_name": submission.class_name,
        "section": submission.section,
        "score": score_data["correct"],
        "wrong": score_data["wrong"],
        "unanswered": score_data["unanswered"],
        "total_questions": score_data["total"],
        "answered_questions": score_data["correct"] + score_data["wrong"],
        "percentage": score_data["percentage"],
        "answers": [a.dict() for a in submission.answers],
        "time_spent": submission.totalTimeSpent,
        "submitted_at": datetime.utcnow().isoformat()
    }
    
    results_file = DATA_DIR / "student_results.json"
    existing_results = []
    
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    if results_file.exists():
        with open(results_file, "r", encoding="utf-8") as f:
            existing_results = json.load(f)
    
    existing_results.append(student_result)
    
    with open(results_file, "w", encoding="utf-8") as f:
        json.dump(existing_results, f, indent=2, ensure_ascii=False)
    
    current_count = link_data["current_count"]
    max_allowed = link_data["max_allowed"]
    
    print(f"✅ Student {submission.name} ({submission.class_name} {submission.section}) submitted quiz - {current_count}/{max_allowed} students used")
    
    return {
        "message": "✅ Quiz submitted successfully",
        "student_name": submission.name,
        "quiz_name": link_data["quiz_id"],
        "score_breakdown": {
            "correct_answers": score_data["correct"],
            "wrong_answers": score_data["wrong"],
            "unanswered": score_data["unanswered"],
            "total_questions": score_data["total"],
            "percentage": score_data["percentage"]
        },
        "detailed_results": score_data["details"],
        "remaining_slots": max_allowed - current_count
    }

@app.get("/teacher/results")
def get_all_results():
    # Load fresh data from DATA folder to show all results
    all_results = []
    
    # Load regular quiz results from in-memory
    all_results.extend(student_results)
    
    # Load link-based quiz results from DATA folder
    data_results_file = DATA_DIR / "student_results.json"
    if data_results_file.exists():
        try:
            with open(data_results_file, "r", encoding="utf-8") as f:
                link_results = json.load(f)
                print(f"✅ Loaded {len(link_results)} results from DATA folder")
                all_results.extend(link_results)
        except Exception as e:
            print(f"⚠️ Error loading DATA folder results: {e}")
    
    return {
        "results": all_results,
        "totalStudents": len(all_results),
        "summary": {
            "averageScore": round(
                sum(getattr(r, 'score', r.get('score', 0) if isinstance(r, dict) else 0) for r in all_results) / len(all_results), 2
            ) if all_results else 0
        }
    }

# New Exam Management API Endpoints

@app.get("/admin/exams")
def get_admin_exams(admin_email: str = Header(..., alias="X-Admin-Email"), page: int = 1, limit: int = 20):
    """Get all quiz submissions grouped by quiz name for fast loading"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not available")
    
    try:
        # Aggregate submissions by quiz_json_name for fast overview - filter by admin
        pipeline = [
            {
                "$match": {"admin_email": admin_email}  # Only show this admin's submissions
            },
            {
                "$group": {
                    "_id": "$quiz_json_name",
                    "total_submissions": {"$sum": 1},
                    "latest_submission": {"$max": "$timestamp"},
                    "average_score": {"$avg": "$score"},
                    "first_submission": {"$min": "$timestamp"}
                }
            },
            {
                "$sort": {"latest_submission": -1}
            },
            {
                "$skip": (page - 1) * limit
            },
            {
                "$limit": limit
            }
        ]
        
        quiz_groups = list(db.exam_submissions.aggregate(pipeline))
        
        # Import timezone for IST conversion
        from datetime import timezone, timedelta
        ist = timezone(timedelta(hours=5, minutes=30))
        
        exam_list = []
        for group in quiz_groups:
            # Convert timestamps to IST
            latest_ist = None
            first_ist = None
            
            if group["latest_submission"]:
                latest_utc = group["latest_submission"]
                latest_ist = latest_utc.replace(tzinfo=timezone.utc).astimezone(ist).strftime("%d/%m/%Y, %I:%M:%S %p")
            
            if group["first_submission"]:
                first_utc = group["first_submission"]
                first_ist = first_utc.replace(tzinfo=timezone.utc).astimezone(ist).strftime("%d/%m/%Y, %I:%M:%S %p")
            
            exam_list.append({
                "quiz_name": group["_id"],
                "total_submissions": group["total_submissions"],
                "latest_submission": latest_ist,
                "first_submission": first_ist,
                "average_score": round(group["average_score"], 2) if group["average_score"] else 0
            })
        
        # Get total count for pagination
        total_count = len(quiz_groups)
        
        print(f"📊 Found {total_count} quiz groups with submissions")
        
        return {
            "exams": exam_list,
            "total_exams": total_count,
            "page": page,
            "limit": limit,
            "total_pages": (total_count + limit - 1) // limit
        }
        
    except Exception as e:
        print(f"❌ Error fetching admin exams: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch exams")

@app.get("/admin/exam/{quiz_name}")
def get_exam_details(quiz_name: str, admin_email: str = Header(..., alias="X-Admin-Email"), page: int = 1, limit: int = 50):
    """Get all student submissions for a specific quiz with pagination"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not available")
    
    try:
        # URL decode the quiz name to handle special characters
        import urllib.parse
        decoded_quiz_name = urllib.parse.unquote(quiz_name)
        
        print(f"🔍 Looking for quiz: '{decoded_quiz_name}' (original: '{quiz_name}')")
        
        # Get submissions for this quiz with pagination - filter by admin
        query = {
            "quiz_json_name": decoded_quiz_name,
            "admin_email": admin_email  # Only show this admin's submissions
        }
        
        submissions = list(db.exam_submissions.find(query).sort("timestamp", -1).skip((page - 1) * limit).limit(limit))
        
        print(f"📊 Found {len(submissions)} submissions for quiz: {decoded_quiz_name} (admin: {admin_email})")
        
        if not submissions:
            # Also check what quiz names exist for this admin
            existing_quizzes = list(db.exam_submissions.distinct("quiz_json_name", {"admin_email": admin_email}))
            print(f"🗂️ Available quizzes for admin {admin_email}: {existing_quizzes}")
            raise HTTPException(status_code=404, detail=f"No submissions found for quiz: {decoded_quiz_name}")
        
        # Get total count for pagination - filter by admin
        total_count = db.exam_submissions.count_documents(query)
        
        # Import timezone for IST conversion
        from datetime import timezone, timedelta
        ist = timezone(timedelta(hours=5, minutes=30))
        
        # Format student data for frontend
        students = []
        for i, submission in enumerate(submissions):
            # Convert timestamp to IST
            timestamp_ist = None
            if submission.get("timestamp"):
                timestamp_utc = submission["timestamp"]
                timestamp_ist = timestamp_utc.replace(tzinfo=timezone.utc).astimezone(ist).strftime("%d/%m/%Y, %I:%M:%S %p")
            
            students.append({
                "index": (page - 1) * limit + i,
                "submission_id": str(submission["_id"]),
                "student_name": submission.get("student_name", "Unknown"),
                "student_email": submission.get("student_email", ""),
                "score": submission.get("score", 0),
                "percentage": submission.get("percentage", 0),
                "time_spent": submission.get("time_spent", ""),
                "submitted_at": submission.get("submitted_at", ""),
                "timestamp": timestamp_ist,
                "total_questions": submission.get("total_questions", 0),
                "correct_answers": submission.get("correct_answers", 0),
                "wrong_answers": submission.get("wrong_answers", 0),
                "unanswered": submission.get("unanswered", 0)
            })
        
        # Calculate quiz statistics
        avg_score = round(sum(s.get("score", 0) for s in submissions) / len(submissions), 2) if submissions else 0
        
        return {
            "quiz_info": {
                "quiz_name": quiz_name,
                "total_submissions": total_count,
                "average_score": avg_score,
                "page": page,
                "limit": limit,
                "total_pages": (total_count + limit - 1) // limit
            },
            "students": students
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching quiz details: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch quiz details")

@app.get("/admin/submission/{submission_id}")
def get_student_detailed_answers(submission_id: str, admin_email: str = Header(..., alias="X-Admin-Email")):
    """Get detailed question-by-question answers for a specific student submission"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not available")
    
    try:
        from bson import ObjectId
        from datetime import timezone, timedelta
        ist = timezone(timedelta(hours=5, minutes=30))
        
        # Get individual submission by ID
        submission = db.exam_submissions.find_one({"_id": ObjectId(submission_id)})
        
        if not submission:
            raise HTTPException(status_code=404, detail="Submission not found")
        
        # Convert timestamp to IST for submission details
        timestamp_ist = None
        if submission.get("timestamp"):
            timestamp_utc = submission["timestamp"]
            timestamp_ist = timestamp_utc.replace(tzinfo=timezone.utc).astimezone(ist).strftime("%d/%m/%Y, %I:%M:%S %p")
        
        # Return detailed submission data
        return {
            "student_info": {
                "submission_id": str(submission["_id"]),
                "student_name": submission.get("student_name", "Unknown"),
                "student_email": submission.get("student_email", ""),
                "quiz_name": submission.get("quiz_json_name", ""),
                "submitted_at": submission.get("submitted_at", ""),
                "timestamp": timestamp_ist,
                "time_spent": submission.get("time_spent", "")
            },
            "score_summary": {
                "score": submission.get("score", 0),
                "percentage": submission.get("percentage", 0),
                "total_questions": submission.get("total_questions", 0),
                "correct_answers": submission.get("correct_answers", 0),
                "wrong_answers": submission.get("wrong_answers", 0),
                "unanswered": submission.get("unanswered", 0)
            },
            "detailed_results": submission.get("detailed_results", []),
            "student_answers": submission.get("answers", [])
        }
        
    except Exception as e:
        print(f"❌ Error fetching student details: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch student details")

@app.get("/api/quiz-files")
def get_quiz_files():
    """Get available quiz files from the quiz_data directory"""
    try:
        quiz_files = []
        for file_path in QUIZ_DATA_DIR.glob("*.json"):
            quiz_files.append(file_path.stem)  # Get filename without .json extension
        
        quiz_files.sort()
        return {
            "quiz_files": quiz_files,
            "count": len(quiz_files)
        }
        
    except Exception as e:
        print(f"❌ Error fetching quiz files: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch quiz files")

@app.get("/api/quiz-data/{quiz_name}")
def get_quiz_data(quiz_name: str):
    """Get quiz data for frontend quiz selection"""
    try:
        questions = load_quiz_questions(quiz_name)
        return {
            "quiz_name": quiz_name,
            "questions": questions,
            "total_questions": len(questions)
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error loading quiz data for {quiz_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load quiz data for {quiz_name}")

@app.get("/admin/debug/submissions")
def debug_submissions(admin_email: str = Header(..., alias="X-Admin-Email")):
    """Debug endpoint to see what's in the exam_submissions collection"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not available")
    
    try:
        # Get all quiz names and submission counts
        pipeline = [
            {
                "$group": {
                    "_id": "$quiz_json_name",
                    "count": {"$sum": 1},
                    "latest": {"$max": "$timestamp"}
                }
            },
            {"$sort": {"latest": -1}}
        ]
        
        quiz_groups = list(db.exam_submissions.aggregate(pipeline))
        total_submissions = db.exam_submissions.count_documents({})
        
        return {
            "total_submissions": total_submissions,
            "quiz_groups": quiz_groups,
            "message": "Debug info for exam_submissions collection"
        }
        
    except Exception as e:
        return {"error": str(e), "message": "Failed to fetch debug info"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "message": "Quiz Buzz API is running"}

@app.get("/api")
def api_root():
    return {"message": "Quiz Buzz API", "status": "running", "health": "/health"}

# Serve React app root
@app.get("/")
def serve_root():
    static_build_dir = Path("/app/static")
    index_file = static_build_dir / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    else:
        return {"message": "Quiz Buzz API", "status": "running", "frontend": "not found"}

# Serve React app for all non-API routes
@app.get("/{path:path}")
def serve_react_app(request: Request, path: str):
    static_build_dir = Path("/app/static")
    index_file = static_build_dir / "index.html"
    
    # Skip API routes but allow quiz frontend routes  
    if path.startswith(("api/", "admin/", "teacher/", "images/", "quiz_data/", "docs", "openapi.json")):
        raise HTTPException(status_code=404, detail="API endpoint not found")
    
    # If it's a static file request, try to serve it from root static directory
    if path.endswith((".js", ".css", ".png", ".ico", ".json", ".svg", ".woff", ".woff2", ".ttf")) or path in ["favicon.ico", "manifest.json", "robots.txt"]:
        file_path = static_build_dir / path
        if file_path.exists():
            return FileResponse(str(file_path))
    
    # For all other routes (including React routes), serve index.html
    if index_file.exists():
        return FileResponse(str(index_file))
    else:
        raise HTTPException(status_code=404, detail="React app not found")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
