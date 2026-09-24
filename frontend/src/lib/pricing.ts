/**
 * Single source of truth for storefront pricing.
 * Rule (admin-driven, kuch hardcoded nahi):
 *  - Product ka apna discount (discountType + discountPrice).
 *  - Har variant ka apna alag discount. Variant pe discountType set hai ('' bhi)
 *    to wahi lagega; sirf purane variants (field hi missing) product discount lete hain.
 *  - price = MRP, final = MRP - discount.
 */
export type DiscountType = 'percentage' | 'fixed' | '' | undefined | null | string;

export interface PriceSource {
  price?: number;
  discountType?: DiscountType;
  discountPrice?: number;
}

export function unitPrice(price?: number, type?: DiscountType, value?: number): number {
  const p = Number(price) || 0;
  const v = Number(value) || 0;
  if (v <= 0) return p;
  if (type === 'percentage') return Math.max(0, p - (p * v) / 100);
  if (type === 'fixed') return Math.max(0, p - v);
  return p;
}

/** Variant select hua ho to uska discount, warna product ka */
export function effectivePricing(product: PriceSource, variant?: PriceSource | null) {
  let src: PriceSource = product;
  if (variant) {
    const ownDiscount = variant.discountType !== undefined && variant.discountType !== null;
    src = {
      price: variant.price ?? product.price,
      discountType: ownDiscount ? variant.discountType : product.discountType,
      discountPrice: ownDiscount ? variant.discountPrice ?? 0 : product.discountPrice,
    };
  }
  const mrp = Number(src.price) || 0;
  const final = unitPrice(mrp, src.discountType, src.discountPrice);
  const offPercent = mrp > 0 ? Math.round(((mrp - final) / mrp) * 100) : 0;
  return {
    mrp,
    final,
    offPercent,
    hasDiscount: final < mrp,
    discountType: (src.discountType || '') as string,
    discountPrice: Number(src.discountPrice) || 0,
  };
}

/** Variant dhundo: selectedVariant._id → custom_data.variant (size) → price match */
export function findVariant(product: any): any | null {
  const list: any[] = Array.isArray(product?.varient) ? product.varient : [];
  if (!list.length) return null;
  const sv = product?.selectedVariant;
  if (sv?._id) {
    const v = list.find((x) => String(x._id) === String(sv._id));
    if (v) return v;
  }
  const size = product?.custom_data?.variant || sv?.size;
  if (size) {
    const v = list.find((x) => x.size === size);
    if (v) return v;
  }
  if (product?.isVarientStatus) {
    const v = list.find((x) => Number(x.price) === Number(product.price));
    if (v) return v;
  }
  return null;
}

/* YouTube helpers — admin thumbnail/demoVideo me YouTube link daal sakta hai */
export function youtubeId(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
export const youtubeThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
export const youtubeEmbed = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`;

/** Card/listing pe video thumbnail? (thumbnail khud YouTube link ho, ya admin ne "video as thumbnail" ON kiya) */
export function cardVideoId(p: any): string | null {
  return youtubeId(p?.thumbnail?.url) || (p?.videoAsThumbnail ? youtubeId(p?.demoVideo) : null);
}
