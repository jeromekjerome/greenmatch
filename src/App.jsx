import { useState, useRef, useCallback, useEffect } from 'react';
import { track } from './analytics.js';
import Quiz from './components/Quiz.jsx';
import ResultCard from './components/ResultCard.jsx';

export default function App() {
  const sessionId = useRef(crypto.randomUUID());
  const [view, setView] = useState('quiz');
  const [answers, setAnswers] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    track('session_start', { app: 'greenmatch' });
  }, []);

  const fetchRecommendation = useCallback(async (ans, tryAnother = false) => {
    track('recommendation_requested', { app: 'greenmatch' });
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: ans, sessionId: sessionId.current, tryAnother })
      });
      if (!res.ok) throw new Error('Failed to get recommendation');
      const data = await res.json();
      track('recommendation_received', { app: 'greenmatch' });
      setRecommendation(data);
      setView('result');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQuizComplete = (ans) => {
    setAnswers(ans);
    fetchRecommendation(ans, false);
  };

  const handleTryAnother = () => {
    fetchRecommendation(answers, true);
  };

  const handleStartOver = () => {
    setView('quiz');
    setRecommendation(null);
    setAnswers(null);
    setError(null);
    sessionId.current = crypto.randomUUID();
  };

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 border-b border-green-900/40">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🥤</span>
          <span className="font-bold text-green-400 text-lg">GreenMatch</span>
        </div>
        <span className="text-xs text-green-700 font-medium uppercase tracking-widest">Powered by AI</span>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-green-900 border-t-green-400 animate-spin" />
            <p className="text-green-600 text-sm">Crafting your perfect blend...</p>
          </div>
        )}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm text-center">
            {error} — <button onClick={handleStartOver} className="underline">Try again</button>
          </div>
        )}
        {!loading && !error && view === 'quiz' && (
          <Quiz onComplete={handleQuizComplete} />
        )}
        {!loading && !error && view === 'result' && recommendation && (
          <ResultCard
            recommendation={recommendation}
            answers={answers}
            onTryAnother={handleTryAnother}
            onStartOver={handleStartOver}
          />
        )}
      </main>
    </div>
  );
}
