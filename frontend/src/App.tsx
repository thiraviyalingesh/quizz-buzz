import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import JsonUpload from './pages/JsonUpload';
import JsonSelection from './pages/JsonSelection';
import StudentName from './pages/StudentName';
import QuizPage from './pages/QuizPage';
import ResultPage from './pages/ResultPage';
import TeacherPanel from './pages/TeacherPanel';
import AdminDashboard from './pages/AdminDashboard';
import ExamDashboard from './pages/ExamDashboard';
import ExamDetails from './pages/ExamDetails';
import StudentAnswerDetails from './pages/StudentAnswerDetails';
import SubmissionDetails from './pages/SubmissionDetails';
import './styles/tailwind.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<AdminLogin />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/upload" element={<JsonUpload />} />
          <Route path="/select-quiz" element={<JsonSelection />} />
          <Route path="/student-name" element={<StudentName />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/results" element={<ResultPage />} />
          <Route path="/teacher-panel" element={<TeacherPanel />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/exam-dashboard" element={<ExamDashboard />} />
          <Route path="/exam/:examId" element={<ExamDetails />} />
          <Route path="/exam/:examId/student/:studentIndex" element={<StudentAnswerDetails />} />
          <Route path="/submission/:submissionId" element={<SubmissionDetails />} />
          <Route path="/quiz/:link_id" element={<QuizPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;