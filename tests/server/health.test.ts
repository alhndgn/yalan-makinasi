import { describe, it, expect } from 'vitest';
import { buildApp } from '../../src/server/app.ts';

describe('GET /api/health', () => {
  it('200 döner ve modu bildirir', async () => {
    const app = buildApp({ dbPath: ':memory:' });
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ ok: true, aiMode: 'off' });
    await app.close();
  });
});
