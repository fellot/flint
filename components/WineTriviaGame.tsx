'use client';

import { useState, useEffect } from 'react';
import { Wine as WineIcon, Trophy, RotateCcw, CheckCircle, XCircle, ArrowRight, Star } from 'lucide-react';

interface TriviaQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface WineTriviaGameProps {
  questions: TriviaQuestion[];
}

export default function WineTriviaGame({ questions }: WineTriviaGameProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameStarted, setGameStarted] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  // Timer effect
  useEffect(() => {
    if (gameStarted && !showResult && timeLeft > 0 && !gameCompleted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showResult) {
      handleAnswer(-1); // Time's up
    }
  }, [timeLeft, showResult, gameStarted, gameCompleted]);

  const handleAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    
    if (answerIndex === currentQuestion.correct) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setTimeLeft(30);
    } else {
      setGameCompleted(true);
    }
  };

  const resetGame = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setGameCompleted(false);
    setTimeLeft(30);
    setGameStarted(false);
  };

  const startGame = () => {
    setGameStarted(true);
  };

  const getScoreColor = () => {
    const percentage = (score / totalQuestions) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = () => {
    const percentage = (score / totalQuestions) * 100;
    if (percentage >= 90) return 'Wine Master! 🍷';
    if (percentage >= 80) return 'Excellent! 🎉';
    if (percentage >= 70) return 'Great job! 👍';
    if (percentage >= 60) return 'Good effort! 😊';
    return 'Keep learning! 📚';
  };

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-red-900 flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="mb-6">
              <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <WineIcon className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Wine Trivia Challenge</h1>
              <p className="text-gray-600">
                Test your wine knowledge with {totalQuestions} challenging questions!
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Game Rules:</h3>
              <ul className="text-left text-gray-700 space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  You have 30 seconds per question
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Choose the best answer from 4 options
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Learn from detailed explanations
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Track your progress and score
                </li>
              </ul>
            </div>

            <button
              onClick={startGame}
              className="btn-primary text-lg px-8 py-3"
            >
              Start Trivia Challenge
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameCompleted) {
    return (
      <div className="min-h-screen bg-red-900 flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="mb-6">
              <div className="h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-yellow-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Game Complete!</h1>
              <p className={`text-2xl font-bold ${getScoreColor()} mb-2`}>
                {getScoreMessage()}
              </p>
              <p className="text-gray-600">
                You scored {score} out of {totalQuestions} questions
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="flex justify-center items-center space-x-4">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor()}`}>
                    {Math.round((score / totalQuestions) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{score}</div>
                  <div className="text-sm text-gray-600">Correct</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{totalQuestions - score}</div>
                  <div className="text-sm text-gray-600">Incorrect</div>
                </div>
              </div>
            </div>

            <div className="flex space-x-4 justify-center">
              <button
                onClick={resetGame}
                className="btn-secondary flex items-center space-x-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Play Again</span>
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="btn-primary flex items-center space-x-2"
              >
                <ArrowRight className="h-4 w-4" />
                <span>Back to Cellar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-red-900">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Wine Trivia Challenge</h1>
              <p className="text-gray-600">Question {currentQuestionIndex + 1} of {totalQuestions}</p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">{score}</div>
                <div className="text-xs text-gray-500">Score</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold ${timeLeft <= 10 ? 'text-red-600' : 'text-gray-900'}`}>
                  {timeLeft}s
                </div>
                <div className="text-xs text-gray-500">Time</div>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-8 leading-relaxed">
            {currentQuestion.question}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              let buttonClass = "w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ";
              
              if (showResult) {
                if (index === currentQuestion.correct) {
                  buttonClass += "border-green-500 bg-green-50 text-green-800";
                } else if (index === selectedAnswer && index !== currentQuestion.correct) {
                  buttonClass += "border-red-500 bg-red-50 text-red-800";
                } else {
                  buttonClass += "border-gray-200 bg-gray-50 text-gray-600";
                }
              } else {
                buttonClass += "border-gray-200 hover:border-red-300 hover:bg-red-50 cursor-pointer";
              }

              return (
                <button
                  key={index}
                  onClick={() => !showResult && handleAnswer(index)}
                  disabled={showResult}
                  className={buttonClass}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option}</span>
                    {showResult && index === currentQuestion.correct && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    {showResult && index === selectedAnswer && index !== currentQuestion.correct && (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {showResult && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <Star className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Explanation:</h4>
                  <p className="text-blue-800">{currentQuestion.explanation}</p>
                </div>
              </div>
            </div>
          )}

          {/* Next Button */}
          {showResult && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleNextQuestion}
                className="btn-primary flex items-center space-x-2"
              >
                <span>
                  {currentQuestionIndex < totalQuestions - 1 ? 'Next Question' : 'Finish Game'}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
