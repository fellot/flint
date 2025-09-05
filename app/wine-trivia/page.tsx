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

interface SetOption {
  id: number;
  name: string;
  isCompleted: boolean;
}

interface TriviaResponse {
  questions: TriviaQuestion[];
  setInfo: SetInfo;
  allSets: SetOption[];
}

export default function WineTriviaPage() {
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [setInfo, setSetInfo] = useState<SetInfo | null>(null);
  const [allSets, setAllSets] = useState<SetOption[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<number | null>(null);
  const [showSetSelection, setShowSetSelection] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // On first load, show set selection if no specific set is requested
    const urlParams = new URLSearchParams(window.location.search);
    const requestedSetId = urlParams.get('setId');
    
    if (requestedSetId) {
      fetchQuestions(parseInt(requestedSetId));
    } else {
      // Load all sets info first, then show selection
      fetchQuestions().then(() => {
        setShowSetSelection(true);
      });
    }
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

  const fetchQuestions = async (setId?: number) => {
    try {
      const completedSets = getCompletedSets();
      
      // Detect language from URL or localStorage
      const urlParams = new URLSearchParams(window.location.search);
      const languageParam = urlParams.get('language');
      const storedLanguage = localStorage.getItem('wine-data-source');
      const isPortuguese = languageParam === 'pt' || storedLanguage === '2';
      
      let queryParams = completedSets.length > 0 
        ? `?completedSets=${encodeURIComponent(JSON.stringify(completedSets))}`
        : '';
      
      // Add language parameter
      queryParams += queryParams ? '&' : '?';
      queryParams += `language=${isPortuguese ? 'pt' : 'en'}`;
      
      if (setId) {
        queryParams += `&selectedSetId=${setId}`;
      }
      
      const response = await fetch(`/api/wine-trivia${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch trivia questions');
      }
      const data: TriviaResponse = await response.json();
      setQuestions(data.questions);
      setSetInfo(data.setInfo);
      setAllSets(data.allSets);
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

  const handleSetSelection = (setId: number) => {
    setSelectedSetId(setId);
    setShowSetSelection(false);
    setLoading(true);
    fetchQuestions(setId);
  };

  const showSetSelectionModal = () => {
    setShowSetSelection(true);
  };

  if (showSetSelection) {
    return (
      <div className="min-h-screen bg-red-900 flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Trivia Set</h1>
              <p className="text-gray-600">Select which set of wine trivia questions you'd like to play</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {allSets.map((set, index) => {
                const isRecommended = !set.isCompleted && index === allSets.findIndex(s => !s.isCompleted);
                return (
                  <button
                    key={set.id}
                    onClick={() => handleSetSelection(set.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                      set.isCompleted
                        ? 'border-green-500 bg-green-50 hover:bg-green-100'
                        : isRecommended
                        ? 'border-blue-500 bg-blue-50 hover:bg-blue-100'
                        : 'border-gray-200 bg-white hover:border-red-300 hover:bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">Set {set.id}</h3>
                      <div className="flex items-center space-x-2">
                        {isRecommended && (
                          <span className="text-blue-600 text-sm font-medium">⭐ Recommended</span>
                        )}
                        {set.isCompleted && (
                          <span className="text-green-600 text-sm font-medium">✓ Completed</span>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">{set.name}</p>
                  </button>
                );
              })}
            </div>
            
            <div className="text-center">
              <button
                onClick={() => setShowSetSelection(false)}
                className="btn-secondary"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                onClick={() => fetchQuestions()}
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
      onShowSetSelection={showSetSelectionModal}
    />
  );
}
