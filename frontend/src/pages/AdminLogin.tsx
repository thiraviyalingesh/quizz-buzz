import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface AdminLoginResponse {
  email: string;
  name: string;
  plan_name: string;
  student_limit: number;
  token?: string;
}

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [adminData, setAdminData] = useState<AdminLoginResponse | null>(null);
  const navigate = useNavigate();

  // Get API base URL from environment
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_LOCAL_API_URL || 'http://localhost:8080';

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Please enter both email and password');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data: AdminLoginResponse = await response.json();
        setAdminData(data);
        
        // Store admin context in localStorage for use in other components
        localStorage.setItem('adminContext', JSON.stringify({
          email: data.email,
          name: data.name,
          plan_name: data.plan_name,
          student_limit: data.student_limit
        }));
        
        setShowWelcome(true);
        
        // Auto-redirect after 4 seconds
        setTimeout(() => {
          navigate('/select-quiz');
        }, 4000);
      } else {
        const error = await response.json();
        alert(error.detail || 'Login failed');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (showWelcome && adminData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden">
        {/* Floating particles */}
        <div className="absolute inset-0">
          <div className="animate-float absolute top-20 left-20 text-yellow-300 text-4xl">✨</div>
          <div className="animate-float absolute top-40 right-20 text-blue-300 text-3xl" style={{ animationDelay: '0.5s' }}>🎯</div>
          <div className="animate-float absolute bottom-40 left-40 text-green-300 text-3xl" style={{ animationDelay: '1s' }}>📚</div>
          <div className="animate-float absolute bottom-20 right-40 text-red-300 text-4xl" style={{ animationDelay: '1.5s' }}>🚀</div>
        </div>
        
        <div className="text-center text-white z-10 px-8">
          {/* Main celebration emoji */}
          <div className="mb-8">
            <div className="text-9xl mb-6 animate-bounce-big">🎉</div>
          </div>
          
          {/* Welcome text with staggered animations */}
          <h1 className="text-7xl md:text-8xl font-black mb-6 bg-gradient-to-r from-yellow-300 via-pink-300 to-blue-300 bg-clip-text text-transparent animate-zoom-in font-sans tracking-wider">
            WELCOME
          </h1>
          
          <h2 className="text-5xl md:text-6xl font-bold mb-4 animate-slide-up-bounce" style={{ animationDelay: '0.3s' }}>
            {adminData.name.toUpperCase()}
          </h2>
          
          <div className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <p className="text-2xl md:text-3xl mb-3 font-light tracking-wide">
              🎊 You're part of the 🎊
            </p>
          </div>
          
          <div className="animate-scale-bounce" style={{ animationDelay: '0.9s' }}>
            <p className="text-4xl md:text-5xl font-bold mb-4 text-yellow-200 drop-shadow-lg">
              Buzztrackers FAMILY's
            </p>
          </div>
          
          <div className="animate-bounce-in" style={{ animationDelay: '1.2s' }}>
            <p className="text-6xl md:text-7xl font-black mb-8 text-yellow-300 drop-shadow-2xl transform hover:scale-110 transition-transform">
              {adminData.plan_name} PLAN
            </p>
          </div>
          
          <div className="animate-slide-up-bounce" style={{ animationDelay: '1.5s' }}>
            <p className="text-3xl md:text-4xl font-semibold mb-6 flex items-center justify-center gap-4">
              <span className="animate-pulse">LET'S GO AND TEACH</span>
              <span className="animate-bounce text-5xl">💡</span>
              <span className="animate-pulse">OUR STUDENTS</span>
            </p>
          </div>
          
          {/* Bottom rockets */}
          <div className="flex justify-center gap-8 mt-8 animate-fade-in-up" style={{ animationDelay: '1.8s' }}>
            <div className="text-6xl animate-rocket">🚀</div>
            <div className="text-6xl animate-rocket" style={{ animationDelay: '0.2s' }}>🎯</div>
            <div className="text-6xl animate-rocket" style={{ animationDelay: '0.4s' }}>📈</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 animate-fadeIn">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-96 transform animate-bounceIn">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 animate-slideInUp">Quiz Admin</h1>
          <p className="text-gray-600 animate-fadeIn" style={{ animationDelay: '0.2s' }}>Login to manage quizzes</p>
        </div>
        
        <div className="space-y-6">
          <div className="animate-slideInLeft" style={{ animationDelay: '0.3s' }}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:shadow-md"
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>          
          <div className="animate-slideInLeft" style={{ animationDelay: '0.4s' }}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:shadow-md"
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>
          
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 active:scale-95 animate-slideInUp disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ animationDelay: '0.5s' }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>
        
        <div className="mt-6 text-center animate-fadeIn" style={{ animationDelay: '0.6s' }}>
          <p className="text-sm text-gray-500">
            🔐 Enter your admin credentials to access the quiz platform
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;