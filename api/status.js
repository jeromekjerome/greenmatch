// Copyright (c) 2026 Jerome W. Dewald. All rights reserved.
import { neon } from '@neondatabase/serverless';

const MONITORED_SERVICES = [
  { name: 'GreenMatch', url: 'https://greenmatch-weld.vercel.app/api/health' },
  { name: 'FreshCast',  url: 'https://freshcast-eosin.vercel.app/api/health' },
  { name: 'PulsePass',  url: 'https://pulsepass.vercel.app/api/health' },
];

async function checkService(service) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(service.url, { signal: controller.signal });
    clearTimeout(timeout);
    return res.ok ? 'up' : 'down';
  } catch {
    clearTimeout(timeout);
    return 'down';
  }
}

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);
  try {
    const checks = await Promise.all(
      MONITORED_SERVICES.map(async (service) => {
        const state = await checkService(service);
        const [incident] = await sql`
          SELECT started_at FROM service_incidents
          WHERE service = ${service.name} AND status = 'down'
          LIMIT 1
        `;
        return {
          name: service.name,
          url: service.url,
          status: state,
          downSince: incident ? incident.started_at : null,
        };
      })
    );
    const allUp = checks.every(c => c.status === 'up');
    res.json({ overall: allUp ? 'operational' : 'degraded', services: checks, ts: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
