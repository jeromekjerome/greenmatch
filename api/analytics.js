// Deprecated: analytics have been migrated to Mixpanel (see src/analytics.js).
export default function handler(req, res) {
  res.status(410).json({ error: 'Deprecated. Analytics tracked via Mixpanel SDK.' });
}
