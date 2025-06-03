import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface QuestionDetail {
  questionNumber: number;
  questionText: string;
  selectedOption: number;
  correctAnswer: number;
  isCorrect: boolean;
  timeSpent: number;
  isMarked: boolean;
  options: string[];
}

interface StudentResult {
  studentName: string;
  studentEmail: string;
  quizName: string;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  score: number;
  timeSpent: string;
  submittedAt: string;
  detailedResults: QuestionDetail[];
}

const TeacherPanel: React.FC = () => {
  const [results, setResults] = useState<StudentResult[]>([]);
  const [selected, setSelected] = useState<StudentResult | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("http://localhost:8000/teacher/results")
      .then(res => {
        const data: StudentResult[] = res.data.results;
        setResults(data);
        if (data.length > 0) setSelected(data[data.length - 1]);
      })
      .catch(err => {
        console.error("❌ Failed to load results", err);
      });
  }, []);

  const goBack = () => navigate("/select-quiz");

  if (!selected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-600 text-white">
        <div className="text-center bg-white text-gray-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold mb-2">Teacher Panel</h2>
          <p>No student results found.</p>
          <button onClick={goBack} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
            Back to Quiz Selection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl p-6">
        <h1 className="text-2xl font-bold mb-4">📊 Teacher Panel</h1>
        <div className="mb-4">
          <p><strong>Name:</strong> {selected.studentName}</p>
          <p><strong>Email:</strong> {selected.studentEmail}</p>
          <p><strong>Quiz:</strong> {selected.quizName}</p>
          <p><strong>Score:</strong> {selected.score}%</p>
          <p><strong>Correct:</strong> {selected.correctAnswers} / {selected.totalQuestions}</p>
          <p><strong>Time:</strong> {selected.timeSpent}</p>
          <p><strong>Submitted:</strong> {selected.submittedAt}</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Answer Breakdown</h2>
          <ul className="space-y-3">
            {selected.detailedResults.map((q, idx) => (
              <li key={idx} className="border p-3 rounded-md bg-gray-50">
                <p><strong>Q{q.questionNumber}:</strong> {q.questionText}</p>
                <p>
                  Student Answer: <span className={q.isCorrect ? "text-green-600" : "text-red-600"}>
                    {q.selectedOption + 1} ({q.isCorrect ? "✅" : "❌"})
                  </span>
                </p>
                <p>Correct Answer: {q.correctAnswer + 1}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TeacherPanel;
