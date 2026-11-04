import { describe, it, expect } from 'vitest';
import { buildApp } from '../../src/server/app.ts';

const H = { 'x-device-id': '11111111-1111-4111-8111-111111111111' };
const body = { target: 'patron', situation: 'gec_kaldim', channel: 'whatsapp', style: 'ciddi', intensity: 5 };

describe('API', () => {
  it('X-Device-Id yoksa 400 DEVICE_REQUIRED', async () => {
    const app = buildApp({ dbPath: ':memory:' });
    const res = await app.inject({ method: 'POST', url: '/api/generate', payload: body });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('DEVICE_REQUIRED');
    await app.close();
  });

  it('geçerli istek 3 varyant döner', async () => {
    const app = buildApp({ dbPath: ':memory:' });
    const res = await app.inject({ method: 'POST', url: '/api/generate', headers: H, payload: body });
    expect(res.statusCode).toBe(200);
    const variants = res.json().variants;
    expect(variants).toHaveLength(3);
    expect(variants[0].text.length).toBeGreaterThan(0);
    await app.close();
  });

  it('şiddet 0 → 400 VALIDATION', async () => {
    const app = buildApp({ dbPath: ':memory:' });
    const res = await app.inject({ method: 'POST', url: '/api/generate', headers: H, payload: { ...body, intensity: 0 } });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('VALIDATION');
    await app.close();
  });

  it('belge talebi ABUSE_BLOCKED', async () => {
    const app = buildApp({ dbPath: ':memory:' });
    const res = await app.inject({
      method: 'POST',
      url: '/api/generate',
      headers: H,
      payload: { ...body, situation: 'ozel', situationCustom: 'bana doktor raporu yaz', style: 'resmi' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('ABUSE_BLOCKED');
    await app.close();
  });

  it('kayıt eklenir, listelenir, durumu değişir', async () => {
    const app = buildApp({ dbPath: ':memory:' });
    const gen = await app.inject({ method: 'POST', url: '/api/generate', headers: H, payload: body });
    const variant = gen.json().variants[1];
    const saved = await app.inject({ method: 'POST', url: '/api/lies', headers: H, payload: { variant, form: body } });
    expect(saved.statusCode).toBe(200);
    const id = saved.json().id;

    const list = await app.inject({ method: 'GET', url: '/api/lies', headers: H });
    expect(list.json().items).toHaveLength(1);

    const patched = await app.inject({ method: 'PATCH', url: `/api/lies/${id}`, headers: H, payload: { status: 'tuttu' } });
    expect(patched.statusCode).toBe(200);

    const after = await app.inject({ method: 'GET', url: '/api/lies', headers: H });
    expect(after.json().items[0].status).toBe('tuttu');
    await app.close();
  });

  it('çelişki ucu kaydı bulur ve sonraki üretimin riskini yükseltir', async () => {
    const app = buildApp({ dbPath: ':memory:' });
    const gen = await app.inject({ method: 'POST', url: '/api/generate', headers: H, payload: body });
    await app.inject({ method: 'POST', url: '/api/lies', headers: H, payload: { variant: gen.json().variants[0], form: body } });

    const conf = await app.inject({ method: 'GET', url: '/api/lies/conflicts?target=patron', headers: H });
    expect(conf.json().conflicts).toHaveLength(1);

    const again = await app.inject({ method: 'POST', url: '/api/generate', headers: H, payload: body });
    expect(again.json().variants[0].riskReasons.join(' ')).toContain('30 günde');
    await app.close();
  });

  it('preview kayıtsız risk önizlemesi döner', async () => {
    const app = buildApp({ dbPath: ':memory:' });
    const res = await app.inject({
      method: 'GET',
      url: '/api/lies/conflicts/preview?target=patron&situation=gec_kaldim&channel=yuz_yuze&intensity=8',
      headers: H,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ score: 74, level: 'yuksek' });
    await app.close();
  });

  it('21. istek 429 döner', async () => {
    const app = buildApp({ dbPath: ':memory:', rateLimitPerMin: 20 });
    let last = 0;
    for (let i = 0; i < 21; i++) {
      const r = await app.inject({ method: 'POST', url: '/api/generate', headers: H, payload: { ...body, intensity: 3 } });
      last = r.statusCode;
    }
    expect(last).toBe(429);
    await app.close();
  });
});
