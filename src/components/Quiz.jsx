import { useState } from 'react';
import QuizStep from './QuizStep.jsx';

const STEPS = [
  {
    id: 'goal',
    question: "What's your main health goal today?",
    emoji: '🎯',
    multi: false,
    options: ['Energy Boost', 'Immunity', 'Weight Loss', 'Gut Health', 'Recovery']
  },
  {
    id: 'restrictions',
    question: 'Any dietary needs? (select all that apply)',
    emoji: '🌿',
    multi: true,
    options: ['Vegan', 'Nut-Free', 'Soy-Free', 'No Added Sugar', 'None']
  },
  {
    id: 'flavor',
    question: 'What flavor profile sounds best right now?',
    emoji: '🍓',
    multi: false,
    options: ['Sweet & Fruity', 'Tart & Citrusy', 'Earthy & Green', 'Tropical', 'Rich & Chocolatey']
  },
  {
    id: 'timeOfDay',
    question: 'When are you having this?',
    emoji: '⏰',
    multi: false,
    options: ['Morning Boost', 'Pre-Workout', 'Post-Workout', 'Afternoon Slump', 'Evening Wind-Down']
  },
  {
    id: 'mood',
    question: 'How are you feeling right now?',
    emoji: '✨',
    multi: false,
    options: ['Energized', 'Tired & Dragging', 'Stressed', 'Motivated', 'Sluggish']
  }
];

export default function Quiz({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const handleAnswer = (id, value) => {
    const updated = { ...answers, [id]: value };
    setAnswers(updated);
    if (step < STEPS.length - 1) {
      setTimeout(() => setStep(s => s + 1), 200);
    } else {
      setTimeout(() => onComplete(updated), 200);
    }
  };

  const current = STEPS[step];
  const progress = ((step) / STEPS.length) * 100;

  return (
    <div>
      {/* Hero */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-white mb-2">Find Your Perfect<br /><span className="text-green-400">Blend</span></h1>
        <p className="text-green-700 text-sm">Answer 5 quick questions for a personalized recommendation</p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-green-700 mb-1">
          <span>Step {step + 1} of {STEPS.length}</span>
          <span>{Math.round((step / STEPS.length) * 100)}% complete</span>
        </div>
        <div className="h-1.5 bg-green-900/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <QuizStep
        key={current.id}
        step={current}
        selected={answers[current.id]}
        onSelect={(value) => handleAnswer(current.id, value)}
      />

      {step > 0 && (
        <button
          onClick={() => setStep(s => s - 1)}
          className="mt-4 text-green-700 text-sm hover:text-green-400 transition-colors"
        >
          ← Back
        </button>
      )}
    </div>
  );
}
