import { describe, it, expect, afterEach } from 'vitest';
import { buildApp } from '../../src/server/app.ts';

const H = { 'x-device-id': '11111111-1111-4111-8111-111111111111' };

afterEach(() => {
  delete process.env.AI_BASE_URL;
  delete process.env.VITE_AI_BASE_URL;
});

describe('AI proxy', () => {
  it('yapılandırma yoksa 503 döner', async () => {
    delete process.env.AI_BASE_URL;
    delete process.env.VITE_AI_BASE_URL;
    const app = buildApp({ dbPath: ':memory:' });
    const res = await app.inject({ method: 'POST', url: '/api/ai/chat', headers: H, payload: { messages: [] } });
    expect(res.statusCode).toBe(503);
    expect(res.json().error.code).toBe('AI_NOT_CONFIGURED');
    await app.close();
  });

  it('cihaz kimliği olmadan 400 döner', async () => {
    const app = buildApp({ dbPath: ':memory:' });
    const res = await app.inject({ method: 'POST', url: '/api/ai/chat', payload: { messages: [] } });
    expect(res.statusCode).toBe(400);
    await app.close();
  });
});
