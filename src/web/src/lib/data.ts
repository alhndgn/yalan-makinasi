import { api } from './api.ts';
import { localData } from './localStore.ts';

/**
 * Tek veri arayüzü. `VITE_LOCAL_ENGINE=1` ile derlenen sürüm (APK / çevrimdışı)
 * cihaz içi motoru ve localStorage'ı kullanır; varsayılan sürüm sunucuya gider.
 *
 * Native (Capacitor) kabuğunda sunucu yolu yoktur: `/api` isteği cihazın kendi
 * WebView'ına gider ve 404 döner. Bu yüzden native her zaman yerel moda düşer —
 * yanlış betikle derlenen APK'da kayıt sessizce kaybolmasın.
 */
function isNativeShell(): boolean {
  const cap = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

export const isLocalMode = import.meta.env.VITE_LOCAL_ENGINE === '1' || isNativeShell();

export const data = isLocalMode ? localData : api;
