import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [isLinkQuiz, setIsLinkQuiz] = useState(false);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [linkData, setLinkData] = useState<any>(null);
  const navigate = useNavigate();
  const { link_id } = useParams();

  const IMAGE_SERVER_BASE = window.location.origin;
  const selectedQuiz = localStorage.getItem('selectedQuiz') || 'Quiz';
  
  // Function to convert image paths to use the correct quiz folder
  const getImagePath = (imagePath: string): string => {
    if (!imagePath) return '';
    
    // Extract filename from path (remove any existing folder prefix)
    const filename = imagePath.split('/').pop() || imagePath;
    
    // For link-based quizzes, use the quiz_id from linkData
    // For regular quizzes, use selectedQuiz from localStorage
    const quizFolder = isLinkQuiz && linkData ? linkData.quiz_id : selectedQuiz;
    
    // Return path using correct quiz folder with cache busting
    return `${IMAGE_SERVER_BASE}/images/${quizFolder}/${filename}?t=${Date.now()}`;
  };

  useEffect(() => {
    if (link_id) {
      // This is a link-based quiz
      setIsLinkQuiz(true);
      setShowStudentForm(true);
      loadQuizByLink();
    } else {
      // Regular quiz flow
      const selectedQuiz = localStorage.getItem('selectedQuiz');
      const selectedQuizData = localStorage.getItem('selectedQuizData');
      
      if (!selectedQuiz || !selectedQuizData) {
        navigate('/select-quiz');
        return;
      }

      try {
        const quizData = JSON.parse(selectedQuizData);
        setQuestions(quizData);
      } catch (error) {
        console.error('Error parsing quiz data:', error);
        alert("Failed to load quiz data.");
        navigate('/select-quiz');
      }
    }
  }, [navigate, link_id]);

  const loadQuizByLink = async () => {
    try {
      const response = await fetch(`/api/quiz/${link_id}`);
      
      if (!response.ok) {
        if (response.status === 403) {
          alert('Maximum student limit reached for this quiz');
        } else if (response.status === 404) {
          alert('Quiz link not found');
        } else {
          alert('Failed to load quiz');
        }
        navigate('/');
        return;
      }

      const data = await response.json();
      setLinkData(data);
      setQuestions(data.questions || []);
    } catch (err) {
      alert('Failed to connect to server');
      navigate('/');
    }
  };

  useEffect(() => {
    // Only start timer when quiz actually begins (not during student form)
    if (questions.length > 0 && (!isLinkQuiz || !showStudentForm)) {
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
    }
  }, [questions.length, isLinkQuiz, showStudentForm]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  const handleAnswerSelect = (questionNumber: number, option: string) => {
    const wasAnswered = answers[questionNumber];
    setAnswers(prev => ({
      ...prev,
      [questionNumber]: option
    }));
    
    // Gamification: Add points for new answers
    if (!wasAnswered) {
      setPoints(prev => prev + 10);
      setShowPointsAnimation(true);
      setTimeout(() => setShowPointsAnimation(false), 1000);
      
      // Add haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
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

  const handleSubmitQuiz = async () => {
    if (isLinkQuiz && link_id && studentInfo) {
      // Link-based quiz submission
      const submission = {
        link_id,
        name: studentInfo.name,
        class_name: studentInfo.class_name,
        section: studentInfo.section,
        answers: Object.entries(answers).map(([qNum, option]) => ({
          questionNumber: parseInt(qNum),
          selectedOption: option.charCodeAt(0) - 65,
          timeSpent: 10,
          isMarked: markedForReview.has(parseInt(qNum))
        })),
        totalTimeSpent: formatTime(10 * 60 - timeLeft)
      };

      try {
        const response = await fetch(`/api/quiz/${link_id}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submission)
        });

        if (!response.ok) {
          if (response.status === 409) {
            alert('You have already submitted this quiz');
          } else if (response.status === 403) {
            alert('Maximum student limit reached');
          } else {
            alert('Failed to submit quiz');
          }
          return;
        }

        const result = await response.json();
        
        // Store results for display
        localStorage.setItem('linkQuizResult', JSON.stringify({
          score: result.score,
          total: result.total,
          percentage: result.percentage,
          studentName: studentInfo.name
        }));

        navigate('/results');
      } catch (err) {
        alert('Failed to submit quiz. Please try again.');
      }
    } else {
      // Regular quiz submission
      const quizSubmissionData = {
        studentName: localStorage.getItem('studentName') || 'Unknown',
        studentEmail: localStorage.getItem('studentEmail') || 'info@buzztrackers.com',
        quizName: localStorage.getItem('selectedQuiz') || 'Unknown Quiz',
        answers: Object.entries(answers).map(([qNum, option]) => ({
          questionNumber: parseInt(qNum),
          selectedOption: option.charCodeAt(0) - 65,
          timeSpent: 10,
          isMarked: markedForReview.has(parseInt(qNum))
        })),
        totalTimeSpent: "00:10:00",
        submittedAt: new Date().toISOString()
      };

      localStorage.setItem("quizSubmissionData", JSON.stringify(quizSubmissionData));

      if (window.confirm('Are you sure you want to submit the quiz?')) {
        // Gamification: Calculate bonus points
        let bonusPoints = 0;
        const completionRate = (answeredCount / questions.length) * 100;
        
        if (completionRate === 100) bonusPoints += 50;
        if (markedForReview.size === 0) bonusPoints += 25;
        if (timeLeft > (10 * 60 * 0.5)) bonusPoints += 30;
        
        const totalPoints = points + bonusPoints;
        setPoints(totalPoints);
        
        localStorage.setItem('quizAnswers', JSON.stringify(answers));
        localStorage.setItem('quizPoints', totalPoints.toString());
        localStorage.setItem('quizStreak', (streak + 1).toString());
        
        navigate('/results');
      }
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

  // Student form for link-based quizzes
  if (isLinkQuiz && showStudentForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Student Information</h1>
            <p className="text-gray-600">Please enter your details to start the quiz</p>
            {linkData && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  Quiz: {linkData.quiz_id} | Students: {linkData.current_count}/{linkData.max_allowed}
                </p>
              </div>
            )}
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const studentData = {
              name: formData.get('name') as string,
              class_name: formData.get('class_name') as string,
              section: formData.get('section') as string
            };
            
            if (!studentData.name.trim() || !studentData.class_name.trim() || !studentData.section.trim()) {
              alert('Please fill in all fields');
              return;
            }

            setStudentInfo(studentData);
            setShowStudentForm(false);
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class *
              </label>
              <input
                type="text"
                name="class_name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 10, 11, 12"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Section *
              </label>
              <input
                type="text"
                name="section"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., A, B, C"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
            >
              Start Quiz
            </button>
          </form>
        </div>
      </div>
    );
  }

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
    <div className="h-screen bg-gray-100 flex flex-col animate-fadeIn">
      {/* Fixed Header - Enhanced Mobile */}
      <div className="bg-blue-700 text-white p-3 md:p-4 flex justify-between items-center flex-shrink-0 relative animate-slideDown">
        <div className="flex items-center space-x-2 md:space-x-6">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden bg-blue-600 p-2 rounded-lg hover:bg-blue-800 transition-all duration-300 transform hover:scale-110 active:scale-95"
          >
            <svg className={`w-5 h-5 transform transition-transform duration-300 ${showMobileMenu ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div>
            <h1 className="text-lg md:text-xl font-bold animate-pulse">
              {selectedQuiz === 'NEET-2025-Code-48' ? 'NEET EXAM' : selectedQuiz.replace(/-/g, ' ')}
            </h1>
            <div className="text-xs md:text-sm">
              Question {currentQuestion.questionNumber} of {questions.length}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          {/* Gamification Points */}
          <div className="hidden md:flex items-center space-x-4 mb-1">
            <div className="text-sm transform hover:scale-110 transition-transform duration-300 relative">
              <span className={`text-yellow-300 ${showPointsAnimation ? 'animate-bounce' : 'animate-bounce'}`}>⭐ {points} pts</span>
              {showPointsAnimation && (
                <span className="absolute -top-2 -right-2 text-green-400 text-xs font-bold animate-bounceIn">+10</span>
              )}
            </div>
            <div className="text-sm transform hover:scale-110 transition-transform duration-300">
              <span className="text-green-300 animate-pulse">🔥 {streak} streak</span>
            </div>
          </div>
          <div className="text-lg font-bold text-red-300 animate-pulse">
            ⏰ {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Content - Scrollable */}
        <div className="flex-1 flex flex-col overflow-hidden p-2 md:p-4">
          {/* Question Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-white rounded-lg shadow-sm animate-slideInLeft">
            {/* Question Text */}
            <div className="mb-4 md:mb-6 animate-fadeIn">
              <p className="text-base md:text-lg font-medium text-gray-800 leading-relaxed">
                {currentQuestion.questionText}
              </p>
            </div>

            {/* Question Images - Mobile Optimized */}
            {currentQuestion.question_images && currentQuestion.question_images.length > 0 && (
              <div className="mb-4 md:mb-6 animate-slideInUp">
                <div className="flex flex-col md:flex-row md:flex-wrap gap-3 md:gap-4">
                  {currentQuestion.question_images.map((imagePath, index) => (
                    <div key={index} className="border rounded-lg p-2 md:p-3 bg-gray-50 w-full md:w-auto transform hover:scale-105 transition-all duration-300 hover:shadow-lg">
                      <img
                        src={imagePath.includes('cdn.mathpix.com') || imagePath.startsWith('http') ? imagePath : getImagePath(imagePath)}
                        alt={`Diagram ${index + 1}`}
                        className="max-h-48 md:max-h-64 w-full md:w-auto object-contain rounded cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-102"
                        onClick={() => setSelectedImage(imagePath.includes('cdn.mathpix.com') || imagePath.startsWith('http') ? imagePath : getImagePath(imagePath))}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                        onContextMenu={(e) => e.preventDefault()}
                        draggable={false}
                      />
                      <p className="text-center text-xs md:text-sm text-gray-600 mt-2">Diagram {index + 1}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Answer Options - Modern Card Design */}
            <div className="mb-4 md:mb-6">
              <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4 animate-fadeIn">Select your answer:</h3>
              <div className="space-y-2 md:space-y-3">
                {currentQuestion.option_with_images_.map((option, index) => {
                  const optionLabel = String.fromCharCode(65 + index);
                  const isSelected = answers[currentQuestion.questionNumber] === optionLabel;

                  // Parse comma-separated format: "text, image_url" or "text,, image_url"
                  const parts = option.includes(',,') ? option.split(',,') : option.split(',');
                  const optionText = parts[0].trim();
                  const imageUrl = parts.length > 1 && parts[1].trim() ? parts[1].trim() : null;
                  const isImageOption = imageUrl && (imageUrl.includes('.png') || imageUrl.includes('.jpg') || imageUrl.includes('.jpeg'));

                  
                  return (
                    <div
                      key={index}
                      onClick={() => handleAnswerSelect(currentQuestion.questionNumber, optionLabel)}
                      className={`group relative cursor-pointer transition-all duration-300 transform hover:scale-[1.02] animate-slideInRight ${
                        isSelected 
                          ? 'scale-[1.02]' 
                          : ''
                      }`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className={`p-3 md:p-4 border-2 rounded-xl transition-all duration-300 ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200 animate-pulse' 
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 hover:shadow-md'
                      }`}>
                        <div className="flex items-start space-x-3 md:space-x-4">
                          {/* Custom Radio Button */}
                          <div className={`flex-shrink-0 w-6 h-6 md:w-7 md:h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-500 animate-bounceIn' 
                              : 'border-gray-300 group-hover:border-blue-400'
                          }`}>
                            {isSelected && (
                              <svg className="w-3 h-3 md:w-4 md:h-4 text-white animate-checkmark" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            {/* Option Label Badge */}
                            <div className="flex items-start space-x-2 md:space-x-3">
                              <span className={`inline-flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full text-xs md:text-sm font-bold transition-all duration-300 ${
                                isSelected 
                                  ? 'bg-blue-500 text-white animate-bounceIn' 
                                  : 'bg-gray-200 text-gray-700 group-hover:bg-blue-200'
                              }`}>
                                {optionLabel}
                              </span>
                              
                              <div className="flex-1">
                                {/* Always show text if present */}
                                {optionText && (
                                  <span className="text-sm md:text-base text-gray-800 leading-relaxed">{optionText}</span>
                                )}

                                {/* Show image if present */}
                                {isImageOption && imageUrl && (
                                  <div className="mt-2">
                                    <img
                                      src={imageUrl.includes('cdn.mathpix.com') || imageUrl.startsWith('http') ? imageUrl : getImagePath(imageUrl)}
                                      alt={`Option ${optionLabel} Image`}
                                      className="max-h-16 md:max-h-20 object-contain rounded border cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedImage(imageUrl.includes('cdn.mathpix.com') || imageUrl.startsWith('http') ? imageUrl : getImagePath(imageUrl));
                                      }}
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                      onContextMenu={(e) => e.preventDefault()}
                                      draggable={false}
                                    />
                                  </div>
                                )}

                                {/* Fallback for old format - if no comma separator detected */}
                                {!optionText && !imageUrl && (
                                  <span className="text-sm md:text-base text-gray-800 leading-relaxed">{option}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Selection Animation */}
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-bounceIn">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Fixed Action Buttons - Mobile Responsive */}
          <div className="bg-white mt-2 md:mt-4 p-3 md:p-4 rounded-lg shadow-sm flex-shrink-0">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
              <button
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
                className={`w-full md:w-auto flex items-center justify-center px-4 py-2 rounded-lg font-medium ${
                  currentQuestionIndex === 0
                    ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                ← Previous
              </button>

              <div className="flex flex-wrap justify-center gap-2 md:space-x-3">
                <button
                  onClick={handleMarkForReview}
                  className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base ${
                    markedForReview.has(currentQuestion.questionNumber)
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  }`}
                >
                  Mark Review
                </button>
                
                <button
                  onClick={clearResponse}
                  className="px-3 md:px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium text-sm md:text-base"
                >
                  Clear
                </button>
                
                <button
                  onClick={handleSubmitQuiz}
                  className="px-3 md:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm md:text-base"
                >
                  Submit Quiz
                </button>
              </div>

              <button
                onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                disabled={currentQuestionIndex === questions.length - 1}
                className={`w-full md:w-auto flex items-center justify-center px-4 py-2 rounded-lg font-medium ${
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
        {/* Right Sidebar - Mobile Responsive with Overlay */}
        <div className={`${showMobileMenu ? 'fixed inset-0 z-40' : 'hidden'} md:relative md:block`}>
          {/* Mobile Overlay */}
          {showMobileMenu && (
            <div 
              className="absolute inset-0 bg-black bg-opacity-50 md:hidden"
              onClick={() => setShowMobileMenu(false)}
            />
          )}
          
          {/* Sidebar Content */}
          <div className={`${
            showMobileMenu 
              ? 'fixed top-0 right-0 h-full w-80 z-50 transform translate-x-0' 
              : 'hidden'
          } md:relative md:block md:w-80 md:transform-none bg-white flex-shrink-0 flex flex-col space-y-4 p-4 overflow-y-auto transition-transform duration-300 ease-in-out`}>
            
            {/* Mobile Close Button */}
            {showMobileMenu && (
              <button
                onClick={() => setShowMobileMenu(false)}
                className="md:hidden self-end p-2 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Mobile Stats Bar */}
            <div className="md:hidden bg-blue-50 p-3 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-blue-600 font-medium">⭐ {points} pts</span>
                <span className="text-green-600 font-medium">🔥 {streak} streak</span>
              </div>
            </div>
          
            {/* Question Palette Card */}
            <div className="bg-white rounded-lg shadow-md border p-4">
              <h3 className="text-base font-bold text-gray-800 mb-3">Question Palette</h3>
              
              {/* Question Numbers Grid */}
              <div className="max-h-64 overflow-y-auto">
                <div className="grid grid-cols-5 gap-1.5 mb-3">
                  {questions.map((question, index) => {
                  const status = getQuestionStatus(question.questionNumber);
                  
                  let bgColor = 'bg-gray-300 text-gray-700';
                  if (status === 'current') bgColor = 'bg-blue-600 text-white ring-2 ring-blue-300';
                  else if (status === 'answered-marked') bgColor = 'bg-purple-500 text-white';
                  else if (status === 'answered') bgColor = 'bg-green-500 text-white';
                  else if (status === 'marked') bgColor = 'bg-orange-500 text-white';
                  
                  return (
                    <button
                      key={question.questionNumber}
                      onClick={() => {
                        setCurrentQuestionIndex(index);
                        setShowMobileMenu(false);
                      }}
                      className={`w-8 h-8 md:w-9 md:h-9 rounded-full font-bold text-xs transition-all duration-200 hover:scale-105 ${bgColor}`}
                    >
                      {question.questionNumber}
                    </button>
                  );
                })}
                </div>
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
            <div className="bg-white rounded-lg shadow-md border p-4">
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
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-md p-4">
              <h4 className="text-base font-bold text-yellow-800 mb-3">Instructions</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Select one option per question</li>
                <li>• Use Mark for Review for later</li>
                <li>• Clear Response to deselect</li>
                <li>• Submit when ready</li>
              </ul>
            </div>

            {/* Gamification Stats Card */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg shadow-md p-4">
              <h4 className="text-base font-bold text-purple-800 mb-3">Your Score</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-purple-700">Points Earned</span>
                  <span className="font-bold text-purple-800 text-lg">{points}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-purple-700">Current Streak</span>
                  <span className="font-bold text-purple-800">{streak} 🔥</span>
                </div>
                <div className="mt-3 p-2 bg-white rounded-lg">
                  <div className="text-xs text-center text-gray-600">
                    +10 pts per answer • +50 pts perfect score
                  </div>
                </div>
              </div>
            </div>
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
// PATCHED ✅ to store quizSubmissionData to localStorage
