/**
 * Paylaşım yardımcıları.
 * Native (APK) → cihazın kendi paylaşım sayfası (WhatsApp, Instagram, mesajlar…).
 * Web → WhatsApp için `whatsapp://` derin bağlantısı, olmazsa wa.me.
 */

export function isNative(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

/** Cihazın paylaşım sayfasını açar (uygulamalar listelenir). */
export async function shareSheet(text: string, title = 'Paylaş'): Promise<boolean> {
  if (isNative()) {
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({ text, title, dialogTitle: title });
      return true;
    } catch {
      return false;
    }
  }

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ text, title });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/** WhatsApp'ı doğrudan açar: sohbet seçimi → mesaj hazır. */
export async function shareToWhatsApp(text: string): Promise<'native' | 'deep-link' | 'web'> {
  if (isNative()) {
    const ok = await shareSheet(text, 'WhatsApp ile gönder');
    if (ok) return 'native';
  }

  const encoded = encodeURIComponent(text);
  try {
    window.location.href = `whatsapp://send?text=${encoded}`;
    return 'deep-link';
  } catch {
    window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener');
    return 'web';
  }
}

/** Instagram gibi metin kabul etmeyen uygulamalar: paylaşım sayfası, olmazsa kopyala + uygulamayı aç. */
export async function shareElsewhere(text: string): Promise<'paylasildi' | 'kopyalandi'> {
  const shared = await shareSheet(text, 'Paylaş');
  if (shared) return 'paylasildi';
  await navigator.clipboard.writeText(text).catch(() => null);
  window.open('https://www.instagram.com/', '_blank', 'noopener');
  return 'kopyalandi';
}
