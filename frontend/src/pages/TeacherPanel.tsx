import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface QuestionDetail {
  questionNumber: number;
  questionText: string;
  selectedOption: number | null;
  correctAnswer: string;
  isCorrect: boolean;
}

interface StudentResult {
  studentName: string;
  studentEmail: string;
  quizName: string;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  score: number;
  timeSpent: string;
  submittedAt: string;
  detailedResults: QuestionDetail[];
}

const TeacherPanel: React.FC = () => {
  const [report, setReport] = useState<StudentResult | null>(null);
  const [quizData, setQuizData] = useState<any | null>(null);
  const [showAccordion, setShowAccordion] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${window.location.origin}/teacher/results`)
      .then(res => res.json())
      .then(data => {
        if (data.results && data.results.length > 0) {
          const latest = data.results[data.results.length - 1];
          const totalQuestions = latest.detailedResults.length;
          const correctAnswers = latest.detailedResults.filter((q: QuestionDetail) => q.isCorrect).length;
          const answeredQuestions = latest.detailedResults.filter((q: QuestionDetail) => q.selectedOption !== null).length;
          const score = Math.round((correctAnswers / totalQuestions) * 100);

          setReport({
            ...latest,
            totalQuestions,
            correctAnswers,
            answeredQuestions,
            score,
          });
        }
      });
  }, []);

  useEffect(() => {
    if (report?.quizName) {
      const filePath = `/quiz_data/${report.quizName}.json`;
      fetch(filePath)
        .then(res => res.json())
        .then(data => setQuizData(data))
        .catch(err => {
          console.error("❌ Quiz file not found", err);
          setQuizData(null);
        });
    }
  }, [report]);

  const downloadPDF = () => {
    setShowAccordion(false);
    setTimeout(() => {
      const element = document.getElementById('pdf-only-area');
      const opt = {
        margin: 0.3,
        filename: `${report?.studentName}_report.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, backgroundColor: null, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };

      if (element) {
        const watermarkWrapper = document.createElement('div');
        watermarkWrapper.style.position = 'absolute';
        watermarkWrapper.style.top = '0';
        watermarkWrapper.style.left = '0';
        watermarkWrapper.style.width = '100%';
        watermarkWrapper.style.height = '100%';
        watermarkWrapper.style.zIndex = '0';
        watermarkWrapper.style.pointerEvents = 'none';

        const logo = document.createElement('img');
        logo.src = '/buzz_logo.png';
        logo.style.position = 'absolute';
        logo.style.top = '40%';
        logo.style.left = '50%';
        logo.style.transform = 'translate(-50%, -50%)';
        logo.style.width = '200px';
        logo.style.opacity = '0.06';
        logo.style.filter = 'grayscale(100%)';
        watermarkWrapper.appendChild(logo);

        const text = document.createElement('div');
        text.innerText = 'BuzzTrackers';
        text.style.position = 'absolute';
        text.style.bottom = '20px';
        text.style.left = '50%';
        text.style.transform = 'translateX(-50%)';
        text.style.fontSize = '16px';
        text.style.color = '#64748b';
        text.style.opacity = '0.6';
        text.style.fontWeight = '600';
        watermarkWrapper.appendChild(text);

        element.appendChild(watermarkWrapper);

        html2pdf().set(opt).from(element).save().then(() => {
          watermarkWrapper.remove();
          setShowAccordion(true);
        });
      }
    }, 200);
  };

  const getBadge = (score: number) => {
    if (score >= 90) return "🏆 Champion";
    if (score >= 70) return "🥇 Advanced";
    if (score >= 50) return "🥈 Intermediate";
    if (score >= 30) return "🥉 Beginner";
    return "🪨 Try Again";
  };

  if (!report) return <div className="text-center p-10 text-lg">Loading student report...</div>;

  const pieData = [
    { name: 'Correct', value: report.correctAnswers },
    { name: 'Incorrect', value: report.totalQuestions - report.correctAnswers },
  ];
  const barData = [
    { name: 'Correct', value: report.correctAnswers },
    { name: 'Wrong', value: report.answeredQuestions - report.correctAnswers },
    { name: 'Unattempted', value: report.totalQuestions - report.answeredQuestions },
  ];
  const COLORS = ['#22c55e', '#ef4444'];
  const currentTimestamp = new Date().toLocaleString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 p-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">📊 Quiz Analytics Dashboard</h1>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => navigate('/upload')} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Upload New Quiz</button>
            <button onClick={() => navigate('/select-quiz')} className="bg-yellow-500 text-white px-4 py-2 rounded-lg">Take Test Again</button>
            <button onClick={() => navigate('/')} className="bg-red-600 text-white px-4 py-2 rounded-lg">Logout</button>
            <button onClick={downloadPDF} className="bg-green-600 text-white px-4 py-2 rounded-lg">Download PDF</button>
          </div>
        </div>

        <div id="pdf-only-area">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-6">
            <div className="bg-white shadow-md rounded-xl p-4">
              <p className="text-sm text-gray-500">Student Name</p>
              <p className="text-xl font-bold text-gray-700">{report.studentName}</p>
            </div>
            <div className="bg-white shadow-md rounded-xl p-4">
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-xl font-bold text-gray-700">{report.studentEmail}</p>
            </div>
            <div className="bg-white shadow-md rounded-xl p-4">
              <p className="text-sm text-gray-500">Quiz Name</p>
              <p className="text-xl font-bold text-gray-700">{report.quizName}</p>
            </div>
            <div className="bg-white shadow-md rounded-xl p-4">
              <p className="text-sm text-gray-500">Submitted</p>
              <p className="text-xl font-bold text-gray-700">{report.submittedAt}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center mb-6">
            <div className="bg-white shadow-md rounded-xl p-4">
              <p className="text-sm text-gray-500">Score</p>
              <p className="text-xl font-bold text-blue-600">{report.score}%</p>
            </div>
            <div className="bg-white shadow-md rounded-xl p-4">
              <p className="text-sm text-gray-500">Correct</p>
              <p className="text-xl font-bold text-green-600">{report.correctAnswers}</p>
            </div>
            <div className="bg-white shadow-md rounded-xl p-4">
              <p className="text-sm text-gray-500">Wrong</p>
              <p className="text-xl font-bold text-red-500">{report.answeredQuestions - report.correctAnswers}</p>
            </div>
            <div className="bg-white shadow-md rounded-xl p-4">
              <p className="text-sm text-gray-500">Unattempted</p>
              <p className="text-xl font-bold text-gray-600">{report.totalQuestions - report.answeredQuestions}</p>
            </div>
            <div className="bg-white shadow-md rounded-xl p-4">
              <p className="text-sm text-gray-500">Accuracy</p>
              <p className="text-xl font-bold text-purple-600">{((report.correctAnswers / report.totalQuestions) * 100).toFixed(1)}%</p>
            </div>
            <div className="bg-white shadow-md rounded-xl p-4">
              <p className="text-sm text-gray-500">Badge</p>
              <p className="text-xl font-bold text-gray-800">{getBadge(report.score)}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white shadow-md rounded-xl p-4">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">🎯 Answer Accuracy</h2>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80} label>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white shadow-md rounded-xl p-4">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">📊 Answer Distribution</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="text-center text-gray-500 text-xs pt-2">
            Report Generated: {currentTimestamp}
          </div>
        </div>

        {showAccordion && (
          <details className="bg-white p-6 rounded-xl shadow mt-8">
            <summary className="text-lg font-semibold cursor-pointer">📘 View Detailed Answer Breakdown</summary>
            <div className="space-y-6 mt-4">
              {report.detailedResults.map((q, idx) => (
                <div key={idx} className="p-4 rounded-md border border-gray-200 bg-gray-50">
                  <p className="font-medium text-gray-800 mb-2">Q{q.questionNumber}: {q.questionText}</p>
                  <p className="text-sm mb-1">
                    <span className="font-semibold">Your Answer:</span>{' '}
                    <span className={q.isCorrect ? 'text-green-600' : 'text-red-600'}>
                      {q.selectedOption !== null && q.selectedOption !== undefined ? String.fromCharCode(65 + q.selectedOption) : 'Not Answered'} ({q.isCorrect ? 'Correct ✅' : 'Wrong ❌'})
                    </span>
                  </p>
                  <p className="text-sm"><span className="font-semibold">Correct Answer:</span> {q.correctAnswer}</p>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

export default TeacherPanel;