import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface QuizQuestion {
  questionNumber: number;
  questionText: string;
  question_images?: string[];
  option_with_images_: string[];
}

const QuizPage: React.FC = () => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{[key: number]: string}>({});
  const [timeLeft, setTimeLeft] = useState(10 * 60); // 10 minutes in seconds (configurable)
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const navigate = useNavigate();

  const IMAGE_SERVER_BASE = "http://localhost:8000";

  useEffect(() => {
    // Load selected quiz
    const selectedQuiz = localStorage.getItem('selectedQuiz');
    if (!selectedQuiz) {
      navigate('/select-quiz');
      return;
    }

    const quizzes = JSON.parse(localStorage.getItem('quizzes') || '{}');
    const quizData = quizzes[selectedQuiz];
    if (!quizData) {
      alert('Quiz not found!');
      navigate('/select-quiz');
      return;
    }

    setQuestions(quizData);
  }, [navigate]);

  useEffect(() => {
    // Timer countdown
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  const handleAnswerSelect = (questionNumber: number, option: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionNumber]: option
    }));
  };

  const handleMarkForReview = () => {
    const currentQ = questions[currentQuestionIndex];
    setMarkedForReview(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQ.questionNumber)) {
        newSet.delete(currentQ.questionNumber);
      } else {
        newSet.add(currentQ.questionNumber);
      }
      return newSet;
    });
  };

  const clearResponse = () => {
    const currentQ = questions[currentQuestionIndex];
    setAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[currentQ.questionNumber];
      return newAnswers;
    });
  };

  const handleSubmitQuiz = () => {
    if (window.confirm('Are you sure you want to submit the quiz?')) {
      localStorage.setItem('quizAnswers', JSON.stringify(answers));
      navigate('/results');
    }
  };

  const getQuestionStatus = (questionNumber: number) => {
    const isAnswered = answers[questionNumber];
    const isMarked = markedForReview.has(questionNumber);
    const isCurrent = questions[currentQuestionIndex]?.questionNumber === questionNumber;

    if (isCurrent) return 'current';
    if (isAnswered && isMarked) return 'answered-marked';
    if (isAnswered) return 'answered';
    if (isMarked) return 'marked';
    return 'not-visited';
  };

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const selectedQuiz = localStorage.getItem('selectedQuiz') || 'Quiz';

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Fixed Header */}
      <div className="bg-blue-700 text-white p-4 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center space-x-6">
          <h1 className="text-xl font-bold">{selectedQuiz.replace(/-/g, ' ')} | Physics</h1>
          <div className="text-sm">
            Question {currentQuestion.questionNumber} of {questions.length}
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-red-300">
            ⏰ {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Main Content - Fixed Height with Flex */}
      <div className="flex flex-1 overflow-hidden gap-4 p-4">
        {/* Left Content - Scrollable */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Question Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 bg-white rounded-lg shadow-sm">
            {/* Question Text */}
            <div className="mb-6">
              <p className="text-lg font-medium text-gray-800 leading-relaxed">
                {currentQuestion.questionText}
              </p>
            </div>

            {/* Question Images - Only show if images exist */}
            {currentQuestion.question_images && currentQuestion.question_images.length > 0 && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-4">
                  {currentQuestion.question_images.map((imagePath, index) => (
                    <div key={index} className="border rounded-lg p-3 bg-gray-50">
                      <img
                        src={`${IMAGE_SERVER_BASE}/${imagePath}`}
                        alt={`Diagram ${index + 1}`}
                        className="max-h-64 object-contain rounded cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => setSelectedImage(`${IMAGE_SERVER_BASE}/${imagePath}`)}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                        onContextMenu={(e) => e.preventDefault()} // Prevent right-click
                        draggable={false} // Prevent dragging
                      />
                      <p className="text-center text-sm text-gray-600 mt-2">Diagram {index + 1}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Answer Options */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Select your answer:</h3>
              <div className="space-y-3">
                {currentQuestion.option_with_images_.map((option, index) => {
                  const optionLabel = String.fromCharCode(65 + index); // A, B, C, D
                  const isSelected = answers[currentQuestion.questionNumber] === optionLabel;
                  const isImageOption = option.includes('.png') || option.includes('.jpg') || option.includes('.jpeg');
                  
                  return (
                    <label
                      key={index}
                      className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                          : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.questionNumber}`}
                        value={optionLabel}
                        checked={isSelected}
                        onChange={() => handleAnswerSelect(currentQuestion.questionNumber, optionLabel)}
                        className="mt-1 mr-4 w-4 h-4 text-blue-600"
                      />
                      <div className="flex-1">
                        <span className="font-semibold text-blue-600 mr-2">({optionLabel})</span>
                        {isImageOption ? (
                          <div className="mt-2">
                            <img
                              src={`${IMAGE_SERVER_BASE}/${option}`}
                              alt={`Option ${optionLabel}`}
                              className="max-h-20 object-contain rounded border cursor-pointer hover:shadow-lg transition-shadow"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent radio button selection
                                setSelectedImage(`${IMAGE_SERVER_BASE}/${option}`);
                              }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                              onContextMenu={(e) => e.preventDefault()} // Prevent right-click
                              draggable={false} // Prevent dragging
                            />
                          </div>
                        ) : (
                          <span className="text-gray-800">{option}</span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Fixed Action Buttons */}
          <div className="bg-white mt-4 p-4 rounded-lg shadow-sm flex-shrink-0">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
                className={`flex items-center px-4 py-2 rounded-lg font-medium ${
                  currentQuestionIndex === 0
                    ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                ← Previous
              </button>

              <div className="flex space-x-3">
                <button
                  onClick={handleMarkForReview}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    markedForReview.has(currentQuestion.questionNumber)
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  }`}
                >
                  Mark for Review
                </button>
                
                <button
                  onClick={clearResponse}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
                >
                  Clear Response
                </button>
                
                <button
                  onClick={handleSubmitQuiz}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                >
                  Submit Quiz
                </button>
              </div>

              <button
                onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                disabled={currentQuestionIndex === questions.length - 1}
                className={`flex items-center px-4 py-2 rounded-lg font-medium ${
                  currentQuestionIndex === questions.length - 1
                    ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
        {/* Right Sidebar - Card-based Design with Proper Spacing */}
        <div className="w-80 flex-shrink-0 flex flex-col space-y-4">
          
          {/* Question Palette Card - Made Smaller */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-base font-bold text-gray-800 mb-3">Question Palette</h3>
            
            {/* Question Numbers Grid */}
            <div className="grid grid-cols-5 gap-1.5 mb-3">
              {questions.map((question, index) => {
                const status = getQuestionStatus(question.questionNumber);
                
                let bgColor = 'bg-gray-300 text-gray-700'; // not-visited
                if (status === 'current') bgColor = 'bg-blue-600 text-white ring-2 ring-blue-300';
                else if (status === 'answered-marked') bgColor = 'bg-purple-500 text-white';
                else if (status === 'answered') bgColor = 'bg-green-500 text-white';
                else if (status === 'marked') bgColor = 'bg-orange-500 text-white';
                
                return (
                  <button
                    key={question.questionNumber}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`w-8 h-8 rounded-full font-bold text-xs transition-all duration-200 hover:scale-105 ${bgColor}`}
                  >
                    {question.questionNumber}
                  </button>
                );
              })}
            </div>

            {/* Legend - Compact */}
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Legend:</h4>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-4 bg-blue-600 rounded-full text-white flex items-center justify-center text-xs font-bold">4</div>
                  <span className="text-gray-600">Current</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-4 bg-green-500 rounded-full text-white flex items-center justify-center text-xs font-bold">1</div>
                  <span className="text-gray-600">Answered</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-4 bg-orange-500 rounded-full text-white flex items-center justify-center text-xs font-bold">2</div>
                  <span className="text-gray-600">Marked</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-4 bg-purple-500 rounded-full text-white flex items-center justify-center text-xs font-bold">3</div>
                  <span className="text-gray-600">Both</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Card */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h4 className="text-base font-bold text-gray-800 mb-3">Progress</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Answered</span>
                <span className="font-semibold text-green-600">{answeredCount} / {questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Marked</span>
                <span className="font-semibold text-orange-600">{markedForReview.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Remaining</span>
                <span className="font-semibold text-gray-800">{questions.length - answeredCount}</span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-3">
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1 text-center font-medium">
                {Math.round((answeredCount / questions.length) * 100)}% Complete
              </p>
            </div>
          </div>

          {/* Instructions Card */}
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg shadow-md">
            <h4 className="text-base font-bold text-yellow-800 mb-3">Instructions</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Select one option per question</li>
              <li>• Use Mark for Review for later</li>
              <li>• Clear Response to deselect</li>
              <li>• Please do not change Tab while attending quizz, or quizz will be locked</li>
              <li>• Submit when ready</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full p-4">
            {/* Close button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 bg-white rounded-full p-2 hover:bg-gray-200 transition-colors z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Image */}
            <img
              src={selectedImage}
              alt="Enlarged view"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
              onContextMenu={(e) => e.preventDefault()} // Prevent right-click
              draggable={false} // Prevent dragging
              style={{ userSelect: 'none' }} // Prevent text selection
            />
            
            {/* Instructions */}
            <p className="text-white text-center mt-4 text-sm">
              Click outside the image or press the × button to close
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizPage;