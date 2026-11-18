import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearPin,
  failState,
  hasPin,
  isUnlocked,
  lockedSeconds,
  markLocked,
  markUnlocked,
  setPin,
  verifyPin,
} from '../../src/web/src/lib/lock.ts';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('defter kilidi', () => {
  it('başlangıçta kilit yok', () => {
    expect(hasPin()).toBe(false);
    expect(isUnlocked()).toBe(true);
  });

  it('PIN düz metin saklanmaz', async () => {
    await setPin('1234');
    const raw = localStorage.getItem('ym_lock') ?? '';
    expect(raw).not.toContain('1234');
    expect(hasPin()).toBe(true);
  });

  it('doğru PIN kabul, yanlış reddedilir', async () => {
    await setPin('4321');
    expect(await verifyPin('4321')).toBe(true);
    expect(await verifyPin('1111')).toBe(false);
  });

  it('5 yanlışta bekleme başlar, doğru giriş sıfırlar', async () => {
    await setPin('1234');
    for (let i = 0; i < 5; i += 1) await verifyPin('0000');
    expect(lockedSeconds()).toBeGreaterThan(0);
    expect(failState().count).toBe(0);
  });

  it('oturum açılınca kilit açık görünür, markLocked kapatır', async () => {
    await setPin('1234');
    markUnlocked();
    expect(isUnlocked()).toBe(true);
    markLocked();
    expect(isUnlocked()).toBe(false);
  });

  it('kilit kaldırılınca her şey silinir', async () => {
    await setPin('1234');
    clearPin();
    expect(hasPin()).toBe(false);
    expect(localStorage.getItem('ym_lock')).toBeNull();
  });
});
