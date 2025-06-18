import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ResultPage: React.FC = () => {
  const [score, setScore] = useState<number | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const studentName = localStorage.getItem('studentName') || 'Student';

  useEffect(() => {
    // Check for link-based quiz results first
    const linkResult = localStorage.getItem("linkQuizResult");
    if (linkResult) {
      const result = JSON.parse(linkResult);
      setScore(result.percentage);
      setTotalQuestions(result.total);
      setSubmitted(true);
      
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev === 1) {
            localStorage.removeItem("linkQuizResult");
            navigate("/");
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }

    // Handle regular quiz submission
    const raw = localStorage.getItem("quizSubmissionData");
    if (raw && !submitted) {
      const payload = JSON.parse(raw);
      setTotalQuestions(payload.answers.length);

      axios.post(`${window.location.origin}/quiz/submit`, payload)
        .then(res => {
          console.log("✅ Submitted:", res.data);
          setScore(res.data.score);
          setSubmitted(true);
        })
        .catch(err => {
          console.error("❌ Submission failed:", err);
        });
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev === 1) {
          navigate("/teacher-panel");
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [submitted, navigate]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-green-400 to-blue-600 text-white text-center px-6">
      <h1 className="text-3xl font-bold mb-4">🎉 Quiz Submitted!</h1>
      <p className="text-lg mb-2">Hi <strong>{studentName}</strong>, your submission has been recorded.</p>
      <p className="text-md mb-4">✅ Score: <strong>{score !== null ? `${score}%` : "Calculating..."}</strong></p>
      <p className="text-sm mb-6">You’ll be redirected to the Teacher Panel in {countdown}s.</p>
    </div>
  );
};

export default ResultPage;
