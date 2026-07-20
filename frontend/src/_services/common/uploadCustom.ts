/**
 * Customize-flow image upload helper.
 *
 * Purpose: base64 ko cart / localStorage / DB me jaane se rokna. User photo YA
 * generated preview (html2canvas) — sab S3 temp-uploads/ pe upload hoke sirf URL
 * cart me jaata hai. Order place hone par backend inhe permanent move kar deta hai.
 *
 * Do entry points:
 *   uploadCustomFile(file)      — <input type=file> se aaya File (resize + upload)
 *   uploadCustomDataUrl(dataUrl)— html2canvas / cropper ka base64 dataURL (upload)
 *
 * Aur ek cart-safety helper:
 *   resolveCustomDataImages(custom_data, thumbnailUrl) — koi bhi bacha base64
 *   value ko URL me badal deta hai (deep). Cart store interceptor isse use karta hai.
 */
import { axiosInstance } from '@/utils/axios';

const MAX_SIDE = 1200;
const JPEG_QUALITY = 0.85;

/* ---------- client-side resize ---------- */

/** File → resized JPEG base64 dataURL. Resize se upload chhota + tez. */
export function resizeFileToDataUrl(
  file: File,
  maxSide = MAX_SIDE,
  quality = JPEG_QUALITY
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read failed'));
    reader.onloadend = () => {
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('no canvas ctx'));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('image decode failed'));
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/* ---------- upload calls ---------- */

interface UploadResponse {
  url: string;
  public_id: string;
}

async function postDataUri(dataUri: string): Promise<string> {
  // NOTE: axios response interceptor already `response.data` return karta hai,
  // isliye ye seedha { success, url, public_id } hai — { data } destructure NAHI.
  const res = (await axiosInstance.post('/upload/custom-image', { dataUri })) as unknown as UploadResponse;
  if (!res?.url) throw new Error('upload returned no url');
  return res.url;
}

/** File chuni → resize → S3 upload → URL. Yehi pages ko call karni hai on-select. */
export async function uploadCustomFile(file: File): Promise<string> {
  const dataUri = await resizeFileToDataUrl(file);
  return postDataUri(dataUri);
}

/** base64 dataURL (html2canvas etc.) → S3 upload → URL. */
export async function uploadCustomDataUrl(dataUrl: string): Promise<string> {
  if (!dataUrl?.startsWith('data:image')) return dataUrl; // already url / empty
  return postDataUri(dataUrl);
}

/* ---------- cart safety-net (deep base64 → url) ---------- */

const isDataImage = (v: unknown): v is string =>
  typeof v === 'string' && v.startsWith('data:image');

/**
 * custom_data ke andar jitne bhi base64 image values hain (strings + arrays),
 * unhe S3 URL me badal do. Non-image / already-url values untouched.
 * Cart store isse addToCart se pehle chalata hai — guarantee ki base64 kabhi
 * localStorage/DB me na jaaye, chahe kisi bhi customize page se aaye.
 */
export async function resolveCustomDataImages<T extends Record<string, unknown>>(
  custom_data: T | undefined | null
): Promise<T | undefined | null> {
  if (!custom_data || typeof custom_data !== 'object') return custom_data;

  const resolveValue = async (val: unknown): Promise<unknown> => {
    if (isDataImage(val)) {
      try {
        return await uploadCustomDataUrl(val);
      } catch (e) {
        console.error('custom image upload failed, keeping inline:', e);
        return val; // graceful fallback — order-time backend still uploads
      }
    }
    if (Array.isArray(val)) return Promise.all(val.map(resolveValue));
    return val;
  };

  const out: Record<string, unknown> = { ...custom_data };
  for (const key of Object.keys(custom_data)) {
    const val = (custom_data as Record<string, unknown>)[key];
    if (isDataImage(val) || Array.isArray(val)) {
      out[key] = await resolveValue(val);
    }
  }
  return out as T;
}

/** Thumbnail url agar base64 hai to usse bhi URL bana do. */
export async function resolveThumbnailUrl(url: unknown): Promise<string | undefined> {
  if (isDataImage(url)) {
    try {
      return await uploadCustomDataUrl(url);
    } catch {
      return url as string;
    }
  }
  return typeof url === 'string' ? url : undefined;
}

export { isDataImage };
