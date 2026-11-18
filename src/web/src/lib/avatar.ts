/**
 * Kişi profil fotoğrafı — cihazda saklanır (localStorage).
 * Fotoğraf yüklenirken 256×256 kareye kırpılır ve JPEG'e çevrilir (~20-40 KB),
 * böylece defter dosyası şişmez ve sunucuya hiçbir şey gönderilmez.
 */

const KEY = 'ym_avatars_v1';
const SIZE = 256;

type Avatars = Record<string, string>;

function readAll(): Avatars {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Avatars) : {};
  } catch {
    return {};
  }
}

function writeAll(all: Avatars): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* kota dolu: sessizce vazgeç */
  }
}

export function getAvatar(person: string): string | null {
  return readAll()[person.trim()] ?? null;
}

export function removeAvatar(person: string): void {
  const all = readAll();
  delete all[person.trim()];
  writeAll(all);
}

/** Dosyayı kareye kırpıp dataURL olarak kaydeder. */
export async function saveAvatar(person: string, file: File): Promise<string> {
  const dataUrl = await toSquareDataUrl(file);
  const all = readAll();
  all[person.trim()] = dataUrl;
  writeAll(all);
  return dataUrl;
}

function toSquareDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      try {
        const side = Math.min(image.width, image.height);
        const canvas = document.createElement('canvas');
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('canvas yok');
        ctx.drawImage(
          image,
          (image.width - side) / 2,
          (image.height - side) / 2,
          side,
          side,
          0,
          0,
          SIZE,
          SIZE,
        );
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      } catch (err) {
        reject(err);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('görsel okunamadı'));
    };
    image.src = url;
  });
}
