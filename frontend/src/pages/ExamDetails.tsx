import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface Student {
  index: number;
  submission_id: string;
  student_name: string;
  student_email: string;
  score: number;
  percentage: number;
  time_spent: string;
  submitted_at: string;
  timestamp: string;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  unanswered: number;
}

interface QuizInfo {
  quiz_name: string;
  total_submissions: number;
  average_score: number;
  page: number;
  limit: number;
  total_pages: number;
}

const ExamDetails: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const [quizInfo, setQuizInfo] = useState<QuizInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  // Get API base URL from environment - use current domain for tunnels
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 
    (process.env.NODE_ENV === 'production' ? window.location.origin : 'http://localhost:8080');

  useEffect(() => {
    if (examId) {
      fetchExamDetails();
    }
  }, [examId, currentPage]);

  const fetchExamDetails = async () => {
    try {
      const adminContext = localStorage.getItem('adminContext');
      if (!adminContext) {
        navigate('/admin-login');
        return;
      }

      const admin = JSON.parse(adminContext);
      // examId is already URL encoded from the route, so we use it directly
      const quizName = examId || '';
      
      console.log('🔍 Fetching quiz details for:', quizName);
      
      const response = await fetch(`${API_BASE_URL}/admin/exam/${quizName}?page=${currentPage}&limit=50`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Email': admin.email,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setQuizInfo(data.quiz_info);
        setStudents(data.students);
      } else {
        throw new Error('Failed to fetch quiz submissions');
      }
    } catch (err) {
      setError('Failed to load quiz submissions');
      console.error('Error fetching quiz details:', err);
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

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBadge = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500/20 text-green-100';
    if (percentage >= 60) return 'bg-yellow-500/20 text-yellow-100';
    return 'bg-red-500/20 text-red-100';
  };

  const viewStudentDetails = (submissionId: string) => {
    navigate(`/submission/${submissionId}`);
  };

  const calculateStats = () => {
    if (students.length === 0) return { average: 0, highest: 0, lowest: 0 };
    
    const scores = students.map(s => s.percentage);
    return {
      average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      highest: Math.max(...scores),
      lowest: Math.min(...scores)
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading exam details...</div>
      </div>
    );
  }

  if (!quizInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Quiz not found</div>
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
              <h1 className="text-3xl font-bold text-white mb-2">{quizInfo.quiz_name}</h1>
              <p className="text-white/70">Total Submissions: {quizInfo.total_submissions} | Average Score: {quizInfo.average_score}%</p>
            </div>
            <button
              onClick={() => navigate('/exam-dashboard')}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-lg transition-colors"
            >
              ← Back to Exams
            </button>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/10 rounded-lg p-6 text-center">
              <div className="text-2xl font-bold text-white">{students.length}</div>
              <div className="text-white/70 text-sm">Current Page</div>
            </div>
            <div className="bg-white/10 rounded-lg p-6 text-center">
              <div className="text-2xl font-bold text-green-400">{quizInfo.average_score}%</div>
              <div className="text-white/70 text-sm">Average Score</div>
            </div>
            <div className="bg-white/10 rounded-lg p-6 text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.highest}%</div>
              <div className="text-white/70 text-sm">Highest Score</div>
            </div>
            <div className="bg-white/10 rounded-lg p-6 text-center">
              <div className="text-2xl font-bold text-red-400">{stats.lowest}%</div>
              <div className="text-white/70 text-sm">Lowest Score</div>
            </div>
          </div>

          {/* Students Table */}
          {students.length === 0 ? (
            <div className="text-center text-white/70 py-12">
              <h3 className="text-xl mb-4">No student submissions yet</h3>
              <p>Students submissions will appear here once they complete the quiz.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full bg-white/10 rounded-lg overflow-hidden">
                <thead className="bg-white/20">
                  <tr>
                    <th className="px-6 py-4 text-left text-white font-semibold">Student Name</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Email</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Score</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Percentage</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Submitted</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => (
                    <tr key={student.submission_id} className={`border-b border-white/10 ${index % 2 === 0 ? 'bg-white/5' : 'bg-white/10'}`}>
                      <td className="px-6 py-4 text-white font-medium">{student.student_name}</td>
                      <td className="px-6 py-4 text-white/80">{student.student_email}</td>
                      <td className="px-6 py-4 text-white/80">{student.correct_answers}/{student.total_questions}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${getScoreBadge(student.percentage)}`}>
                          {student.percentage}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white/80 text-sm">{student.timestamp ? formatDate(student.timestamp) : formatDate(student.submitted_at)}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => viewStudentDetails(student.submission_id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
                        >
                          🔍 View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {quizInfo.total_pages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
              >
                ← Previous
              </button>
              <span className="text-white">
                Page {currentPage} of {quizInfo.total_pages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === quizInfo.total_pages}
                className="bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamDetails;