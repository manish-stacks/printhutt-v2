/**
 * readCompressed(reader, file) — drop-in for `reader.readAsDataURL(file)`.
 * Phone photos (4000px / 5-10MB) ko print-safe size (max 2400px long side) me
 * resize karta hai → preview/canvas lag, localStorage bloat aur slow upload khatam.
 * PNG (transparency) PNG hi rehta hai; baaki JPEG 0.9. Chhoti files as-is.
 * reader ke existing onload/onloadend handlers compressed data ke saath chalte hain.
 */
const MAX_SIDE = 2400;
const SKIP_BELOW = 700 * 1024; // < 700KB → compress ki zarurat nahi

export function readCompressed(reader: FileReader, file: File): void {
  if (typeof window === 'undefined' || !file?.type?.startsWith('image/') || file.size < SKIP_BELOW || file.type === 'image/gif') {
    reader.readAsDataURL(file);
    return;
  }
  const url = URL.createObjectURL(file);
  const img = new window.Image();
  img.onload = () => {
    try {
      const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no ctx');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);
      const isPng = file.type === 'image/png' || file.type === 'image/webp';
      const type = isPng ? 'image/png' : 'image/jpeg';
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          // compressed bada nikla to original hi use karo
          reader.readAsDataURL(blob && blob.size < file.size ? blob : file);
        },
        type,
        isPng ? undefined : 0.9
      );
    } catch {
      URL.revokeObjectURL(url);
      reader.readAsDataURL(file);
    }
  };
  img.onerror = () => { URL.revokeObjectURL(url); reader.readAsDataURL(file); };
  img.src = url;
}
