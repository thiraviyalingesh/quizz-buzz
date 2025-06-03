import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface QuestionDetail {
  questionNumber: number;
  questionText: string;
  selectedOption: number;
  correctAnswer: string;
  isCorrect: boolean;
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
  const [report, setReport] = useState<StudentResult | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:8000/teacher/results')
      .then(res => res.json())
      .then(data => {
        if (data.results && data.results.length > 0) {
          setReport(data.results[data.results.length - 1]);
        }
      });
  }, []);

  const goToUpload = () => navigate('/upload');
  const goToTest = () => navigate('/select-quiz');
  const logout = () => navigate('/');

  if (!report) return <div className="text-center p-10 text-lg">Loading student report...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">📊 Student Report Summary</h1>
          <div className="flex gap-2">
            <button onClick={goToUpload} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Upload New Quiz</button>
            <button onClick={goToTest} className="bg-yellow-500 text-white px-4 py-2 rounded-lg">Take Test Again</button>
            <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded-lg">Logout</button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white shadow p-4 rounded-xl text-center">
            <p className="text-gray-500 text-sm">Score</p>
            <h2 className="text-2xl font-bold text-blue-600">{report.score}%</h2>
          </div>
          <div className="bg-white shadow p-4 rounded-xl text-center">
            <p className="text-gray-500 text-sm">Correct</p>
            <h2 className="text-2xl font-bold text-green-600">{report.correctAnswers}/{report.totalQuestions}</h2>
          </div>
          <div className="bg-white shadow p-4 rounded-xl text-center">
            <p className="text-gray-500 text-sm">Time Spent</p>
            <h2 className="text-xl font-semibold">{report.timeSpent}</h2>
          </div>
          <div className="bg-white shadow p-4 rounded-xl text-center">
            <p className="text-gray-500 text-sm">Submitted</p>
            <h2 className="text-sm">{new Date(report.submittedAt).toLocaleString()}</h2>
          </div>
        </div>

        {/* Accordion Breakdown */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-4">Detailed Answer Breakdown</h3>
          <div className="space-y-4">
            {report.detailedResults.map((q, idx) => (
              <details key={idx} className="bg-gray-100 rounded-lg p-4 border border-gray-200">
                <summary className="cursor-pointer font-medium text-gray-800">
                  Q{q.questionNumber}: {q.isCorrect ? <span className="text-green-600">✅</span> : <span className="text-red-500">❌</span>}
                </summary>
                <div className="mt-2 text-sm text-gray-700">
                  <p className="mb-1 font-medium">{q.questionText}</p>
                  <p>
                    <strong>Your Answer:</strong> <span className={q.isCorrect ? 'text-green-600' : 'text-red-600'}>
                      {String.fromCharCode(65 + q.selectedOption)} ({q.isCorrect ? 'Correct' : 'Wrong'})
                    </span>
                  </p>
                  <p><strong>Correct Answer:</strong> {q.correctAnswer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherPanel;
