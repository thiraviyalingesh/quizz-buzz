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
  const [loadingStats, setLoadingStats] = useState(false);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [adminContext, setAdminContext] = useState<AdminContextType | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<string>('');
  const [availableQuizzes, setAvailableQuizzes] = useState<string[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Get API base URL from environment - use current domain for tunnels
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_LOCAL_API_URL || window.location.origin;

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

  // Load available quizzes dynamically
  useEffect(() => {
    const loadAvailableQuizzes = async () => {
      setLoadingQuizzes(true);
      try {
        const response = await fetch('/api/quiz-files');
        if (response.ok) {
          const data = await response.json();
          setAvailableQuizzes(data.quiz_files);
          // Use the quiz selected by user on quiz selection page
          const userSelectedQuiz = localStorage.getItem('selectedQuiz');
          if (userSelectedQuiz && data.quiz_files.includes(userSelectedQuiz)) {
            setSelectedQuiz(userSelectedQuiz);
          } else if (data.quiz_files.length > 0 && !selectedQuiz) {
            // Only fallback to first quiz if user hasn't selected anything
            setSelectedQuiz(data.quiz_files[0]);
          }
          console.log('📚 Loaded available quizzes:', data.quiz_files);
        } else {
          throw new Error('Failed to load quizzes from API');
        }
      } catch (error) {
        console.error('❌ Error loading quizzes:', error);
        // Fallback to hardcoded list if API fails
        const fallbackQuizzes = ['NEET-2025-Code-48', 'JEE', '7th std Maths', '7th std Science'];
        setAvailableQuizzes(fallbackQuizzes);
        // Use the quiz selected by user on quiz selection page
        const userSelectedQuiz = localStorage.getItem('selectedQuiz');
        if (userSelectedQuiz && fallbackQuizzes.includes(userSelectedQuiz)) {
          setSelectedQuiz(userSelectedQuiz);
        } else if (!selectedQuiz) {
          setSelectedQuiz(fallbackQuizzes[0]);
        }
      } finally {
        setLoadingQuizzes(false);
      }
    };

    loadAvailableQuizzes();
  }, [selectedQuiz]);

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
          quiz_id: selectedQuiz
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
      loadAdminStats();
    }
  }, [adminContext]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Link copied to clipboard!');
  };

  const handleLogout = () => {
    localStorage.removeItem('adminContext');
    navigate('/admin-login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center mb-2">
              
              <h1 className="text-4xl font-bold text-white">Buzztrackers Admin</h1>
            </div>
            {adminContext && (
              <div className="text-white/90 mb-2">
                <p className="text-lg">Welcome, {adminContext.name}!</p>
                <p className="text-xs">Plan: {adminContext.plan_name} | Student Limit: {adminContext.student_limit} per link</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition duration-200 flex items-center gap-2"
          >
            🚪 Logout
          </button>
        </div>

        {/* Admin Stats Row */}
        {adminStats && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
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

        <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          {/* Generate Quiz Link Card - MAIN CARD (BIGGER) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔗</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">🚀 Generate Quiz Link</h3>
              
              {/* Selected Quiz Display (Read-only) */}
              <div className="mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-sm font-medium text-blue-700 mb-1">Selected Quiz:</div>
                  <div className="text-lg font-bold text-blue-900">
                    {loadingQuizzes ? 'Loading quiz...' : selectedQuiz || 'No quiz selected'}
                  </div>
                </div>
              </div>
              
              {generatedLink ? (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <p className="text-lg text-gray-600 mb-4">🎉 Quiz Link Generated Successfully!</p>
                    <div className="flex items-center space-x-2 mb-4">
                      <input
                        type="text"
                        value={generatedLink.link_url}
                        readOnly
                        className="flex-1 p-3 border rounded text-sm bg-white"
                      />
                      <button
                        onClick={() => copyToClipboard(generatedLink.link_url)}
                        className="bg-blue-600 text-white px-4 py-3 rounded text-sm hover:bg-blue-700 transition"
                      >
                        📋 Copy
                      </button>
                    </div>
                    <p className="text-sm text-gray-500">
                      Max Students: {generatedLink.max_allowed} | Quiz: {generatedLink.quiz_json_file}
                    </p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => window.open(generatedLink.link_url, '_blank')}
                      className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition duration-200"
                    >
                      🌐 Test Link
                    </button>
                    <button
                      onClick={() => setGeneratedLink(null)}
                      className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition duration-200"
                    >
                      🔄 Generate New
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={generateQuizLink}
                  disabled={loading}
                  className="bg-green-600 text-white px-10 py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition duration-200 disabled:opacity-50 transform hover:scale-105"
                >
                  {loading ? '🔄 Generating...' : '⚡ Generate Quiz Link'}
                </button>
              )}
              
              {error && (
                <p className="text-red-600 text-sm mt-4">{error}</p>
              )}
            </div>
          </div>

          {/* Right Side Cards - Equal Height */}
          <div className="flex flex-col gap-4">
            {/* Exam Dashboard Card */}
            <div className="bg-white p-6 rounded-xl shadow-lg h-64 flex flex-col justify-center">
              <div className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📈</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">Exam Dashboard</h3>
                <p className="text-gray-600 mb-4 text-sm">View detailed exam sessions</p>
                <button
                  onClick={() => navigate('/exam-dashboard')}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition duration-200 w-full"
                >
                  📊 View Sessions
                </button>
              </div>
            </div>

            {/* Back to Select Quiz Card */}
            <div className="bg-white p-6 rounded-xl shadow-lg h-64 flex flex-col justify-center">
              <div className="text-center">
                <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⬅️</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">Back to Quizzes</h3>
                <p className="text-gray-600 mb-4 text-sm">Return to quiz selection</p>
                <button
                  onClick={() => navigate('/select-quiz')}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition duration-200 w-full"
                >
                  🎯 Select Quiz
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;