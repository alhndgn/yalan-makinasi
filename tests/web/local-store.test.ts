import { describe, it, expect, beforeEach } from 'vitest';
import { localData } from '../../src/web/src/lib/localStore.ts';

const form = { target: 'patron' as const, situation: 'gec_kaldim' as const, channel: 'whatsapp' as const, style: 'ciddi' as const, intensity: 6 };

beforeEach(() => localStorage.clear());

describe('cihaz içi veri katmanı (APK modu)', () => {
  it('üretim yapar, sağlayıcı template döner', async () => {
    const result = await localData.generate({ ...form, salt: '1' });
    expect(result.provider).toBe('template');
    expect(result.variants).toHaveLength(3);
  });

  it('kaydeder, listeler, durumu değiştirir, siler', async () => {
    const { variants } = await localData.generate({ ...form, salt: '1' });
    const saved = await localData.saveLie({ variant: variants[1]!, form, provider: 'template' });

    const list = await localData.listLies();
    expect(list.items).toHaveLength(1);
    expect(list.items[0]!.id).toBe(saved.id);

    await localData.updateStatus(saved.id, 'tuttu');
    expect((await localData.listLies()).items[0]!.status).toBe('tuttu');

    await localData.deleteLie(saved.id);
    expect((await localData.listLies()).items).toHaveLength(0);
  });

  it('kaydederken riski metinden yeniden hesaplar', async () => {
    const fake = { text: 'Geç kaldım. Yolda trafik vardı. Kusura bakma.', strategy: 'detayli' as const, riskScore: 0, riskLevel: 'dusuk' as const, riskReasons: [], queries: [] };
    await localData.saveLie({ variant: fake, form, provider: 'template' });
    expect((await localData.listLies()).items[0]!.riskScore).toBeGreaterThan(0);
  });

  it('çakışan iki kaydı çelişki olarak döner', async () => {
    const { variants } = await localData.generate({ ...form, salt: '1' });
    await localData.saveLie({ variant: variants[0]!, form, provider: 'template' });
    await localData.saveLie({ variant: variants[0]!, form, provider: 'template' });
    expect((await localData.conflicts()).conflicts).toHaveLength(1);
  });

  it('tümünü siler ve bozuk kayıtta çökmez', async () => {
    const { variants } = await localData.generate({ ...form, salt: '1' });
    await localData.saveLie({ variant: variants[0]!, form, provider: 'template' });
    expect((await localData.deleteAll()).deleted).toBe(1);

    localStorage.setItem('ym_lies_v1', '{bozuk');
    expect((await localData.listLies()).items).toEqual([]);
  });
});
