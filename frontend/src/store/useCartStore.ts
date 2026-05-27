import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { Product } from '@/lib/types/product';
import { axiosInstance } from '@/utils/axios';


const add_product = async (product_id: string) => {
  try {
    if (!product_id) {
      throw new Error("Product ID is required");
    }
     await axiosInstance.post(`/cart`, {
      product_id,
    });
    // console.log(response);
  } catch (error) {
    return error;
  }
};


const createChunkedStorage = (): StateStorage => {
  const MAX_CHUNK_SIZE = 1024 * 1024;
  const MAX_STORAGE = 5 * 1024 * 1024;

  return {
    getItem: (key) => {
      if (typeof window === "undefined") {
        return null;
      }

      try {

        const info = localStorage.getItem(`${key}:info`);
        if (!info) {
          const item = localStorage.getItem(key);
          return item;
        }


        const { chunks } = JSON.parse(info);
        let result = '';

        for (let i = 0; i < chunks; i++) {
          const chunk = localStorage.getItem(`${key}:${i}`);
          if (chunk === null) {
            console.error(`Missing chunk ${i} for ${key}`);
            return null;
          }
          result += chunk;
        }

        return result;
      } catch (error) {
        console.error('Error retrieving chunked item from localStorage:', error);
        return null;
      }
    },

    setItem: (key, value) => {
      try {
        if (value.length > MAX_CHUNK_SIZE) {
          const existingInfo = localStorage.getItem(`${key}:info`);
          if (existingInfo) {
            const { chunks } = JSON.parse(existingInfo);
            for (let i = 0; i < chunks; i++) {
              localStorage.removeItem(`${key}:${i}`);
            }
          }

          const chunkCount = Math.ceil(value.length / MAX_CHUNK_SIZE);
          const totalSize = value.length + (key.length + 12) * chunkCount;

          if (totalSize > MAX_STORAGE) {
            throw new Error('Storage quota would be exceeded');
          }
          for (let i = 0; i < chunkCount; i++) {
            const start = i * MAX_CHUNK_SIZE;
            const end = Math.min(start + MAX_CHUNK_SIZE, value.length);
            const chunk = value.substring(start, end);
            localStorage.setItem(`${key}:${i}`, chunk);
          }

          localStorage.setItem(`${key}:info`, JSON.stringify({
            chunks: chunkCount,
            originalSize: value.length,
            timestamp: new Date().toISOString()
          }));

          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, value);

          const existingInfo = localStorage.getItem(`${key}:info`);
          if (existingInfo) {
            const { chunks } = JSON.parse(existingInfo);
            for (let i = 0; i < chunks; i++) {
              localStorage.removeItem(`${key}:${i}`);
            }
            localStorage.removeItem(`${key}:info`);
          }
        }
      } catch (error) {
        console.error('Error storing chunked item in localStorage:', error);

        try {
          sessionStorage.setItem(key, value);
        } catch (sessionError) {
          console.error('Error storing in sessionStorage as fallback:', sessionError);

        }
      }
    },

    removeItem: (key) => {
      try {

        const info = localStorage.getItem(`${key}:info`);

        if (info) {

          const { chunks } = JSON.parse(info);
          for (let i = 0; i < chunks; i++) {
            localStorage.removeItem(`${key}:${i}`);
          }
          localStorage.removeItem(`${key}:info`);
        }

        localStorage.removeItem(key);
      } catch (error) {
        console.error('Error removing item from localStorage:', error);
      }
    }
  };
};

// Cart item type
interface CartItem extends Product {
  quantity: number;
}

// Cart store state
interface CartState {
  items: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;

  //  ADD THIS
  updateItem: (productId: string, data: Partial<CartItem>) => void;

  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => {
    discountPrice: number;
    totalPrice: number;
    shippingTotal: number;
  };
}


// Create the cart store
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addToCart: (product, quantity) => {
        set((state) => {
          const existingItem = state.items.find(item => item._id === product._id);

          if (existingItem) {
            // Update existing item
            return {
              items: state.items.map(item =>
                item._id === product._id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          } else {
            add_product(product._id).catch((err) =>
              console.error("Failed to add product:", err)
            );
            // Add new item
            return {
              items: [...state.items, { ...product, quantity }],
            };
          }
        });
      },

      removeFromCart: (productId) => {
        set((state) => ({
          items: state.items.filter(item => item._id !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        set((state) => ({
          items: state.items.map(item =>
            item._id === productId
              ? { ...item, quantity }
              : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      getTotalPrice: () => {
        const items = get().items;
        const totalPrice = items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
        const discountPrice = items.reduce((total, item) => {
          if (item.discountType === "percentage") {
            return (
              total +
              (item.price - (item.price * item.discountPrice) / 100) *
              item.quantity
            );
          } else {
            return total + (item.price - item.discountPrice) * item.quantity;
          }
        }, 0);

        const shippingTotal = items.reduce((total, item) => total + (item?.shippingFee || 0), 0);
        return {
          totalPrice,
          discountPrice,
          shippingTotal,
        };
      },
      updateItem: (productId, data) => {
        set((state) => ({
          items: state.items.map((item) =>
            item._id === productId
              ? { ...item, ...data }
              : item
          ),
        }));
      },
      // getTotalPrice: () => {
      //   return get().items.reduce((total, item) => {
      //     const price = item.discountType === 'percentage'
      //       ? item.price - (item.price * (item.discountPrice ?? 0)) / 100
      //       : item.price - (item.discountPrice ?? 0);

      //     return total + (price * item.quantity);
      //   }, 0);
      // },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => createChunkedStorage()),
    }
  )
);
