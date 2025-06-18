import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface QuizLinkResult {
  link_id: string;
  link_url: string;
  quiz_json_file: string;
  max_allowed: number;
}

interface StudentResult {
  link_id?: string;
  quiz_id?: string;
  admin_id?: string;
  admin_name?: string;
  admin_email?: string;
  plan_name?: string;
  student_name?: string;
  class_name?: string;
  section?: string;
  full_student_id?: string;
  score: number;
  total_questions?: number;
  wrong?: number;
  unanswered?: number;
  answered_questions?: number;
  percentage?: number;
  time_spent?: string;
  submitted_at?: string;
  timestamp?: string;
  date_submitted?: string;
  time_submitted?: string;
  // Legacy fields for backward compatibility
  name?: string;
  class?: string;
  studentName?: string;
  studentEmail?: string;
  quizName?: string;
  totalQuestions?: number;
  correctAnswers?: number;
  submittedAt?: string;
}

interface AdminStats {
  admin_name: string;
  admin_email: string;
  plan: string;
  student_limit_per_link: number;
  total_links_created: number;
  active_links: number;
  total_students_served: number;
  recent_activity: StudentResult[];
}

interface AdminContextType {
  email: string;
  name: string;
  plan_name: string;
  student_limit: number;
}

const AdminDashboard: React.FC = () => {
  const [generatedLink, setGeneratedLink] = useState<QuizLinkResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [studentResults, setStudentResults] = useState<StudentResult[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [adminContext, setAdminContext] = useState<AdminContextType | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Get API base URL from environment
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_LOCAL_API_URL || 'http://localhost:8080';

  // Get admin context from localStorage or session
  useEffect(() => {
    const storedAdmin = localStorage.getItem('adminContext');
    if (storedAdmin) {
      setAdminContext(JSON.parse(storedAdmin));
    } else {
      // Redirect to login if no admin context
      navigate('/admin-login');
    }
  }, [navigate]);

  const generateQuizLink = async () => {
    if (!adminContext) {
      setError('Admin context not found. Please login again.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/admin/generate-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Email': adminContext.email
        },
        body: JSON.stringify({
          quiz_id: 'NEET-2025-Code-48' // Using the actual quiz file name
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate quiz link');
      }

      const result = await response.json();
      setGeneratedLink(result);
      
      // Refresh stats after generating link
      loadAdminStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate link');
    } finally {
      setLoading(false);
    }
  };

  const loadStudentResults = async () => {
    if (!adminContext) {
      console.error('Admin context not found');
      return;
    }

    setLoadingResults(true);
    try {
      const response = await fetch(`${API_BASE_URL}/teacher/results`, {
        headers: {
          'X-Admin-Email': adminContext.email
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load results');
      }
      
      const data = await response.json();
      setStudentResults(data.results || []);
    } catch (err) {
      console.error('Error loading student results:', err);
    } finally {
      setLoadingResults(false);
    }
  };

  const loadAdminStats = async () => {
    if (!adminContext) {
      console.error('Admin context not found');
      return;
    }

    setLoadingStats(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: {
          'X-Admin-Email': adminContext.email
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load admin stats');
      }
      
      const data = await response.json();
      setAdminStats(data);
    } catch (err) {
      console.error('Error loading admin stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (adminContext) {
      loadStudentResults();
      loadAdminStats();
    }
  }, [adminContext]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Admin Dashboard</h1>
          {adminContext && (
            <div className="text-white/90 mb-4">
              <p className="text-xl">Welcome, {adminContext.name}!</p>
              <p className="text-sm">Plan: {adminContext.plan_name} | Student Limit: {adminContext.student_limit} per link</p>
            </div>
          )}
          <p className="text-white/80">Manage quiz links and view your students' submissions</p>
        </div>

        {/* Admin Stats Row */}
        {adminStats && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Your Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{adminStats.total_links_created}</div>
                <div className="text-white/80 text-sm">Links Created</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{adminStats.active_links}</div>
                <div className="text-white/80 text-sm">Active Links</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{adminStats.total_students_served}</div>
                <div className="text-white/80 text-sm">Students Served</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{adminStats.student_limit_per_link}</div>
                <div className="text-white/80 text-sm">Limit Per Link</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Generate Quiz Link Card */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔗</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Generate Quiz Link</h3>
              
              {generatedLink ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Generated Link:</p>
                    <p className="text-xs text-gray-800 break-all mb-2">{generatedLink.link_url}</p>
                    <p className="text-sm text-gray-600">Max Students: {generatedLink.max_allowed}</p>
                    <p className="text-xs text-gray-500 mt-1">Quiz: {generatedLink.quiz_json_file}</p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => copyToClipboard(generatedLink.link_url)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
                    >
                      Copy Link
                    </button>
                    <button
                      onClick={() => window.open(generatedLink.link_url, '_blank')}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition duration-200"
                    >
                      Test Link
                    </button>
                  </div>
                  <button
                    onClick={() => setGeneratedLink(null)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition duration-200"
                  >
                    Generate New
                  </button>
                </div>
              ) : (
                <button
                  onClick={generateQuizLink}
                  disabled={loading}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition duration-200 disabled:opacity-50"
                >
                  {loading ? 'Generating...' : 'Generate Link'}
                </button>
              )}
              
              {error && (
                <p className="text-red-600 text-sm mt-2">{error}</p>
              )}
            </div>
          </div>

          {/* View Student Submissions Card */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Your Students</h3>
              <p className="text-gray-600 mb-4">{studentResults.length} Total Submissions</p>
              {adminStats && (
                <p className="text-sm text-gray-500 mb-2">From {adminStats.total_links_created} quiz links</p>
              )}
              <button
                onClick={loadStudentResults}
                disabled={loadingResults}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 disabled:opacity-50"
              >
                {loadingResults ? 'Loading...' : 'Refresh Results'}
              </button>
            </div>
          </div>

          {/* Back to Select Quiz Card */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⬅️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Back to Quizzes</h3>
              <p className="text-gray-600 mb-4">Return to quiz selection</p>
              <button
                onClick={() => navigate('/select-quiz')}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition duration-200"
              >
                Select Quiz
              </button>
            </div>
          </div>
        </div>

        {/* Student Results Table */}
        {studentResults.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Your Students' Submissions</h3>
            {adminContext && (
              <p className="text-gray-600 mb-4">Showing results for students who used your quiz links</p>
            )}
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Student Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Class/Section</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Quiz</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Attempted</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-green-700">✅ Correct</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-red-700">❌ Wrong</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">⚪ Unanswered</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-blue-700">📈 Percentage</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {studentResults.slice(0, 10).map((result, index) => {
                    // Calculate values from the enhanced data structure
                    const totalQuestions = result.total_questions || result.totalQuestions || 10;
                    const correctAnswers = result.score || result.correctAnswers || 0;
                    const wrongAnswers = result.wrong || (result.answered_questions ? result.answered_questions - correctAnswers : 0);
                    const answeredQuestions = correctAnswers + wrongAnswers;
                    const unanswered = totalQuestions - answeredQuestions;
                    const percentage = result.percentage || (totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0);
                    
                    return (
                      <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                          {result.student_name || result.name || result.studentName || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {result.class_name && result.section ? 
                            `${result.class_name}-${result.section}` : 
                            result.class && result.section ? 
                              `${result.class}-${result.section}` : 
                              result.full_student_id || 'N/A'
                          }
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {result.quiz_id || result.quizName || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          <span className="font-medium">
                            {answeredQuestions}/{totalQuestions}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span 
                            className="px-2 py-1 rounded-md font-semibold"
                            style={{ 
                              backgroundColor: '#dcfce7', 
                              color: '#166534',
                              border: '1px solid #22c55e'
                            }}
                          >
                            ✅ {correctAnswers}/{totalQuestions}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span 
                            className="px-2 py-1 rounded-md font-semibold"
                            style={{ 
                              backgroundColor: '#fee2e2', 
                              color: '#991b1b',
                              border: '1px solid #ef4444'
                            }}
                          >
                            ❌ {wrongAnswers}/{totalQuestions}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span 
                            className="px-2 py-1 rounded-md font-semibold"
                            style={{ 
                              backgroundColor: '#f3f4f6', 
                              color: '#374151',
                              border: '1px solid #9ca3af'
                            }}
                          >
                            ⚪ {unanswered}/{totalQuestions}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span 
                            className="px-3 py-1 rounded-full text-sm font-bold"
                            style={{ 
                              backgroundColor: percentage >= 80 ? '#bbf7d0' : 
                                             percentage >= 60 ? '#fef3c7' : 
                                             percentage >= 40 ? '#fed7aa' : 
                                             '#fecaca',
                              color: percentage >= 80 ? '#14532d' : 
                                     percentage >= 60 ? '#92400e' : 
                                     percentage >= 40 ? '#c2410c' : 
                                     '#991b1b',
                              border: percentage >= 80 ? '2px solid #22c55e' : 
                                      percentage >= 60 ? '2px solid #eab308' : 
                                      percentage >= 40 ? '2px solid #f97316' : 
                                      '2px solid #ef4444'
                            }}
                          >
                            📈 {percentage}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {result.submitted_at || result.submittedAt ? 
                            new Date(result.submitted_at || result.submittedAt!).toLocaleDateString() : 
                            result.date_submitted || 'N/A'
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;