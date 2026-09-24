/**
 * Browser-side image compression utility.
 * Use this everywhere images are uploaded to keep payloads manageable.
 */

export interface CompressResult {
  dataUrl: string;
  blob: Blob;
  file: File;
  originalSize: number;
  compressedSize: number;
}

export async function compressImage(
  file: File,
  options: { maxWidth?: number; quality?: number; maxRawMB?: number } = {}
): Promise<CompressResult> {
  const { maxWidth = 1600, quality = 0.85, maxRawMB = 50 } = options;

  // Sanity check
  if (file.size > maxRawMB * 1024 * 1024) {
    throw new Error(`File too large (max ${maxRawMB}MB). Use a smaller image.`);
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload an image file');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('No canvas context'));
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Compression failed'));
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.\w+$/, '.jpg'),
              { type: 'image/jpeg' }
            );
            resolve({
              dataUrl,
              blob,
              file: compressedFile,
              originalSize: file.size,
              compressedSize: blob.size,
            });
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Estimate total payload size of a cart (in bytes).
 * Used to pre-validate before sending big requests.
 */
export function estimatePayloadSize(items: any[]): number {
  try {
    return new Blob([JSON.stringify(items)]).size;
  } catch {
    return 0;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}