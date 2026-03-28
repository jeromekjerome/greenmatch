import { useState, useEffect } from 'react';

export default function QuizStep({ step, selected, onSelect }) {
  const [localSelected, setLocalSelected] = useState(
    step.multi ? (Array.isArray(selected) ? selected : []) : selected || null
  );

  const handleClick = (option) => {
    if (!step.multi) {
      onSelect(option);
      return;
    }
    // Multi-select logic
    let updated;
    if (option === 'None') {
      updated = ['None'];
    } else {
      const filtered = (localSelected || []).filter(o => o !== 'None');
      if (filtered.includes(option)) {
        updated = filtered.filter(o => o !== option);
      } else {
        updated = [...filtered, option];
      }
    }
    setLocalSelected(updated);
  };

  const handleConfirm = () => {
    if (localSelected && localSelected.length > 0) {
      onSelect(localSelected);
    }
  };

  return (
    <div className="bg-dark-l border border-green-900/40 rounded-2xl p-5 animate-fade-in">
      <div className="text-3xl mb-3 text-center">{step.emoji}</div>
      <h2 className="text-lg font-bold text-white text-center mb-5">{step.question}</h2>
      <div className="flex flex-wrap gap-2 justify-center">
        {step.options.map(option => {
          const isSelected = step.multi
            ? (localSelected || []).includes(option)
            : localSelected === option;
          return (
            <button
              key={option}
              onClick={() => handleClick(option)}
              className={`px-4 py-2.5 rounded-full text-sm font-medium border transition-all duration-150 active:scale-95 ${
                isSelected
                  ? 'bg-green-500 border-green-400 text-white shadow-lg shadow-green-500/25'
                  : 'bg-green-950/40 border-green-800/40 text-green-300 hover:border-green-500/50'
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {step.multi && (
        <button
          onClick={handleConfirm}
          disabled={!localSelected || localSelected.length === 0}
          className="mt-5 w-full py-3 rounded-xl bg-green-500 disabled:bg-green-900/50 disabled:text-green-700 text-white font-semibold text-sm transition-all"
        >
          Continue →
        </button>
      )}
    </div>
  );
}
