// Copyright (c) 2026 Jerome W. Dewald. All rights reserved.
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import OpenAI from 'openai';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// In-memory session store: sessionId → message history
const sessions = new Map();

app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'dist')));

app.post('/api/recommend', async (req, res) => {
  const { answers, sessionId, tryAnother } = req.body;
  if (!answers || !sessionId) return res.status(400).json({ error: 'answers and sessionId required' });

  const { goal, restrictions, flavor, timeOfDay, mood } = answers;

  const userMessage = tryAnother
    ? 'Give me a completely different recommendation — something new.'
    : `My profile:
- Health goal: ${goal}
- Dietary restrictions: ${Array.isArray(restrictions) ? restrictions.join(', ') : restrictions}
- Flavor preference: ${flavor}
- Time of day: ${timeOfDay}
- How I feel today: ${mood}

Please recommend the perfect smoothie or juice for me.`;

  const history = sessions.get(sessionId) || [];
  history.push({ role: 'user', content: userMessage });

  try {
    const systemPrompt = `You are a wellness smoothie expert at a NYC juice bar called GreenMatch. You know every ingredient's health benefit and how to craft personalized blends.

Always respond with ONLY valid JSON — no markdown, no preamble:
{
  "name": "Creative smoothie name (2-4 words, evocative)",
  "tagline": "One-line poetic description (under 12 words)",
  "ingredients": [
    { "item": "Ingredient name", "amount": "e.g. 2 cups", "benefit": "why it's in here" }
  ],
  "benefits": ["Specific benefit tied to the user's stated goal", "Another benefit"],
  "upsell": { "item": "Add-on shot or pairing (e.g. Collagen Shot, Acai Bowl)", "reason": "Why it pairs perfectly (1 sentence)" },
  "nextVisit": "A 1-sentence teaser for what to try next time"
}

Rules:
- Name should be inspiring, not generic (e.g. "Solar Surge", "Emerald Reset", not "Green Smoothie")
- Include 5-7 ingredients with amounts
- Benefits must directly address the stated health goal
- Upsell must be genuinely complementary, not just any add-on
- Vary recommendations — never repeat the same smoothie in a session`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 800,
      messages: [{ role: 'system', content: systemPrompt }, ...history]
    });

    const text = completion.choices[0].message.content;
    history.push({ role: 'assistant', content: text });
    sessions.set(sessionId, history);

    let recommendation;
    try {
      recommendation = JSON.parse(text);
    } catch {
      return res.status(500).json({ error: 'Failed to parse recommendation' });
    }

    res.json(recommendation);
  } catch (err) {
    console.error('Recommend error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/{*path}', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3010;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`GreenMatch running on port ${PORT}`));
}

export default app;
