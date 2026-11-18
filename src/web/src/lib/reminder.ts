/**
 * Akıbet hatırlatması: 48 saattir "beklemede" olan kayıt için nazik bir dürtme.
 *
 * Native (Capacitor) → yerel bildirim; web → uygulama açıkken gösterilen bant.
 * Bildirim izni yoksa sessizce vazgeçer, kullanıcıya hata gösterilmez.
 */

import type { LieLike } from '../../../engine/conflict.ts';
import { stalePending } from '../../../engine/insights.ts';

const REMINDER_HOURS = 48;
const NOTIFICATION_BASE = 7400;

function isNative(): boolean {
  const cap = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

type LocalNotifications = {
  checkPermissions: () => Promise<{ display: 'granted' | 'denied' | 'prompt' }>;
  requestPermissions: () => Promise<{ display: 'granted' | 'denied' | 'prompt' }>;
  cancel: (opts: { notifications: { id: number }[] }) => Promise<void>;
  schedule: (opts: {
    notifications: { id: number; title: string; body: string; schedule: { at: Date }; extra?: Record<string, string> }[];
  }) => Promise<void>;
};

async function loadPlugin(): Promise<LocalNotifications | null> {
  if (!isNative()) return null;
  try {
    const mod = await import('@capacitor/local-notifications');
    return mod.LocalNotifications as unknown as LocalNotifications;
  } catch {
    return null;
  }
}

/** Uygulama açılışında çağrılır: bekleyen kayıtlar için hatırlatma kurar. */
export async function syncReminders(items: LieLike[], lang: 'tr' | 'en'): Promise<number> {
  const plugin = await loadPlugin();
  if (!plugin) return 0;

  try {
    let permission = await plugin.checkPermissions();
    if (permission.display === 'prompt') permission = await plugin.requestPermissions();
    if (permission.display !== 'granted') return 0;

    const pending = items
      .filter((item) => (item.status ?? 'beklemede') === 'beklemede')
      .slice(0, 20);

    await plugin.cancel({ notifications: pending.map((_, i) => ({ id: NOTIFICATION_BASE + i })) });

    const now = Date.now();
    const due = pending
      .map((item, i) => ({ item, id: NOTIFICATION_BASE + i, at: item.createdAt + REMINDER_HOURS * 3_600_000 }))
      .filter((entry) => entry.at > now);

    if (due.length > 0) {
      await plugin.schedule({
        notifications: due.map((entry) => ({
          id: entry.id,
          title: lang === 'en' ? 'Did that one hold?' : 'O yalan tuttu mu?',
          body:
            lang === 'en'
              ? `You told ${entry.item.person || 'someone'} something ${REMINDER_HOURS} hours ago — did they buy it?`
              : `${entry.item.person || 'birine'} ${REMINDER_HOURS} saat önce bir şey söyledin — tuttu mu?`,
          schedule: { at: new Date(entry.at) },
          extra: { lieId: entry.item.id },
        })),
      });
    }
    return due.length;
  } catch {
    return 0;
  }
}

/** Web: uygulama açıkken gösterilecek hatırlatma sayısı. */
export function pendingReminderCount(items: LieLike[], now = Date.now()): number {
  if (isNative()) return 0;
  return stalePending(items, REMINDER_HOURS, now).length;
}

export { REMINDER_HOURS };
