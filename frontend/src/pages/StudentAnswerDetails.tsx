import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface QuestionAnswer {
  questionNumber: number;
  questionText: string;
  selectedOption: number;
  selectedLetter: string;
  correctAnswer: string;
  correctLetter: string;
  isCorrect: boolean;
  status: string;
  timeSpent: number;
  isMarked: boolean;
  options: string[];
}

interface StudentInfo {
  name: string;
  class_name: string;
  section: string;
  score: number;
  total: number;
  percentage: number;
  submitted_at: string;
}

interface ExamInfo {
  exam_id: string;
  quiz_name: string;
  created_at: string;
}

const StudentAnswerDetails: React.FC = () => {
  const { examId, studentIndex } = useParams<{ examId: string; studentIndex: string }>();
  const [examInfo, setExamInfo] = useState<ExamInfo | null>(null);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Get API base URL from environment - use current domain for tunnels
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 
    (process.env.NODE_ENV === 'production' ? window.location.origin : 'http://localhost:8080');

  useEffect(() => {
    if (examId && studentIndex) {
      fetchStudentDetails();
    }
  }, [examId, studentIndex]);

  const fetchStudentDetails = async () => {
    try {
      const adminContext = localStorage.getItem('adminContext');
      if (!adminContext) {
        navigate('/admin-login');
        return;
      }

      const admin = JSON.parse(adminContext);
      
      const response = await fetch(`${API_BASE_URL}/admin/exam/${examId}/student/${studentIndex}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Email': admin.email,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setExamInfo(data.exam_info);
        setStudentInfo(data.student_info);
        setAnswers(data.detailed_answers);
      } else {
        throw new Error('Failed to fetch student details');
      }
    } catch (err) {
      setError('Failed to load student details');
      console.error('Error fetching student details:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CORRECT': return 'text-green-400 bg-green-500/20';
      case 'WRONG': return 'text-red-400 bg-red-500/20';
      case 'UNANSWERED': return 'text-gray-400 bg-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CORRECT': return '✅';
      case 'WRONG': return '❌';
      case 'UNANSWERED': return '⚪';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading student details...</div>
      </div>
    );
  }

  if (!examInfo || !studentInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Student details not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 shadow-xl">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{studentInfo.name}</h1>
              <p className="text-white/70">{examInfo.quiz_name} - {studentInfo.class_name} {studentInfo.section}</p>
            </div>
            <button
              onClick={() => navigate(`/exam/${examId}`)}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-lg transition-colors"
            >
              ← Back to Exam
            </button>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Student Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/10 rounded-lg p-6 text-center">
              <div className="text-2xl font-bold text-white">{studentInfo.score}/{studentInfo.total}</div>
              <div className="text-white/70 text-sm">Score</div>
            </div>
            <div className="bg-white/10 rounded-lg p-6 text-center">
              <div className={`text-2xl font-bold ${studentInfo.percentage >= 60 ? 'text-green-400' : 'text-red-400'}`}>
                {studentInfo.percentage}%
              </div>
              <div className="text-white/70 text-sm">Percentage</div>
            </div>
            <div className="bg-white/10 rounded-lg p-6 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {answers.filter(a => a.status === 'CORRECT').length}
              </div>
              <div className="text-white/70 text-sm">Correct</div>
            </div>
            <div className="bg-white/10 rounded-lg p-6 text-center">
              <div className="text-2xl font-bold text-red-400">
                {answers.filter(a => a.status === 'WRONG').length}
              </div>
              <div className="text-white/70 text-sm">Wrong</div>
            </div>
          </div>

          {/* Question-by-Question Analysis */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">📝 Question-by-Question Analysis</h2>
            
            {answers.map((answer, index) => (
              <div key={index} className="bg-white/10 rounded-lg p-6 border border-white/20">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-white font-bold">Q{answer.questionNumber}</span>
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(answer.status)}`}>
                        {getStatusIcon(answer.status)} {answer.status}
                      </span>
                      {answer.isMarked && (
                        <span className="bg-yellow-500/20 text-yellow-100 px-2 py-1 rounded text-xs">
                          🔖 Marked for Review
                        </span>
                      )}
                    </div>
                    <p className="text-white/90 mb-4">{answer.questionText}</p>
                  </div>
                  <div className="text-white/60 text-sm">
                    Time: {Math.round(answer.timeSpent)}s
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-white font-semibold text-sm">Answer Options:</h4>
                    {answer.options.map((option, optIndex) => {
                      const optionLetter = ['A', 'B', 'C', 'D'][optIndex];
                      const isSelected = optIndex === answer.selectedOption;
                      const isCorrect = optionLetter === answer.correctLetter;
                      
                      let bgColor = 'bg-white/5';
                      if (isSelected && isCorrect) bgColor = 'bg-green-500/20 border-green-500';
                      else if (isSelected && !isCorrect) bgColor = 'bg-red-500/20 border-red-500';
                      else if (isCorrect) bgColor = 'bg-green-500/10 border-green-500/50';

                      return (
                        <div key={optIndex} className={`p-3 rounded-lg border ${bgColor}`}>
                          <span className="text-white font-semibold">{optionLetter}.</span>
                          <span className="text-white/90 ml-2">{option}</span>
                          {isSelected && <span className="ml-2 text-blue-300">← Selected</span>}
                          {isCorrect && <span className="ml-2 text-green-300">✓ Correct</span>}
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-3">
                    <div className="bg-white/5 p-4 rounded-lg">
                      <div className="text-white/70 text-sm">Student's Answer:</div>
                      <div className="text-white font-semibold">
                        {answer.selectedOption >= 0 ? answer.selectedLetter : 'Not Answered'}
                      </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg">
                      <div className="text-white/70 text-sm">Correct Answer:</div>
                      <div className="text-green-300 font-semibold">{answer.correctLetter}</div>
                    </div>
                    {answer.status === 'WRONG' && (
                      <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/30">
                        <div className="text-red-300 text-sm">❌ Incorrect Answer</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Footer */}
          <div className="mt-8 text-center text-white/60 text-sm">
            Submitted: {formatDate(studentInfo.submitted_at)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAnswerDetails;