import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface StudentInfo {
  submission_id: string;
  student_name: string;
  student_email: string;
  quiz_name: string;
  submitted_at: string;
  timestamp: string;
  time_spent: string;
}

interface ScoreSummary {
  score: number;
  percentage: number;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  unanswered: number;
}

interface DetailedResult {
  questionNumber: number;
  questionText: string;
  selectedOption: string;
  selectedLetter: string;
  correctAnswer: string;
  correctLetter: string;
  isCorrect: boolean;
  status: string;
  timeSpent: string;
  isMarked: boolean;
  options: any[];
}

const SubmissionDetails: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [scoreSummary, setScoreSummary] = useState<ScoreSummary | null>(null);
  const [detailedResults, setDetailedResults] = useState<DetailedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Get API base URL from environment - use current domain for tunnels
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 
    (process.env.NODE_ENV === 'production' ? window.location.origin : 'http://localhost:8080');

  useEffect(() => {
    if (submissionId) {
      fetchSubmissionDetails();
    }
  }, [submissionId]);

  const fetchSubmissionDetails = async () => {
    try {
      const adminContext = localStorage.getItem('adminContext');
      if (!adminContext) {
        navigate('/admin-login');
        return;
      }

      const admin = JSON.parse(adminContext);
      
      const response = await fetch(`${API_BASE_URL}/admin/submission/${submissionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Email': admin.email,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStudentInfo(data.student_info);
        setScoreSummary(data.score_summary);
        setDetailedResults(data.detailed_results || []);
      } else {
        throw new Error('Failed to fetch submission details');
      }
    } catch (err) {
      setError('Failed to load submission details');
      console.error('Error fetching submission details:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    // If already formatted (contains "/"), return as is
    if (dateString && dateString.includes('/')) {
      return dateString;
    }
    // Otherwise format as before
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CORRECT': return '✅';
      case 'WRONG': return '❌';
      case 'UNANSWERED': return '⚪';
      default: return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CORRECT': return 'text-green-400';
      case 'WRONG': return 'text-red-400';
      case 'UNANSWERED': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const goBack = () => {
    if (studentInfo) {
      // Use the exact quiz name from the submission without additional encoding
      navigate(`/exam/${encodeURIComponent(studentInfo.quiz_name)}`);
    } else {
      navigate('/exam-dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading submission details...</div>
      </div>
    );
  }

  if (!studentInfo || !scoreSummary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Submission not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 shadow-xl">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{studentInfo.student_name}</h1>
              <p className="text-white/70 text-lg mb-1">{studentInfo.quiz_name}</p>
              <p className="text-white/60 text-sm">Submitted: {studentInfo.timestamp ? formatDate(studentInfo.timestamp) : formatDate(studentInfo.submitted_at)}</p>
              <p className="text-white/60 text-sm">Time Spent: {studentInfo.time_spent}</p>
            </div>
            <button
              onClick={goBack}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-lg transition-colors"
            >
              ← Back to Submissions
            </button>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Score Summary */}
          <div className="bg-white/10 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">📊 Score Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{scoreSummary.score}%</div>
                <div className="text-white/70 text-sm">Overall Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{scoreSummary.correct_answers}</div>
                <div className="text-white/70 text-sm">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{scoreSummary.wrong_answers}</div>
                <div className="text-white/70 text-sm">Wrong</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-400">{scoreSummary.unanswered}</div>
                <div className="text-white/70 text-sm">Unanswered</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{scoreSummary.total_questions}</div>
                <div className="text-white/70 text-sm">Total Questions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{scoreSummary.percentage}%</div>
                <div className="text-white/70 text-sm">Percentage</div>
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="bg-white/10 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-6">📋 Question-by-Question Analysis</h2>
            
            {detailedResults.length === 0 ? (
              <div className="text-center text-white/70 py-8">
                <p>No detailed results available for this submission.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {detailedResults.map((result, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-6 border border-white/10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className={`text-2xl ${getStatusIcon(result.status)}`}>
                          {getStatusIcon(result.status)}
                        </span>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            Question {result.questionNumber}
                          </h3>
                          <span className={`text-sm font-medium ${getStatusColor(result.status)}`}>
                            {result.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-right text-white/70 text-sm">
                        <div>Time: {result.timeSpent}</div>
                        {result.isMarked && <div className="text-yellow-400">⭐ Marked</div>}
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-white text-base leading-relaxed">
                        {result.questionText}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-white/70">Student Answer: </span>
                        <span className={`font-medium ${result.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                          {result.selectedLetter ? `${result.selectedLetter}: ${result.selectedOption}` : 'Not answered'}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/70">Correct Answer: </span>
                        <span className="font-medium text-green-400">
                          {result.correctLetter}: {result.correctAnswer}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetails;