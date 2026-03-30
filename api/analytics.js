// Analytics endpoint: POST /api/analytics (track event), GET /api/analytics (dashboard)
// Uses @vercel/kv for durable persistence across cold starts.
import { kv } from '@vercel/kv';

const APP = 'greenmatch';

function isoWeek() {
  const d = new Date();
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const week = Math.ceil((((d - jan4) / 86400000) + jan4.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function key(event) {
  return `${APP}:${event}:${isoWeek()}`;
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { event } = req.body || {};
    if (!event) return res.status(400).json({ error: 'event required' });
    await kv.incr(key(event));
    return res.json({ ok: true });
  }

  if (req.method === 'GET') {
    const [pageVisits, featureUsed, conversions] = await Promise.all([
      kv.get(key('page_visit')),
      kv.get(key('recommendation_requested')),
      kv.get(key('recommendation_received')),
    ]);
    const pv = pageVisits || 0;
    const fu = featureUsed || 0;
    const cv = conversions || 0;
    return res.json({
      app: APP,
      week: isoWeek(),
      pageVisits: pv,
      featureUsed: fu,
      conversions: cv,
      conversionRate: pv > 0 ? `${Math.round((cv / pv) * 100)}%` : '0%',
    });
  }

  res.status(405).end();
}
