'use client';

import { useState, useEffect } from 'react';
import WineTriviaGame from '@/components/WineTriviaGame';

interface TriviaQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface SetInfo {
  id: number;
  name: string;
  totalSets: number;
}

interface TriviaResponse {
  questions: TriviaQuestion[];
  setInfo: SetInfo;
}

export default function WineTriviaPage() {
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [setInfo, setSetInfo] = useState<SetInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const getCompletedSets = (): number[] => {
    if (typeof window === 'undefined') return [];
    try {
      const completed = localStorage.getItem('wine-trivia-completed-sets');
      return completed ? JSON.parse(completed) : [];
    } catch {
      return [];
    }
  };

  const markSetAsCompleted = (setId: number) => {
    if (typeof window === 'undefined') return;
    try {
      const completed = getCompletedSets();
      if (!completed.includes(setId)) {
        completed.push(setId);
        localStorage.setItem('wine-trivia-completed-sets', JSON.stringify(completed));
      }
    } catch (error) {
      console.error('Error saving completed set:', error);
    }
  };

  const fetchQuestions = async () => {
    try {
      const completedSets = getCompletedSets();
      const queryParams = completedSets.length > 0 
        ? `?completedSets=${encodeURIComponent(JSON.stringify(completedSets))}`
        : '';
      
      const response = await fetch(`/api/wine-trivia${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch trivia questions');
      }
      const data: TriviaResponse = await response.json();
      setQuestions(data.questions);
      setSetInfo(data.setInfo);
    } catch (error) {
      console.error('Error fetching trivia questions:', error);
      setError('Failed to load trivia questions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleGameComplete = (setId: number) => {
    markSetAsCompleted(setId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-red-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading trivia questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-red-900 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-4">Error Loading Trivia</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={fetchQuestions}
                className="btn-primary w-full"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="btn-secondary w-full"
              >
                Back to Cellar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-red-900 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📝</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-4">No Questions Available</h1>
            <p className="text-gray-600 mb-6">There are no trivia questions available at the moment.</p>
            <button
              onClick={() => window.location.href = '/'}
              className="btn-primary w-full"
            >
              Back to Cellar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <WineTriviaGame 
      questions={questions} 
      setInfo={setInfo}
      onGameComplete={handleGameComplete}
    />
  );
}
