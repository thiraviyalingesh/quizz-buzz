import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface StudentResult {
  studentName: string;
  quizName: string;
  questionsAnswered: number;
  totalQuestions: number;
  timeSpent: string;
  completedAt: string;
  markedQuestions: number;
}

const TeacherPanel: React.FC = () => {
  const [studentResults, setStudentResults] = useState<StudentResult[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load student results from localStorage
    const results = JSON.parse(localStorage.getItem('studentResults') || '[]');
    setStudentResults(results);
    
    // If there are results, select the most recent one
    if (results.length > 0) {
      setSelectedStudent(results[results.length - 1]);
    }
  }, []);

  const generateDemoStats = (student: StudentResult) => {
    const percentage = Math.round((student.questionsAnswered / student.totalQuestions) * 100);
    
    return {
      accuracy: percentage,
      speed: Math.random() > 0.5 ? 'Fast' : 'Average',
      difficulty: {
        easy: Math.floor(Math.random() * 4) + 1,
        medium: Math.floor(Math.random() * 4) + 1,
        hard: Math.floor(Math.random() * 3) + 1,
      },
      topicWise: {
        physics: Math.floor(Math.random() * 60) + 40,
        chemistry: Math.floor(Math.random() * 60) + 40,
        biology: Math.floor(Math.random() * 60) + 40,
      }
    };
  };

  const handleBackToQuiz = () => {
    navigate('/select-quiz');
  };

  if (!selectedStudent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-96 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Teacher Panel</h1>
          <p className="text-gray-600 mb-6">No student results found.</p>
          <button
            onClick={handleBackToQuiz}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
          >
            Back to Quiz Selection
          </button>
        </div>
      </div>
    );
  }

  const stats = generateDemoStats(selectedStudent);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Teacher Analytics Panel</h1>
              <p className="text-gray-600 mt-1">Student Performance Dashboard</p>
            </div>
            <button
              onClick={handleBackToQuiz}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
            >
              New Quiz Session
            </button>
          </div>
        </div>

        {/* Student Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Student Details */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Student Information</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Name:</span>
                <p className="font-semibold text-gray-800">{selectedStudent.studentName}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Quiz:</span>
                <p className="font-semibold text-gray-800">{selectedStudent.quizName}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Completed:</span>
                <p className="font-semibold text-gray-800">{selectedStudent.completedAt}</p>
              </div>
            </div>
          </div>

          {/* Performance Overview */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Performance Overview</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Questions Answered:</span>
                <p className="font-semibold text-green-600">{selectedStudent.questionsAnswered} / {selectedStudent.totalQuestions}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Completion Rate:</span>
                <p className="font-semibold text-blue-600">{stats.accuracy}%</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Marked for Review:</span>
                <p className="font-semibold text-orange-600">{selectedStudent.markedQuestions}</p>
              </div>
            </div>
          </div>

          {/* Time Analysis */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Time Analysis</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Time Spent:</span>
                <p className="font-semibold text-gray-800">{selectedStudent.timeSpent}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Speed:</span>
                <p className="font-semibold text-purple-600">{stats.speed}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Avg per Question:</span>
                <p className="font-semibold text-gray-800">45 seconds</p>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Progress Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Question Progress</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Answered</span>
                  <span>{selectedStudent.questionsAnswered}/{selectedStudent.totalQuestions}</span>
                </div>
                <div className="bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(selectedStudent.questionsAnswered / selectedStudent.totalQuestions) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Marked for Review</span>
                  <span>{selectedStudent.markedQuestions}</span>
                </div>
                <div className="bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-orange-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(selectedStudent.markedQuestions / selectedStudent.totalQuestions) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Not Attempted</span>
                  <span>{selectedStudent.totalQuestions - selectedStudent.questionsAnswered}</span>
                </div>
                <div className="bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-red-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${((selectedStudent.totalQuestions - selectedStudent.questionsAnswered) / selectedStudent.totalQuestions) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Topic-wise Analysis */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Topic-wise Performance (Demo)</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Physics</span>
                  <span>{stats.topicWise.physics}%</span>
                </div>
                <div className="bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${stats.topicWise.physics}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Chemistry</span>
                  <span>{stats.topicWise.chemistry}%</span>
                </div>
                <div className="bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-purple-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${stats.topicWise.chemistry}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Biology</span>
                  <span>{stats.topicWise.biology}%</span>
                </div>
                <div className="bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${stats.topicWise.biology}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Difficulty Analysis */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Difficulty Level Analysis (Demo)</h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-green-600">{stats.difficulty.easy}</span>
              </div>
              <h4 className="font-semibold text-gray-800">Easy Questions</h4>
              <p className="text-sm text-gray-600">Attempted</p>
            </div>
            
            <div className="text-center">
              <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-yellow-600">{stats.difficulty.medium}</span>
              </div>
              <h4 className="font-semibold text-gray-800">Medium Questions</h4>
              <p className="text-sm text-gray-600">Attempted</p>
            </div>
            
            <div className="text-center">
              <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-red-600">{stats.difficulty.hard}</span>
              </div>
              <h4 className="font-semibold text-gray-800">Hard Questions</h4>
              <p className="text-sm text-gray-600">Attempted</p>
            </div>
          </div>
        </div>

        {/* Demo Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-yellow-800">Demo Analytics</h3>
              <p className="text-yellow-700">
                This is a demonstration of the analytics panel. Actual answer analysis and detailed performance metrics will be added when the answer module is implemented.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherPanel;