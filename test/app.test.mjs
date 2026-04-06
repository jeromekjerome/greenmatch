import assert from 'node:assert/strict';
import { startServer } from './helpers.mjs';
import { test } from './runner.mjs';

process.env.NODE_ENV = 'test';
process.env.OPENAI_API_KEY ||= 'test-openai-key';

const { default: app } = await import('../server.js');

test('recommend validates required answers and session id', async () => {
  const server = await startServer(app);
  try {
    const response = await fetch(`${server.baseUrl}/api/recommend`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ answers: null, sessionId: '' }),
    });
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.deepEqual(body, { error: 'answers and sessionId required' });
  } finally {
    await server.close();
  }
});

test('unknown route does not crash the server', async () => {
  const server = await startServer(app);
  try {
    const response = await fetch(`${server.baseUrl}/definitely-not-a-real-route`);
    assert.notEqual(response.status, 500);
  } finally {
    await server.close();
  }
});