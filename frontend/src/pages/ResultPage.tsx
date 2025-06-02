import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ResultPage: React.FC = () => {
  const [score, setScore] = useState<number | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [showConfetti, setShowConfetti] = useState(false);
  const navigate = useNavigate();

  const studentName = localStorage.getItem('studentName') || 'Student';
  const selectedQuiz = localStorage.getItem('selectedQuiz') || 'Unknown Quiz';

  useEffect(() => {
    const calculateScore = () => {
      const answers = JSON.parse(localStorage.getItem('quizAnswers') || '{}');
      const quizzes = JSON.parse(localStorage.getItem('quizzes') || '{}');
      const questions = quizzes[selectedQuiz] || [];
      const points = parseInt(localStorage.getItem('quizPoints') || '0');
      const streak = parseInt(localStorage.getItem('quizStreak') || '0');
      
      setTotalQuestions(questions.length);
      
      // For now, just count answered questions
      // In a real implementation, you'd compare with correct answers
      const answeredCount = Object.keys(answers).length;
      setScore(answeredCount);

      // Save student result to localStorage for teacher panel
      const studentResult = {
        studentName,
        quizName: selectedQuiz,
        questionsAnswered: answeredCount,
        totalQuestions: questions.length,
        timeSpent: '8 minutes 34 seconds', // Demo time
        completedAt: new Date().toLocaleString(),
        markedQuestions: Math.floor(Math.random() * 3), // Demo marked questions
        points: points,
        streak: streak,
        badges: calculateBadges(answeredCount, questions.length, points)
      };

      // Save to student results array
      const existingResults = JSON.parse(localStorage.getItem('studentResults') || '[]');
      existingResults.push(studentResult);
      localStorage.setItem('studentResults', JSON.stringify(existingResults));
      
      // Trigger confetti animation
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    };

    const calculateBadges = (answered: number, total: number, points: number) => {
      const badges = [];
      const percentage = (answered / total) * 100;
      
      if (percentage === 100) badges.push('Perfect Completion');
      if (percentage >= 80) badges.push('High Achiever');
      if (points >= 200) badges.push('Point Master');
      if (points >= 100) badges.push('Century Club');
      
      return badges;
    };

    calculateScore();
  }, [selectedQuiz, studentName]);

  useEffect(() => {
    // 5-second countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Redirect to teacher panel after countdown
          navigate('/teacher-panel');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleBackToHome = () => {
    // Clear quiz data
    localStorage.removeItem('selectedQuiz');
    localStorage.removeItem('studentName');
    localStorage.removeItem('quizAnswers');
    navigate('/select-quiz');
  };

  const handleGoToTeacherPanel = () => {
    navigate('/teacher-panel');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                backgroundColor: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'][Math.floor(Math.random() * 5)]
              }}
            />
          ))}
        </div>
      )}
      
      <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-md transform animate-bounceIn">
        <div className="mb-6">
          {/* Animated Success Icon */}
          <div className="w-20 h-20 md:w-24 md:h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
            <span className="text-3xl md:text-4xl animate-bounce">🎉</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 text-center animate-slideInUp">Quiz Completed!</h1>
          <p className="text-gray-600 text-center animate-fadeIn" style={{ animationDelay: '0.2s' }}>Great job on finishing the quiz</p>
        </div>
        
        <div className="space-y-4 mb-8">
          <div className="bg-gray-50 p-4 rounded-lg animate-slideInLeft" style={{ animationDelay: '0.3s' }}>
            <p className="text-sm text-gray-600">Student Name</p>
            <p className="text-lg font-semibold text-gray-800">{studentName}</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg animate-slideInLeft" style={{ animationDelay: '0.4s' }}>
            <p className="text-sm text-gray-600">Quiz</p>
            <p className="text-lg font-semibold text-gray-800">{selectedQuiz}</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg animate-slideInLeft" style={{ animationDelay: '0.5s' }}>
            <p className="text-sm text-blue-600">Questions Answered</p>
            <p className="text-2xl font-bold text-blue-800 animate-bounce">
              {score} / {totalQuestions}
            </p>
          </div>

          {/* Gamification Results */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 p-4 rounded-lg animate-slideInLeft animate-glow" style={{ animationDelay: '0.6s' }}>
            <p className="text-sm text-purple-600 mb-2">Your Performance</p>
            <div className="flex justify-between items-center mb-2">
              <span className="text-purple-700">Points Earned</span>
              <span className="text-xl font-bold text-purple-800 animate-bounce">
                {parseInt(localStorage.getItem('quizPoints') || '0')} 🌟
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-purple-700">Quiz Streak</span>
              <span className="text-lg font-bold text-purple-800 animate-pulse">
                {parseInt(localStorage.getItem('quizStreak') || '0')} 🔥
              </span>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={handleBackToHome}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 animate-slideInUp"
            style={{ animationDelay: '0.7s' }}
          >
            Take Another Quiz
          </button>
          
          <button
            onClick={handleGoToTeacherPanel}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-all duration-300 transform hover:scale-105 animate-slideInUp"
            style={{ animationDelay: '0.8s' }}
          >
            View Teacher Panel Now
          </button>
          
          <div className="text-center mt-4 animate-fadeIn" style={{ animationDelay: '0.9s' }}>
            <p className="text-sm text-gray-500 animate-pulse">
              📊 Redirecting to Teacher Panel in <span className="font-bold text-blue-600">{countdown}</span> seconds...
            </p>
          </div>
          
          <p className="text-sm text-gray-500 text-center animate-fadeIn" style={{ animationDelay: '1s' }}>
            📧 Check your email for detailed results
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;