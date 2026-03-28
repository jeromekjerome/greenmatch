import { useState } from 'react';

export default function ResultCard({ recommendation, answers, onTryAnother, onStartOver }) {
  const [copied, setCopied] = useState(false);

  const { name, tagline, ingredients, benefits, upsell, nextVisit } = recommendation;

  const shareText = `🥤 My GreenMatch: ${name}
"${tagline}"

Ingredients: ${ingredients.map(i => i.item).join(', ')}

Key benefits: ${benefits.join(' · ')}

Try yours at GreenMatch → greenmatch.ai`;

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback: do nothing
    }
  };

  return (
    <div className="space-y-4">
      {/* Hero card */}
      <div className="bg-gradient-to-br from-green-950/80 to-dark-l border border-green-500/30 rounded-2xl p-6 shadow-2xl shadow-green-900/30">
        <div className="flex items-start justify-between mb-1">
          <span className="text-xs font-semibold uppercase tracking-widest text-green-500">Your Match</span>
          <span className="text-2xl">🥤</span>
        </div>
        <h2 className="text-2xl font-extrabold text-white mb-1">{name}</h2>
        <p className="text-green-400 italic text-sm mb-5">"{tagline}"</p>

        {/* Ingredients */}
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-green-700 mb-2">Ingredients</p>
          <div className="flex flex-wrap gap-1.5">
            {ingredients.map((ing, i) => (
              <span key={i} className="bg-green-900/40 border border-green-800/30 rounded-lg px-2.5 py-1 text-xs text-green-300">
                {ing.amount} {ing.item}
              </span>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-green-700 mb-2">Why it works for you</p>
          <ul className="space-y-1.5">
            {benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-green-200">
                <span className="text-green-500 mt-0.5">✓</span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Upsell */}
      {upsell && (
        <div className="bg-amber-950/30 border border-amber-500/20 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-1">Level Up Your Blend</p>
          <p className="text-white font-semibold text-sm">+ {upsell.item}</p>
          <p className="text-amber-200/70 text-xs mt-0.5">{upsell.reason}</p>
        </div>
      )}

      {/* Next visit */}
      {nextVisit && (
        <div className="bg-green-900/20 border border-green-900/30 rounded-xl px-4 py-3 text-sm text-green-400">
          <span className="font-semibold">Next time:</span> {nextVisit}
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          onClick={handleShare}
          className="py-3 rounded-xl border border-green-700/40 text-green-400 font-semibold text-sm hover:bg-green-900/30 transition-all"
        >
          {copied ? '✓ Copied!' : '📋 Share Card'}
        </button>
        <button
          onClick={onTryAnother}
          className="py-3 rounded-xl bg-green-500 text-white font-semibold text-sm hover:bg-green-400 transition-all active:scale-95"
        >
          Try Another →
        </button>
      </div>
      <button
        onClick={onStartOver}
        className="w-full text-center text-green-800 hover:text-green-600 text-xs py-2 transition-colors"
      >
        Start over with new quiz
      </button>
    </div>
  );
}
