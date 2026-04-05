// Copyright (c) 2026 Jerome W. Dewald. All rights reserved.
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function setupDB() {
  console.log('Setting up GreenMatch database...');

  // ── Platform uptime monitoring ───────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS service_incidents (
      id           SERIAL PRIMARY KEY,
      service      TEXT NOT NULL,
      url          TEXT NOT NULL,
      status       TEXT NOT NULL DEFAULT 'down',  -- down | resolved
      started_at   TIMESTAMP DEFAULT NOW(),
      resolved_at  TIMESTAMP,
      last_checked TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_incidents_service_status ON service_incidents(service, status)`;
  console.log('✅ service_incidents');

  console.log('\nDatabase setup complete.');
}

setupDB().catch(console.error);
