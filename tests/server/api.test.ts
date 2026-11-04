import { describe, it, expect } from 'vitest';
import { buildApp } from '../../src/server/app.ts';

const H = { 'x-device-id': '11111111-1111-4111-8111-111111111111' };
const body = { target: 'patron', situation: 'gec_kaldim', channel: 'whatsapp', style: 'ciddi', intensity: 5 };

async function saveGenerated(app: ReturnType<typeof buildApp>, pick = 0) {
  const gen = await app.inject({ method: 'POST', url: '/api/generate', headers: H, payload: body });
  const variant = gen.json().variants[pick];
  const saved = await app.inject({ method: 'POST', url: '/api/lies', headers: H, payload: { variant, form: body } });
  return { variant, id: saved.json().id as string };
}

describe('API', () => {
  it('X-Device-Id yoksa 400 DEVICE_REQUIRED', async () => {
    const app = buildApp({ dbPath: ':memory:' });
    const res = await app.inject({ method: 'POST', url: '/api/generate', payload: body });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('DEVICE_REQUIRED');
    await app.close();
  });

  it('geçerli istek 3 varyant ve gerçek sağlayıcıyı döner', async () => {
    const app = buildApp({ dbPath: ':memory:' });
    const res = await app.inject({ method: 'POST', url: '/api/generate', headers: H, payload: body });
    expect(res.statusCode).toBe(200);
    expect(res.json().variants).toHaveLength(3);
    expect(res.json().provider).toBe('template');
    await app.close();
  });

  it('şiddet 0 → 400 VALIDATION ve alan adı mesajda', async () => {
    const app = buildApp({ dbPath: ':memory:' });
    const res = await app.inject({ method: 'POST', url: '/api/generate', headers: H, payload: { ...body, intensity: 0 } });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('VALIDATION');
    expect(res.json().error.message).toContain('intensity');
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

  it('kayıt eklenir, listelenir, durumu değişir (beklemede dahil)', async () => {
    const app = buildApp({ dbPath: ':memory:' });
    const { id } = await saveGenerated(app, 1);

    const list = await app.inject({ method: 'GET', url: '/api/lies', headers: H });
    expect(list.json().items).toHaveLength(1);

    await app.inject({ method: 'PATCH', url: `/api/lies/${id}`, headers: H, payload: { status: 'tuttu' } });
    const back = await app.inject({ method: 'PATCH', url: `/api/lies/${id}`, headers: H, payload: { status: 'beklemede' } });
    expect(back.statusCode).toBe(200);

    const after = await app.inject({ method: 'GET', url: '/api/lies', headers: H });
    expect(after.json().items[0].status).toBe('beklemede');
    await app.close();
  });

  it('kaydederken risk ve sorgular sunucuda yeniden üretilir', async () => {
    const app = buildApp({ dbPath: ':memory:' });
    const fake = {
      text: 'Geç kaldım, haber de veremedim. Yolda trafik vardı. Kusura bakma, bir daha olmayacak.',
      strategy: 'detayli',
      riskScore: 0,
      riskLevel: 'dusuk',
      riskReasons: [],
      queries: [],
    };
    await app.inject({ method: 'POST', url: '/api/lies', headers: H, payload: { variant: fake, form: body } });

    const list = await app.inject({ method: 'GET', url: '/api/lies', headers: H });
    const item = list.json().items[0];
    expect(item.riskScore).toBeGreaterThan(0);
    expect(item.queries.length).toBeGreaterThan(0);
    await app.close();
  });

  it('aynı kişiye çakışan iki kayıt çelişki olarak döner ve riski yükseltir', async () => {
    const app = buildApp({ dbPath: ':memory:' });
    await saveGenerated(app, 0);
    await saveGenerated(app, 0);

    const conf = await app.inject({ method: 'GET', url: '/api/lies/conflicts', headers: H });
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

  it('geçersiz limit 500 üretmez, güvenli varsayılana düşer', async () => {
    const app = buildApp({ dbPath: ':memory:' });
    for (const q of ['1.5', '-1', 'abc', '100000']) {
      const res = await app.inject({ method: 'GET', url: `/api/lies?limit=${q}`, headers: H });
      expect(res.statusCode, q).toBe(200);
      expect(Array.isArray(res.json().items)).toBe(true);
    }
    await app.close();
  });

  it('bozuk JSON gövdesi sözleşme formatında 400 döner', async () => {
    const app = buildApp({ dbPath: ':memory:' });
    const res = await app.inject({
      method: 'POST',
      url: '/api/generate',
      headers: { ...H, 'content-type': 'application/json' },
      payload: '{"target":',
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('INVALID_JSON');
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
