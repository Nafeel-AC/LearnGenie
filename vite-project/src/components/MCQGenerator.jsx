import React, { useState } from 'react';
import Loader from './Loader';

const MCQGenerator = ({ book, onClose, isDarkTheme = false }) => {
  const [step, setStep] = useState('config'); // 'config', 'generating', 'quiz', 'results'
  const [config, setConfig] = useState({
    numQuestions: 10,
    difficulty: 'medium'
  });
  const [mcqs, setMcqs] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(null);
  const [error, setError] = useState(null);

  const API_BASE_URL = 'http://localhost:8000';

  const generateMCQs = async () => {
    setIsGenerating(true);
    setStep('generating');
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/generate-mcqs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          book_id: book.id,
          num_questions: config.numQuestions,
          difficulty: config.difficulty,
          user_id: 'demo_user'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate MCQs: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // Validate the response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format received from server');
      }
      
      if (!data.mcqs || !Array.isArray(data.mcqs)) {
        throw new Error('No MCQs array found in response');
      }
      
      if (data.mcqs.length === 0) {
        throw new Error('No MCQs were generated. Please try again or check if the book has content.');
      }

      // Validate each MCQ structure
      const validMcqs = data.mcqs.filter(mcq => {
        return mcq && 
               typeof mcq === 'object' &&
               mcq.question && 
               Array.isArray(mcq.options) && 
               mcq.options.length === 4 &&
               typeof mcq.correct_answer === 'number' &&
               mcq.correct_answer >= 0 && 
               mcq.correct_answer < 4;
      });

      if (validMcqs.length === 0) {
        throw new Error('No valid MCQs found in the response');
      }

      setMcqs(validMcqs);
      setStep('quiz');
      
    } catch (error) {
      console.error('Error generating MCQs:', error);
      
      // Provide specific error messages based on error type
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('Unable to connect to the server. Please check if the backend is running.');
      } else if (error.message.includes('Failed to generate MCQs: 500')) {
        setError('Server error occurred. The AI service might be temporarily unavailable.');
      } else if (error.message.includes('book has content')) {
        setError('The selected book appears to have no content. Please try uploading the book again.');
      } else {
        setError(error.message || 'An unexpected error occurred while generating MCQs');
      }
      
      setStep('config');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateDemoMCQs = () => {
    const difficulties = {
      easy: 'basic',
      medium: 'intermediate',
      hard: 'advanced'
    };

    return Array.from({ length: config.numQuestions }, (_, i) => ({
      id: i + 1,
      question: `Sample ${difficulties[config.difficulty]} question ${i + 1} about "${book.title}"?`,
      options: [
        `Option A for question ${i + 1}`,
        `Option B for question ${i + 1}`,
        `Option C for question ${i + 1}`,
        `Option D for question ${i + 1}`
      ],
      correct_answer: Math.floor(Math.random() * 4),
      explanation: `This is the explanation for question ${i + 1} about the book content.`
    }));
  };

  const handleAnswerSelect = (questionId, answerIndex) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const submitQuiz = () => {
    let correctCount = 0;
    mcqs.forEach(mcq => {
      if (userAnswers[mcq.id] === mcq.correct_answer) {
        correctCount++;
      }
    });

    const finalScore = {
      correct: correctCount,
      total: mcqs.length,
      percentage: Math.round((correctCount / mcqs.length) * 100)
    };

    setScore(finalScore);
    setStep('results');
  };

  const resetQuiz = () => {
    setStep('config');
    setMcqs([]);
    setUserAnswers({});
    setScore(null);
    setCurrentQuestionIndex(0);
  };

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkTheme ? 'bg-gray-950' : 'bg-gray-50'
      }`}>
        {/* Header */}
        <div className={`fixed top-0 left-0 right-0 border-b px-6 py-4 ${
          isDarkTheme 
            ? 'bg-gray-900/95 backdrop-blur-sm border-gray-800' 
            : 'bg-white/95 backdrop-blur-sm border-gray-200'
        }`}>
          <div className="max-w-4xl mx-auto flex items-center">
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${
                isDarkTheme 
                  ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className={`ml-4 text-xl font-semibold ${
              isDarkTheme ? 'text-white' : 'text-gray-900'
            }`}>MCQ Generator</h1>
          </div>
        </div>

        <div className="max-w-md mx-4 mt-20">
          <div className={`rounded-3xl p-8 text-center shadow-sm border ${
            isDarkTheme ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center ${
              isDarkTheme ? 'bg-red-500/10' : 'bg-red-50'
            }`}>
              <svg className={`w-8 h-8 ${isDarkTheme ? 'text-red-400' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.94-.833-2.71 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className={`text-2xl font-semibold mb-4 ${
              isDarkTheme ? 'text-white' : 'text-gray-900'
            }`}>
              Error Generating MCQs
            </h3>
            <p className={`mb-8 text-lg ${
              isDarkTheme ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {error}
            </p>
            <button
              onClick={() => setError(null)}
              className="w-full bg-blue-500 text-white py-4 px-6 rounded-2xl font-semibold hover:bg-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${
      isDarkTheme ? 'bg-gray-950' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <div className={`border-b px-6 py-4 ${
        isDarkTheme 
          ? 'bg-gray-900/95 backdrop-blur-sm border-gray-800' 
          : 'bg-white/95 backdrop-blur-sm border-gray-200'
      }`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${
                isDarkTheme 
                  ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className={`text-xl font-semibold ${
                isDarkTheme ? 'text-white' : 'text-gray-900'
              }`}>MCQ Generator</h1>
              <p className={`text-sm ${
                isDarkTheme ? 'text-gray-400' : 'text-gray-500'
              }`}>{book.title}</p>
            </div>
          </div>
          
          {step === 'quiz' && (
            <div className="flex items-center space-x-4">
              <div className={`px-4 py-2 rounded-2xl text-sm font-medium ${
                isDarkTheme 
                  ? 'bg-gray-800 text-gray-300' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                Question {currentQuestionIndex + 1} of {mcqs.length}
              </div>
              <div className={`w-32 h-2 rounded-full ${
                isDarkTheme ? 'bg-gray-800' : 'bg-gray-200'
              }`}>
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((currentQuestionIndex + 1) / mcqs.length) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-8">
        {step === 'config' && (
          <div className="max-w-2xl">
            <div className={`rounded-2xl p-8 shadow-lg border ${
              isDarkTheme 
                ? 'bg-gray-900/90 border-gray-800' 
                : 'bg-white border-gray-200'
            }`}>
              {/* Header Section */}
              <div className="text-center mb-8">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                  isDarkTheme ? 'bg-blue-500/10' : 'bg-blue-50'
                }`}>
                  <svg className={`w-8 h-8 ${isDarkTheme ? 'text-blue-400' : 'text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h2 className={`text-2xl font-bold mb-2 ${
                  isDarkTheme ? 'text-white' : 'text-gray-900'
                }`}>Create Your Quiz</h2>
                <p className={`text-base ${
                  isDarkTheme ? 'text-gray-400' : 'text-gray-600'
                }`}>Customize your learning experience</p>
              </div>

              {/* Configuration Options */}
              <div className="space-y-6">
                {/* Number of Questions */}
                <div>
                  <label className={`block text-sm font-semibold mb-4 ${
                    isDarkTheme ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    Number of Questions
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[5, 10, 15].map(num => (
                      <button
                        key={num}
                        onClick={() => setConfig(prev => ({ ...prev, numQuestions: num }))}
                        className={`p-4 rounded-xl text-center font-medium transition-all duration-200 border-2 transform hover:scale-105 ${
                          config.numQuestions === num
                            ? isDarkTheme
                              ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                              : 'bg-blue-50 border-blue-500 text-blue-600'
                            : isDarkTheme
                              ? 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-800'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="text-2xl font-bold">{num}</div>
                        <div className="text-xs opacity-75">questions</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty Level */}
                <div>
                  <label className={`block text-sm font-semibold mb-4 ${
                    isDarkTheme ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    Difficulty Level
                  </label>
                  <div className="space-y-3">
                    {[
                      { value: 'easy', label: 'Easy', desc: 'Basic concepts and definitions', icon: '🟢' },
                      { value: 'medium', label: 'Medium', desc: 'Moderate understanding required', icon: '🟡' },
                      { value: 'hard', label: 'Hard', desc: 'Advanced analysis and application', icon: '🔴' }
                    ].map(difficulty => (
                      <button
                        key={difficulty.value}
                        onClick={() => setConfig(prev => ({ ...prev, difficulty: difficulty.value }))}
                        className={`w-full p-4 rounded-xl text-left transition-all duration-200 border-2 ${
                          config.difficulty === difficulty.value
                            ? isDarkTheme
                              ? 'bg-blue-500/10 border-blue-500'
                              : 'bg-blue-50 border-blue-500'
                            : isDarkTheme
                              ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{difficulty.icon}</span>
                          <div className="flex-1">
                            <div className={`font-semibold ${
                              config.difficulty === difficulty.value
                                ? isDarkTheme ? 'text-blue-400' : 'text-blue-600'
                                : isDarkTheme ? 'text-white' : 'text-gray-900'
                            }`}>{difficulty.label}</div>
                            <div className={`text-sm ${
                              config.difficulty === difficulty.value
                                ? isDarkTheme ? 'text-blue-300/80' : 'text-blue-600/80'
                                : isDarkTheme ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {difficulty.desc}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <div className="pt-4">
                  <button
                    onClick={generateMCQs}
                    className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 ${
                      isDarkTheme
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    } shadow-lg hover:shadow-xl transform hover:scale-[1.02]`}
                  >
                    Generate {config.numQuestions} MCQs
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'generating' && (
          <div className="max-w-md">
            <div className={`rounded-2xl p-8 text-center shadow-lg border ${
              isDarkTheme 
                ? 'bg-gray-900/90 border-gray-800' 
                : 'bg-white border-gray-200'
            }`}>
              <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center ${
                isDarkTheme ? 'bg-blue-500/10' : 'bg-blue-50'
              }`}>
                <Loader size={32} color="#3B82F6" />
              </div>
              <h3 className={`text-2xl font-bold mb-3 ${
                isDarkTheme ? 'text-white' : 'text-gray-900'
              }`}>
                Generating Your Quiz
              </h3>
              <p className={`text-base ${
                isDarkTheme ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Creating {config.numQuestions} {config.difficulty} questions from your book...
              </p>
            </div>
          </div>
        )}

        {step === 'quiz' && mcqs.length > 0 && (
          <div className="max-w-3xl">
            <div className={`rounded-2xl p-8 shadow-lg border ${
              isDarkTheme 
                ? 'bg-gray-900/90 border-gray-800' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="mb-8">
                <h3 className={`text-xl font-bold mb-6 leading-relaxed ${
                  isDarkTheme ? 'text-white' : 'text-gray-900'
                }`}>
                  {mcqs[currentQuestionIndex].question}
                </h3>

                <div className="space-y-3">
                  {mcqs[currentQuestionIndex].options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(mcqs[currentQuestionIndex].id, index)}
                      className={`w-full p-4 rounded-xl text-left transition-all duration-200 border-2 ${
                        userAnswers[mcqs[currentQuestionIndex].id] === index
                          ? isDarkTheme
                            ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                            : 'bg-blue-50 border-blue-500 text-blue-600'
                          : isDarkTheme
                            ? 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-800'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <span className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-semibold ${
                          userAnswers[mcqs[currentQuestionIndex].id] === index
                            ? isDarkTheme
                              ? 'bg-blue-500 text-white'
                              : 'bg-blue-500 text-white'
                            : isDarkTheme
                              ? 'bg-gray-700 text-gray-300'
                              : 'bg-gray-200 text-gray-600'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="flex-1">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    currentQuestionIndex === 0
                      ? 'opacity-50 cursor-not-allowed'
                      : isDarkTheme
                        ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  } border ${isDarkTheme ? 'border-gray-700' : 'border-gray-200'}`}
                >
                  Previous
                </button>

                {currentQuestionIndex === mcqs.length - 1 ? (
                  <button
                    onClick={submitQuiz}
                    disabled={Object.keys(userAnswers).length !== mcqs.length}
                    className="px-8 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  >
                    Submit Quiz
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                    className="px-8 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 'results' && (
          <div className="max-w-3xl">
            <div className={`rounded-2xl p-8 shadow-lg border ${
              isDarkTheme 
                ? 'bg-gray-900/90 border-gray-800' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="text-center mb-8">
                <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center ${
                  score.percentage >= 80 
                    ? 'bg-green-100 text-green-600' 
                    : score.percentage >= 60 
                      ? 'bg-yellow-100 text-yellow-600' 
                      : 'bg-red-100 text-red-600'
                }`}>
                  <span className="text-3xl">
                  {score.percentage >= 80 ? '🎉' : score.percentage >= 60 ? '👍' : '📚'}
                  </span>
                </div>
                <h3 className={`text-3xl font-bold mb-4 ${
                  isDarkTheme ? 'text-white' : 'text-gray-900'
                }`}>
                  Quiz Complete!
                </h3>
                <div className={`text-5xl font-bold mb-4 ${
                  score.percentage >= 80 ? 'text-green-500' : 
                  score.percentage >= 60 ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {score.percentage}%
                </div>
                <p className={`text-lg ${
                  isDarkTheme ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  You got {score.correct} out of {score.total} questions correct
                </p>
              </div>

              <div className="space-y-4 mb-8 max-h-80 overflow-y-auto">
                {mcqs.map((mcq, index) => {
                  const userAnswer = userAnswers[mcq.id];
                  const isCorrect = userAnswer === mcq.correct_answer;
                  
                  return (
                    <div key={mcq.id} className={`p-4 rounded-xl border-2 ${
                      isCorrect
                        ? isDarkTheme 
                          ? 'bg-green-500/10 border-green-500/50' 
                          : 'bg-green-50 border-green-200'
                        : isDarkTheme 
                          ? 'bg-red-500/10 border-red-500/50' 
                          : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-start justify-between mb-3">
                        <h4 className={`font-medium pr-4 ${
                          isDarkTheme ? 'text-white' : 'text-gray-900'
                        }`}>
                          Q{index + 1}: {mcq.question}
                        </h4>
                        <span className={`ml-2 px-3 py-1 rounded-xl text-sm font-semibold ${
                          isCorrect 
                            ? 'bg-green-500 text-white' 
                            : 'bg-red-500 text-white'
                        }`}>
                          {isCorrect ? '✓' : '✗'}
                        </span>
                      </div>
                      <div className={`text-sm space-y-2 ${
                        isDarkTheme ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        <p>Your answer: <span className={isCorrect ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                          {mcq.options[userAnswer]}
                        </span></p>
                        {!isCorrect && (
                          <p>Correct answer: <span className="text-green-600 font-medium">
                            {mcq.options[mcq.correct_answer]}
                          </span></p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={resetQuiz}
                  className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-200 border-2 ${
                    isDarkTheme 
                      ? 'bg-gray-800 text-gray-200 hover:bg-gray-700 border-gray-700' 
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200'
                  }`}
                >
                  Generate New Quiz
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-blue-500 text-white py-4 px-6 rounded-xl font-semibold hover:bg-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  Back to Chat
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MCQGenerator; 