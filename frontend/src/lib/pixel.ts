/**
 * Meta Pixel (Facebook) event helpers.
 *
 * Pixel base code admin → Settings → "Custom Scripts" (head) me paste hota hai,
 * jisse `window.fbq` globally available ho jata hai. Yahan se hum sirf EVENTS
 * fire karte hain (guarded — agar fbq na ho to chup-chaap skip).
 *
 * Purchase tracking ka problem: Razorpay turant success deta hai, par PhonePe
 * external redirect ke baad confirmation page pe wapas aata hai jahan order ka
 * amount available nahi hota. Isliye checkout pe payment se PEHLE order details
 * sessionStorage me rakh dete hain, aur confirmation page pe wahan se Purchase
 * fire karte hain. (sessionStorage same-origin redirect round-trip me survive
 * karta hai.)
 */

const PENDING_KEY = 'ph_pending_purchase';
const LAST_ORDER_KEY = 'ph_last_order';

type AnyOrder = {
  _id?: string;
  orderId?: string;
  payAmt?: number | string;
  paymentType?: string;
  totalAmount?: { discountPrice?: number; shippingTotal?: number };
  items?: Array<{ productId?: string; quantity?: number; price?: number }>;
};

function fbqReady(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).fbq === 'function';
}

/** Checkout pe payment init se pehle call karo */
export function setPendingPurchase(order: AnyOrder): void {
  try {
    if (typeof window === 'undefined' || !order) return;

    const discount = Number(order.totalAmount?.discountPrice) || 0;
    const shipping = Number(order.totalAmount?.shippingTotal) || 0;
    const value = Math.round(discount + shipping); // poora order value (COD/online dono)

    const items = order.items || [];
    const payload = {
      value,
      currency: 'INR',
      orderId: order.orderId || order._id || '',
      content_ids: items.map((i) => i.productId).filter(Boolean),
      contents: items.map((i) => ({ id: i.productId, quantity: i.quantity || 1 })),
      num_items: items.reduce((s, i) => s + (Number(i.quantity) || 0), 0),
    };
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(payload));

    // Confirmation page pe dikhane ke liye order ka TRIMMED copy (custom_data/base64
    // hata ke — sessionStorage halka rahe). URL change nahi karna padta.
    const img = (i: any) =>
      typeof i?.product_image === 'string' ? i.product_image : i?.product_image?.url || '';
    const lastOrder = {
      orderId: order.orderId || order._id || '',
      paymentType: order.paymentType || '',
      payAmt: Number(order.payAmt) || 0,
      totalAmount: {
        discountPrice: discount,
        shippingTotal: shipping,
      },
      items: items.map((i: any) => ({
        name: i.name || '',
        image: img(i),
        quantity: Number(i.quantity) || 1,
        price: Number(i.price) || 0,
        discountType: i.discountType || '',
        discountPrice: Number(i.discountPrice) || 0,
      })),
      shipping: (order as any).shipping
        ? {
          userName: (order as any).shipping.userName || '',
          mobileNumber: (order as any).shipping.mobileNumber || '',
          addressLine: (order as any).shipping.addressLine || '',
          city: (order as any).shipping.city || '',
          state: (order as any).shipping.state || '',
          postCode: (order as any).shipping.postCode || '',
        }
        : null,
    };
    sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(lastOrder));
  } catch {
    /* ignore */
  }
}

/** Optional: checkout shuru hone par */
export function trackInitiateCheckout(order: AnyOrder): void {
  if (!fbqReady()) return;
  const discount = Number(order?.totalAmount?.discountPrice) || 0;
  const shipping = Number(order?.totalAmount?.shippingTotal) || 0;
  (window as any).fbq('track', 'InitiateCheckout', {
    value: Math.round(discount + shipping),
    currency: 'INR',
    num_items: (order?.items || []).reduce((s, i) => s + (Number(i.quantity) || 0), 0),
  });
}

/** Confirmation page ke liye stashed order padho (display only). */
export function getLastOrder(): any | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = sessionStorage.getItem(LAST_ORDER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearLastOrder(): void {
  try {
    if (typeof window !== 'undefined') sessionStorage.removeItem(LAST_ORDER_KEY);
  } catch {
    /* ignore */
  }
}

/** Confirmation page (success) pe call karo — pending purchase ko Purchase event me convert karta hai */
export function firePurchaseFromSession(): void {
  try {
    if (typeof window === 'undefined') return;
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return;

    if (!fbqReady()) return;

    const p = JSON.parse(raw);

    (window as any).fbq('track', 'Purchase', {
      value: p.value,
      currency: p.currency || 'INR',
      content_type: 'product',
      content_ids: p.content_ids || [],
      contents: p.contents || [],
      num_items: p.num_items || 0,
      order_id: p.orderId || '',
    });

    // Remove only after successful fire
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}