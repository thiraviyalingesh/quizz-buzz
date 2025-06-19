import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ExamListItem {
  quiz_name: string;
  total_submissions: number;
  latest_submission: string;
  first_submission: string;
  average_score: number;
}

const ExamDashboard: React.FC = () => {
  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Get API base URL from environment - use current domain for tunnels
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 
    (process.env.NODE_ENV === 'production' ? window.location.origin : 'http://localhost:8080');

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const adminContext = localStorage.getItem('adminContext');
      if (!adminContext) {
        navigate('/admin-login');
        return;
      }

      const admin = JSON.parse(adminContext);
      
      const response = await fetch(`${API_BASE_URL}/admin/exams`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Email': admin.email,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setExams(data.exams);
      } else {
        throw new Error('Failed to fetch exams');
      }
    } catch (err) {
      setError('Failed to load exam sessions');
      console.error('Error fetching exams:', err);
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

  const viewExamDetails = (quizName: string) => {
    navigate(`/exam/${encodeURIComponent(quizName)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading exam sessions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center">
              <img 
                src="/logo.png" 
                alt="Buzztrackers Logo" 
                className="w-10 h-10 mr-3"
              />
              <h1 className="text-3xl font-bold text-white">📊 Exam Sessions Dashboard</h1>
            </div>
            <button
              onClick={() => navigate('/admin-dashboard')}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-lg transition-colors"
            >
              ← Back to Admin
            </button>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {exams.length === 0 ? (
            <div className="text-center text-white/70 py-12">
              <h3 className="text-xl mb-4">No exam sessions found</h3>
              <p>Generate quiz links from the admin dashboard to create exam sessions.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full bg-white/10 rounded-lg overflow-hidden">
                <thead className="bg-white/20">
                  <tr>
                    <th className="px-6 py-4 text-left text-white font-semibold">Quiz Name</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Total Submissions</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Average Score</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Latest Submission</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((exam, index) => (
                    <tr key={exam.quiz_name} className={`border-b border-white/10 ${index % 2 === 0 ? 'bg-white/5' : 'bg-white/10'}`}>
                      <td className="px-6 py-4 text-white font-medium">{exam.quiz_name}</td>
                      <td className="px-6 py-4 text-white/80">
                        <span className="bg-green-500/20 text-green-100 px-3 py-1 rounded-full text-sm">
                          {exam.total_submissions} submissions
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white/80">
                        <span className="bg-blue-500/20 text-blue-100 px-3 py-1 rounded-full text-sm">
                          {exam.average_score}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white/80">{exam.latest_submission ? formatDate(exam.latest_submission) : 'N/A'}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => viewExamDetails(exam.quiz_name)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
                        >
                          🔍 View Submissions
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-8 text-center">
            <div className="text-white/60 text-sm">
              Total Exam Sessions: {exams.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamDashboard;