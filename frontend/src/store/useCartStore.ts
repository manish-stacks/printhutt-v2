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
        try { sessionStorage.setItem(key, value); } catch {}
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
      } catch {}
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
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
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

/* debounced full-sync to DB (sirf logged-in) */
let syncTimer: ReturnType<typeof setTimeout> | null = null;
const scheduleDbSync = (items: CartItem[]) => {
  if (!isUserLoggedIn()) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    const payload = items.map(toDbPayload);
    userCartService.sync(payload).catch((e) => console.error('DB cart sync failed', e));
  }, 600); // 600ms debounce — multiple rapid changes ek hi call me
};

/* ---------- store ---------- */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addToCart: (product, quantity) => {
        set((state) => {
          const existingItem = state.items.find((item) => item._id === product._id);
          let newItems: CartItem[];
          if (existingItem) {
            newItems = state.items.map((item) =>
              item._id === product._id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            );
          } else {
            add_product(product._id).catch(() => {});
            newItems = [...state.items, { ...product, quantity } as CartItem];
          }
          scheduleDbSync(newItems);
          return { items: newItems };
        });
      },

      removeFromCart: (productId) => {
        set((state) => {
          const newItems = state.items.filter((item) => item._id !== productId);
          scheduleDbSync(newItems);
          return { items: newItems };
        });
      },

      updateQuantity: (productId, quantity) => {
        set((state) => {
          const newItems = state.items.map((item) =>
            item._id === productId ? { ...item, quantity } : item
          );
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

      // DB se aaye items ko store me set (login merge ke baad)
      syncFromDb: (items) => set({ items }),

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