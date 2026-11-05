import { api } from './api.ts';
import { localData } from './localStore.ts';

/**
 * Tek veri arayüzü. `VITE_LOCAL_ENGINE=1` ile derlenen sürüm (APK / çevrimdışı)
 * cihaz içi motoru ve localStorage'ı kullanır; varsayılan sürüm sunucuya gider.
 */
export const isLocalMode = import.meta.env.VITE_LOCAL_ENGINE === '1';

export const data = isLocalMode ? localData : api;
