import { describe, it, expect } from 'vitest';
import { buildApp } from '../../src/server/app.ts';

const H = { 'x-device-id': '22222222-2222-4222-8222-222222222222' };

describe('kişi profili uçları', () => {
  it('profil kaydedilir, okunur ve defter özetine yansır', async () => {
    const app = buildApp({ dbPath: ':memory:' });

    // önce kayıt oluştur (kişi özette görünsün)
    await app.inject({
      method: 'POST',
      url: '/api/lies/manual',
      headers: H,
      payload: { person: 'Ateş', text: 'dün gelemedim, iş çıktı', target: 'sevgili' },
    });

    const put = await app.inject({
      method: 'PUT',
      url: '/api/people/Ate%C5%9F',
      headers: H,
      payload: { relation: 'sevgili', gender: 'erkek', closeness: 9, notes: 'gece çalışıyor' },
    });
    expect(put.statusCode).toBe(200);

    const get = await app.inject({ method: 'GET', url: '/api/people/Ate%C5%9F', headers: H });
    expect(get.statusCode).toBe(200);
    expect(get.json()).toMatchObject({ name: 'Ateş', relation: 'sevgili', gender: 'erkek', closeness: 9 });

    const people = await app.inject({ method: 'GET', url: '/api/lies/people', headers: H });
    const summary = people.json().people[0];
    expect(summary).toMatchObject({ person: 'Ateş', closeness: 9, gender: 'erkek' });

    await app.close();
  });

  it('geçersiz profil 400 döner', async () => {
    const app = buildApp({ dbPath: ':memory:' });
    const res = await app.inject({
      method: 'PUT',
      url: '/api/people/Ali',
      headers: H,
      payload: { closeness: 99 },
    });
    expect(res.statusCode).toBe(400);
    await app.close();
  });
});
