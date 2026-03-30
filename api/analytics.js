// Analytics endpoint: POST /api/analytics (track event), GET /api/analytics (dashboard)
// Uses in-memory Map; swap kv.incr() calls when Vercel KV is provisioned.
const APP = 'greenmatch';
const counts = new Map();

function isoWeek() {
  const d = new Date();
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const week = Math.ceil((((d - jan4) / 86400000) + jan4.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function incr(event) {
  const k = `${APP}:${event}:${isoWeek()}`;
  counts.set(k, (counts.get(k) || 0) + 1);
}

function get(event) {
  return counts.get(`${APP}:${event}:${isoWeek()}`) || 0;
}

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { event } = req.body || {};
    if (!event) return res.status(400).json({ error: 'event required' });
    incr(event);
    return res.json({ ok: true });
  }

  if (req.method === 'GET') {
    const pageVisits = get('page_visit');
    const featureUsed = get('recommendation_requested');
    const conversions = get('recommendation_received');
    return res.json({
      app: APP,
      week: isoWeek(),
      pageVisits,
      featureUsed,
      conversions,
      conversionRate: pageVisits > 0 ? `${Math.round((conversions / pageVisits) * 100)}%` : '0%',
    });
  }

  res.status(405).end();
}
