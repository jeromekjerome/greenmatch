// Copyright (c) 2026 Jerome W. Dewald. All rights reserved.
import { neon } from '@neondatabase/serverless';
import nodemailer from 'nodemailer';

const MONITORED_SERVICES = [
  { name: 'GreenMatch', url: 'https://greenmatch-weld.vercel.app/api/health' },
  { name: 'FreshCast',  url: 'https://freshcast-eosin.vercel.app/api/health' },
  { name: 'PulsePass',  url: 'https://pulsepass.vercel.app/api/health' },
];

function verifyCron(req, res) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

function getTransporter() {
  if (!process.env.SMTP_USER) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.jwd.nyc',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

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

async function sendUptimeAlert(service, type) {
  const t = getTransporter();
  const alertEmail = process.env.ALERT_EMAIL || process.env.SMTP_USER;
  if (!t || !alertEmail) {
    console.log(`[UPTIME ALERT] ${type.toUpperCase()} — ${service.name}: ${service.url}`);
    return;
  }
  const isDown = type === 'down';
  await t.sendMail({
    from:    process.env.SMTP_USER,
    to:      alertEmail,
    subject: `[${isDown ? '🔴 DOWN' : '🟢 RECOVERED'}] ${service.name} — hospitality platform`,
    html: `
      <div style="font-family:sans-serif;max-width:580px;margin:auto">
        <h2 style="color:${isDown ? '#e53e3e' : '#38a169'}">${isDown ? '🔴 Service Down' : '🟢 Service Recovered'}: ${service.name}</h2>
        <p><strong>URL:</strong> <a href="${service.url}">${service.url}</a></p>
        <p><strong>Time:</strong> ${new Date().toUTCString()}</p>
        ${isDown ? '<p>No response or non-200 status after 5s timeout. Check Vercel dashboard.</p>' : '<p>Health endpoint is responding normally.</p>'}
        <p style="color:#999;font-size:12px;margin-top:2rem">GreenMatch Uptime Monitor — hospitality platform</p>
      </div>
    `,
  });
}

export default async function handler(req, res) {
  if (!verifyCron(req, res)) return;
  const sql = neon(process.env.DATABASE_URL);
  const results = [];
  try {
    for (const service of MONITORED_SERVICES) {
      const state = await checkService(service);
      const now = new Date();

      if (state === 'down') {
        const [existing] = await sql`
          SELECT id FROM service_incidents
          WHERE service = ${service.name} AND status = 'down'
          LIMIT 1
        `;
        if (!existing) {
          await sql`
            INSERT INTO service_incidents (service, url, status, started_at, last_checked)
            VALUES (${service.name}, ${service.url}, 'down', ${now}, ${now})
          `;
          await sendUptimeAlert(service, 'down');
          results.push({ service: service.name, state: 'down', action: 'incident_opened' });
        } else {
          await sql`UPDATE service_incidents SET last_checked = ${now} WHERE id = ${existing.id}`;
          results.push({ service: service.name, state: 'down', action: 'incident_ongoing' });
        }
      } else {
        const [existing] = await sql`
          SELECT id FROM service_incidents
          WHERE service = ${service.name} AND status = 'down'
          LIMIT 1
        `;
        if (existing) {
          await sql`
            UPDATE service_incidents
            SET status = 'resolved', resolved_at = ${now}, last_checked = ${now}
            WHERE id = ${existing.id}
          `;
          await sendUptimeAlert(service, 'recovered');
          results.push({ service: service.name, state: 'up', action: 'incident_resolved' });
        } else {
          results.push({ service: service.name, state: 'up', action: 'ok' });
        }
      }
    }
    res.json({ checked: results.length, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
