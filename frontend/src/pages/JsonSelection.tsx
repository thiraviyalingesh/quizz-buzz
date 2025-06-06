import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const JsonSelection: React.FC = () => {
  const [quizzes, setQuizzes] = useState<{[key: string]: any}>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadPredefinedQuizzes = async () => {
      setLoading(true);
      try {
        const predefinedQuizzes: {[key: string]: any} = {};
        
        // List of known quiz files in quiz_data folder
        const knownQuizFiles = [
          'JEE.json',
          'NEET-2025-Code-48.json',
          '7th std Maths.json',
          '7th std Science.json'
        ];
        
        // Load each quiz file
        for (const filename of knownQuizFiles) {
          try {
            const response = await fetch(`../quiz_data/${filename}`);
            if (response.ok) {
              const quizData = await response.json();
              const quizName = filename.replace('.json', '');
              predefinedQuizzes[quizName] = quizData;
            }
          } catch (error) {
            console.warn(`Could not load ${filename}:`, error);
          }
        }

        // Also load any uploaded quizzes from localStorage
        const storedQuizzes = JSON.parse(localStorage.getItem('quizzes') || '{}');
        
        // Merge predefined and uploaded quizzes
        const allQuizzes = { ...predefinedQuizzes, ...storedQuizzes };
        setQuizzes(allQuizzes);
      } catch (error) {
        console.error('Error loading quizzes:', error);
        // Fallback to localStorage only
        const storedQuizzes = JSON.parse(localStorage.getItem('quizzes') || '{}');
        setQuizzes(storedQuizzes);
      } finally {
        setLoading(false);
      }
    };

    loadPredefinedQuizzes();
  }, []);

  const handleQuizSelect = (quizName: string) => {
    localStorage.setItem('selectedQuiz', quizName);
    localStorage.setItem('selectedQuizData', JSON.stringify(quizzes[quizName]));
    navigate('/student-name');
  };

  const quizNames = Object.keys(quizzes);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-96 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Loading Quizzes...</h1>
          <p className="text-gray-600">Please wait while we load available quizzes.</p>
        </div>
      </div>
    );
  }

  if (quizNames.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-96 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">No Quizzes Found</h1>
          <p className="text-gray-600 mb-6">No quizzes are currently available. You can upload a quiz JSON file.</p>
          <button
            onClick={() => navigate('/upload')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
          >
            Upload Quiz
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 p-8">
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
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-blue-600">{index + 1}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{quizName}</h3>
                  <p className="text-gray-600 mb-4">{questionCount} Questions</p>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition duration-200">
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