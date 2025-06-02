import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ResultPage: React.FC = () => {
  const [score, setScore] = useState<number | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const navigate = useNavigate();

  const studentName = localStorage.getItem('studentName') || 'Student';
  const selectedQuiz = localStorage.getItem('selectedQuiz') || 'Unknown Quiz';

  useEffect(() => {
    const calculateScore = () => {
      const answers = JSON.parse(localStorage.getItem('quizAnswers') || '{}');
      const quizzes = JSON.parse(localStorage.getItem('quizzes') || '{}');
      const questions = quizzes[selectedQuiz] || [];
      
      setTotalQuestions(questions.length);
      
      // For now, just count answered questions
      // In a real implementation, you'd compare with correct answers
      const answeredCount = Object.keys(answers).length;
      setScore(answeredCount);
    };

    calculateScore();
  }, [selectedQuiz]);

  const handleBackToHome = () => {
    // Clear quiz data
    localStorage.removeItem('selectedQuiz');
    localStorage.removeItem('studentName');
    localStorage.removeItem('quizAnswers');
    navigate('/select-quiz');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-96 text-center">
        <div className="mb-6">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🎉</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Quiz Completed!</h1>
          <p className="text-gray-600">Great job on finishing the quiz</p>
        </div>
        
        <div className="space-y-4 mb-8">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Student Name</p>
            <p className="text-lg font-semibold text-gray-800">{studentName}</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Quiz</p>
            <p className="text-lg font-semibold text-gray-800">{selectedQuiz}</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600">Questions Answered</p>
            <p className="text-2xl font-bold text-blue-800">
              {score} / {totalQuestions}
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={handleBackToHome}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
          >
            Take Another Quiz
          </button>
          
          <p className="text-sm text-gray-500">
            📧 Check your email for detailed results
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;