// Analytics endpoint: POST /api/analytics (track event), GET /api/analytics/dashboard
// Uses @vercel/kv when provisioned; falls back to in-memory Map for Week 1 baseline.

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

// In-memory store (per warm instance). Provision Vercel KV for durable persistence.
const memStore = new Map();
let _kv = null;

async function getKv() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
  if (!_kv) {
    try { _kv = (await import('@vercel/kv')).kv; } catch (_) { _kv = null; }
  }
  return _kv;
}

async function storeGet(k) {
  const client = await getKv();
  if (client) return (await client.get(k)) || 0;
  return memStore.get(k) || 0;
}

async function storeIncr(k) {
  const client = await getKv();
  if (client) return client.incr(k);
  const v = (memStore.get(k) || 0) + 1;
  memStore.set(k, v);
  return v;
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { event } = req.body || {};
    if (!event) return res.status(400).json({ error: 'event required' });
    await storeIncr(key(event));
    return res.json({ ok: true });
  }

  if (req.method === 'GET') {
    const [pageVisits, featureUsed, conversions] = await Promise.all([
      storeGet(key('page_visit')),
      storeGet(key('recommendation_requested')),
      storeGet(key('recommendation_received')),
    ]);
    const pv = Number(pageVisits) || 0;
    const fu = Number(featureUsed) || 0;
    const cv = Number(conversions) || 0;
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
