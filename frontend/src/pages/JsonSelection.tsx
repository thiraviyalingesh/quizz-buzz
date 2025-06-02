import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const JsonSelection: React.FC = () => {
  const [quizzes, setQuizzes] = useState<{[key: string]: any}>({});
  const navigate = useNavigate();

  useEffect(() => {
    const storedQuizzes = JSON.parse(localStorage.getItem('quizzes') || '{}');
    setQuizzes(storedQuizzes);
  }, []);

  const handleQuizSelect = (quizName: string) => {
    localStorage.setItem('selectedQuiz', quizName);
    navigate('/student-name');
  };

  const quizNames = Object.keys(quizzes);

  if (quizNames.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-96 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">No Quizzes Found</h1>
          <p className="text-gray-600 mb-6">Please upload a quiz JSON file first.</p>
          <button
            onClick={() => navigate('/upload')}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition duration-200"
          >
            Upload Quiz
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 to-pink-500 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Select Your Quiz</h1>
          <p className="text-white/80">Choose from available quizzes</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizNames.map((quizName, index) => {
            const quiz = quizzes[quizName];
            const questionCount = Array.isArray(quiz) ? quiz.length : 0;
            
            return (
              <div
                key={quizName}
                onClick={() => handleQuizSelect(quizName)}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition duration-200 cursor-pointer"
              >
                <div className="text-center">
                  <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-purple-600">{index + 1}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{quizName}</h3>
                  <p className="text-gray-600 mb-4">{questionCount} Questions</p>
                  <button className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition duration-200">
                    Start Quiz
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default JsonSelection;