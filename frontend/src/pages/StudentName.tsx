import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const StudentName: React.FC = () => {
  const [studentName, setStudentName] = useState('');
  const navigate = useNavigate();

  const handleStartQuiz = () => {
    if (!studentName.trim()) {
      alert('Please enter your name!');
      return;
    }
    
    localStorage.setItem('studentName', studentName.trim());
    navigate('/quiz');
  };

  const selectedQuiz = localStorage.getItem('selectedQuiz') || 'Unknown Quiz';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-96">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Student Information</h1>
          <p className="text-gray-600 mb-2">Quiz: <span className="font-semibold text-blue-600">{selectedQuiz}</span></p>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Your Full Name
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., John Doe"
              onKeyPress={(e) => e.key === 'Enter' && handleStartQuiz()}
            />
          </div>
          
          <button
            onClick={handleStartQuiz}
            disabled={!studentName.trim()}
            className={`w-full py-3 rounded-lg font-semibold transition duration-200 ${
              !studentName.trim()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            🚀 Start Quiz
          </button>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Good luck! 📚✨
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentName;