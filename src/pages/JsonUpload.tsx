import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface QuizData {
  questionNumber: number;
  questionText: string;
  question_images?: string[];
  option_with_images_: string[];
}

const JsonUpload: React.FC = () => {
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.type === 'application/json') {
      setJsonFile(file);
    } else {
      alert('Please select a valid JSON file');
    }
  };

  const handleUpload = async () => {
    if (!jsonFile) {
      alert('Please select a JSON file first!');
      return;
    }

    setIsLoading(true);
    
    try {
      const text = await jsonFile.text();
      const questions: QuizData[] = JSON.parse(text);
      
      // Validate JSON structure
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Invalid JSON format');
      }

      // Store in localStorage for frontend-only approach
      const quizName = jsonFile.name.replace('.json', '');
      const existingQuizzes = JSON.parse(localStorage.getItem('quizzes') || '{}');
      existingQuizzes[quizName] = questions;
      localStorage.setItem('quizzes', JSON.stringify(existingQuizzes));
      alert(`✅ Quiz "${quizName}" uploaded successfully! (${questions.length} questions)`);
      navigate('/select-quiz');
    } catch (error) {
      alert('Error parsing JSON file. Please check the format.');
      console.error('Upload error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-96">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Upload Quiz JSON</h1>
          <p className="text-gray-600">Select your quiz JSON file</p>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select JSON File
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            {jsonFile && (
              <p className="mt-2 text-sm text-green-600">
                ✅ Selected: {jsonFile.name}
              </p>
            )}
          </div>
          
          <button
            onClick={handleUpload}
            disabled={!jsonFile || isLoading}
            className={`w-full py-3 rounded-lg font-semibold transition duration-200 ${
              !jsonFile || isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isLoading ? '⏳ Uploading...' : '📤 Upload Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JsonUpload;