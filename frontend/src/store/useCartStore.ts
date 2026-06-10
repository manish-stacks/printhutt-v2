import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { Product } from '@/lib/types/product';
import { axiosInstance } from '@/utils/axios';
import { userCartService, type DbCartItemPayload } from '@/_services/common/usercart';
import { useUserStore } from '@/store/useUserStore';

/* analytics ping (guest + login dono) */
const add_product = async (product_id: string) => {
  try {
    if (!product_id) throw new Error('Product ID is required');
    await axiosInstance.post(`/cart`, { product_id });
  } catch (error) {
    return error;
  }
};

/* ---------- chunked storage (UNCHANGED from your code) ---------- */
const createChunkedStorage = (): StateStorage => {
  const MAX_CHUNK_SIZE = 1024 * 1024;
  const MAX_STORAGE = 5 * 1024 * 1024;
  return {
    getItem: (key) => {
      if (typeof window === 'undefined') return null;
      try {
        const info = localStorage.getItem(`${key}:info`);
        if (!info) return localStorage.getItem(key);
        const { chunks } = JSON.parse(info);
        let result = '';
        for (let i = 0; i < chunks; i++) {
          const chunk = localStorage.getItem(`${key}:${i}`);
          if (chunk === null) return null;
          result += chunk;
        }
        return result;
      } catch { return null; }
    },
    setItem: (key, value) => {
      try {
        if (value.length > MAX_CHUNK_SIZE) {
          const existingInfo = localStorage.getItem(`${key}:info`);
          if (existingInfo) {
            const { chunks } = JSON.parse(existingInfo);
            for (let i = 0; i < chunks; i++) localStorage.removeItem(`${key}:${i}`);
          }
          const chunkCount = Math.ceil(value.length / MAX_CHUNK_SIZE);
          const totalSize = value.length + (key.length + 12) * chunkCount;
          if (totalSize > MAX_STORAGE) throw new Error('Storage quota would be exceeded');
          for (let i = 0; i < chunkCount; i++) {
            const start = i * MAX_CHUNK_SIZE;
            const end = Math.min(start + MAX_CHUNK_SIZE, value.length);
            localStorage.setItem(`${key}:${i}`, value.substring(start, end));
          }
          localStorage.setItem(`${key}:info`, JSON.stringify({
            chunks: chunkCount, originalSize: value.length, timestamp: new Date().toISOString(),
          }));
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, value);
          const existingInfo = localStorage.getItem(`${key}:info`);
          if (existingInfo) {
            const { chunks } = JSON.parse(existingInfo);
            for (let i = 0; i < chunks; i++) localStorage.removeItem(`${key}:${i}`);
            localStorage.removeItem(`${key}:info`);
          }
        }
      } catch {
        try { sessionStorage.setItem(key, value); } catch { }
      }
    },
    removeItem: (key) => {
      try {
        const info = localStorage.getItem(`${key}:info`);
        if (info) {
          const { chunks } = JSON.parse(info);
          for (let i = 0; i < chunks; i++) localStorage.removeItem(`${key}:${i}`);
          localStorage.removeItem(`${key}:info`);
        }
        localStorage.removeItem(key);
      } catch { }
    },
  };
};

/* ---------- types ---------- */
interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string, itemIndex?: number) => void;
  updateQuantity: (productId: string, quantity: number, itemIndex?: number) => void;
  updateItem: (productId: string, data: Partial<CartItem>) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => { discountPrice: number; totalPrice: number; shippingTotal: number };
  syncFromDb: (items: CartItem[]) => void;
}

/* ---------- helpers ---------- */
const isUserLoggedIn = (): boolean => {
  try { return useUserStore.getState().isLoggedIn; } catch { return false; }
};

const toDbPayload = (item: CartItem): DbCartItemPayload => {
  const sv = (item as any).selectedVariant;
  return {
    productId: item._id,
    variantId: sv?._id,
    size: sv?.size,
    color: sv?.color,
    quantity: item.quantity,
    price: item.price,
    custom_data: (item as any).custom_data,
  };
};

/**
 * Unique key for a cart item — product + variant + size combo.
 * Custom items (isGift=false, has custom_data) are always unique per entry.
 */
const cartItemKey = (item: { _id: string; selectedVariant?: { _id?: string; size?: string }; custom_data?: unknown; isGift?: boolean }): string => {
  const sv = item.selectedVariant;
  return `${item._id}::${sv?._id ?? ''}::${sv?.size ?? ''}`;
};

const isSameCartItem = (
  a: CartItem,
  b: { _id: string; selectedVariant?: { _id?: string; size?: string }; custom_data?: unknown }
): boolean => {
  // Custom-data items are always separate entries
  if ((a as any).custom_data && Object.keys((a as any).custom_data).length > 0) return false;
  if ((b as any).custom_data && Object.keys((b as any).custom_data).length > 0) return false;
  return cartItemKey(a as any) === cartItemKey(b as any);
};

/* debounced full-sync to DB (sirf logged-in) */
let syncTimer: ReturnType<typeof setTimeout> | null = null;
const scheduleDbSync = (items: CartItem[]) => {
  if (!isUserLoggedIn()) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    const persistableItems = items.filter((item) => !(item as any).isGift);

    const payload = persistableItems.map(toDbPayload);
    userCartService.sync(payload).catch((e) => console.error('DB cart sync failed', e));
  }, 600);
};

/* ---------- store ---------- */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addToCart: (product, quantity) => {
        set((state) => {
          // ✅ FIX: variant-aware duplicate check
          const existingItem = state.items.find((item) => isSameCartItem(item, product as any));
          let newItems: CartItem[];
          if (existingItem) {
            newItems = state.items.map((item) =>
              isSameCartItem(item, product as any)
                ? { ...item, quantity: item.quantity + quantity }
                : item
            );
          } else {
            if (!(product as any).isGift) {
              add_product(product._id).catch(() => { });
            }
            newItems = [...state.items, { ...product, quantity } as CartItem];
          }
          scheduleDbSync(newItems);
          return { items: newItems };
        });
      },

      removeFromCart: (productId, itemIndex) => {
        set((state) => {
          let newItems: CartItem[];
          if (itemIndex !== undefined) {
            // ✅ FIX: Index-based remove — same _id wale items mein exact entry remove karo
            newItems = state.items.filter((_, idx) => idx !== itemIndex);
          } else {
            // Fallback: pehli matching entry remove karo
            const firstMatchIdx = state.items.findIndex((item) => item._id === productId);
            newItems = firstMatchIdx >= 0
              ? state.items.filter((_, idx) => idx !== firstMatchIdx)
              : state.items;
          }
          scheduleDbSync(newItems);
          return { items: newItems };
        });
      },

      updateQuantity: (productId, quantity, itemIndex) => {
        set((state) => {
          let newItems: CartItem[];
          if (itemIndex !== undefined) {
            // ✅ FIX: Index-based update — exact entry update karo
            newItems = state.items.map((item, idx) =>
              idx === itemIndex ? { ...item, quantity } : item
            );
          } else {
            // Fallback: pehli matching entry update karo
            let found = false;
            newItems = state.items.map((item) => {
              if (!found && item._id === productId) {
                found = true;
                return { ...item, quantity };
              }
              return item;
            });
          }
          scheduleDbSync(newItems);
          return { items: newItems };
        });
      },

      updateItem: (productId, data) => {
        set((state) => {
          const newItems = state.items.map((item) =>
            item._id === productId ? { ...item, ...data } : item
          );
          scheduleDbSync(newItems);
          return { items: newItems };
        });
      },

      clearCart: () => {
        if (isUserLoggedIn()) {
          userCartService.sync([]).catch((e) => console.error('DB cart clear failed', e));
        }
        set({ items: [] });
      },

      // DB se aaye items ko store me set — dedup karo same _id+variant combo
      syncFromDb: (items) => {
        const seen = new Set<string>();
        const deduped = items.reduce((acc: CartItem[], item) => {
          // Custom data items kabhi dedup mat karo (har ek unique hai)
          if ((item as any).custom_data && Object.keys((item as any).custom_data).length > 0) {
            acc.push(item);
            return acc;
          }
          // Gift items bhi skip
          if ((item as any).isGift) {
            acc.push(item);
            return acc;
          }
          const key = cartItemKey(item as any);
          if (seen.has(key)) {
            // Duplicate mila — existing ki quantity mein add karo
            const existing = acc.find((a) => cartItemKey(a as any) === key);
            if (existing) existing.quantity += item.quantity;
            return acc;
          }
          seen.add(key);
          acc.push(item);
          return acc;
        }, []);
        set({ items: deduped });
      },

      getTotalItems: () => get().items.reduce((t, i) => t + i.quantity, 0),

      getTotalPrice: () => {
        const items = get().items;
        const totalPrice = items.reduce((t, i) => t + i.price * i.quantity, 0);
        const discountPrice = items.reduce((t, i) => {
          if (i.discountType === 'percentage') {
            return t + (i.price - (i.price * i.discountPrice) / 100) * i.quantity;
          }
          return t + (i.price - i.discountPrice) * i.quantity;
        }, 0);
        const shippingTotal = items.reduce((t, i) => t + (i?.shippingFee || 0), 0);
        return { totalPrice, discountPrice, shippingTotal };
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => createChunkedStorage()),
    }
  )
);