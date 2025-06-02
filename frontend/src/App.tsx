import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import JsonUpload from './pages/JsonUpload';
import JsonSelection from './pages/JsonSelection';
import StudentName from './pages/StudentName';
import QuizPage from './pages/QuizPage';
import ResultPage from './pages/ResultPage';
import TeacherPanel from './pages/TeacherPanel';
import './styles/tailwind.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<AdminLogin />} />
          <Route path="/upload" element={<JsonUpload />} />
          <Route path="/select-quiz" element={<JsonSelection />} />
          <Route path="/student-name" element={<StudentName />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/results" element={<ResultPage />} />
          <Route path="/teacher-panel" element={<TeacherPanel />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;