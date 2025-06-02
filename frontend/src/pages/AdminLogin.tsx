import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    // Empty username and password for admin access
    if (username === '' && password === '') {
      navigate('/upload');
    } else {
      alert('Invalid credentials! Use empty username and password.');
    }
  };

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
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:shadow-md"
              placeholder="Leave empty for admin"
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
              placeholder="Leave empty for admin"
            />
          </div>
          
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 active:scale-95 animate-slideInUp"
            style={{ animationDelay: '0.5s' }}
          >
            Login
          </button>
        </div>
        
        <div className="mt-6 text-center animate-fadeIn" style={{ animationDelay: '0.6s' }}>
          <p className="text-sm text-gray-500">
            💡 Tip: Leave both fields empty for admin access
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;