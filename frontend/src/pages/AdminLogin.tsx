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

  // Get API base URL from environment - use current domain for tunnels
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 
    (process.env.NODE_ENV === 'production' ? window.location.origin : 'http://localhost:8080');

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
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 animate-fadeIn overflow-hidden">
      <div className="container mx-auto px-4 h-full">
        <div className="flex items-center justify-center h-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl w-full h-full max-h-screen">
            
            {/* Left Side - Illustration */}
            <div className="flex flex-col items-center justify-center text-center animate-slideInLeft">
              <div className="mb-4">
                <img 
                  src="/login-illustration.png" 
                  alt="UI/UX Designers Working" 
                  className="w-full max-w-md h-auto animate-float"
                />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 animate-slideInUp">
                  Welcome to
                </h1>
                <h2 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-slideInUp" style={{ animationDelay: '0.2s' }}>
                  Buzztrackers
                </h2>
                <p className="text-sm text-gray-600 animate-slideInUp" style={{ animationDelay: '0.4s' }}>
                  Create, manage and analyze quizzes with powerful insights
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500 animate-fadeIn" style={{ animationDelay: '0.6s' }}>
                  <div className="flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    <span>Easy Quiz Creation</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    <span>Real-time Analytics</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                    <span>Student Management</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex items-center justify-center animate-slideInRight">
              <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-3">
                    <span className="text-lg text-white">🔐</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">Admin Login</h3>
                  <p className="text-sm text-gray-600">Access your quiz management dashboard</p>
                </div>
                
                <div className="space-y-4">
                  <div className="animate-slideInLeft" style={{ animationDelay: '0.3s' }}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      📧 Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-gray-300"
                      placeholder="Enter your email"
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="animate-slideInLeft" style={{ animationDelay: '0.4s' }}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      🔒 Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-gray-300"
                      placeholder="Enter your password"
                      disabled={loading}
                    />
                  </div>
                  
                  <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 active:scale-95 animate-slideInUp disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    style={{ animationDelay: '0.5s' }}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Logging in...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <span>🚀 Login to Dashboard</span>
                      </div>
                    )}
                  </button>
                </div>
                
                <div className="mt-4 text-center animate-fadeIn" style={{ animationDelay: '0.6s' }}>
                  <p className="text-xs text-gray-500">
                    🛡️ Secure admin access to quiz management platform
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;