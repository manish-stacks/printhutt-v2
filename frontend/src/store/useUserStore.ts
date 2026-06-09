'use client'

import { toast } from "react-toastify";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { axiosInstance, setAccessToken } from "@/utils/axios";
import { userCartService } from '@/_services/common/usercart';
import { useCartStore } from '@/store/useCartStore';

interface UserDetails {
    id: string;
    username: string;
    email: string;
}

interface MeResponse {
    success?: boolean;
    user?: {
        _id?: string;
        id?: string;
        username: string;
        email: string;
    };
}

interface UserState {
    isLoggedIn: boolean;
    userDetails: UserDetails | null;
    login: (user: UserDetails) => void;
    logout: () => void;
    getUserDetails: () => UserDetails | null;
    fetchUserDetails: () => Promise<void>;
}


// Login ke baad cart merge — ye function login success pe call karo
export async function syncCartOnLogin(): Promise<void> {
  try {
    const localItems = useCartStore.getState().items;

    // ✅ FIX 1: Gift items kabhi DB ko mat bhejo
    const persistableLocal = localItems.filter((item: any) => !item.isGift);

    if (persistableLocal.length > 0) {
      const payload = persistableLocal.map((item: any) => ({
        productId: item._id,
        variantId: item.selectedVariant?._id,
        size: item.selectedVariant?.size,
        color: item.selectedVariant?.color,
        quantity: item.quantity,
        price: item.price,
        custom_data: item.custom_data,
      }));
      await userCartService.merge(payload);
    }

    // DB se fresh cart fetch karo
    const res: any = await userCartService.get();
    const dbItems = res?.items ?? [];

    // ✅ FIX 2: DB items ko proper map karo with dedup by productId+variantId+size
    const seen = new Set<string>();
    const storeItems = dbItems.reduce((acc: any[], it: any) => {
      const p = it.productId;
      if (!p) return acc; // invalid entry skip

      const sv = it.variantId ? { _id: it.variantId, size: it.size, color: it.color, price: it.price } : null;
      // Unique key same as cartItemKey logic
      const key = `${p._id ?? p}::${it.variantId ?? ''}::${it.size ?? ''}`;

      if (seen.has(key)) {
        // Duplicate — find existing and merge quantity
        const existing = acc.find((a: any) => {
          const aKey = `${a._id}::${a.selectedVariant?._id ?? ''}::${a.selectedVariant?.size ?? ''}`;
          return aKey === key;
        });
        if (existing) existing.quantity += it.quantity;
        return acc;
      }
      seen.add(key);

      acc.push({
        ...p,
        quantity: it.quantity,
        price: it.price,
        ...(sv ? { selectedVariant: sv } : {}),
        ...(it.custom_data ? { custom_data: it.custom_data } : {}),
        _dbItemId: it._id,
      });
      return acc;
    }, []);

    // ✅ FIX 3: isGift flag wale items local mein reh sakte hain (re-evaluate honge)
    // Gift items DB se nahi aate, useFreeGiftGuard re-add kar dega if threshold met
    useCartStore.getState().syncFromDb(storeItems);
  } catch (e) {
    console.error('❌ Cart sync on login failed', e);
  }
}

export const useUserStore = create<UserState>()(
    persist(
        (set, get) => ({
            isLoggedIn: false,
            userDetails: null,
            login: (user) => {
                set({ isLoggedIn: true, userDetails: user });
            },
            logout: async () => {
                try {
                    await axiosInstance.get("/auth/logout");
                    setAccessToken(null);
                    set({ isLoggedIn: false, userDetails: null });
                } catch (error) {
                    toast.error("Error logging out");
                    console.error(error);
                }
            },
            fetchUserDetails: async () => {
                try {
                    // axiosInstance interceptor unwraps response.data,
                    // so this resolves to the body directly.
                    const data = await axiosInstance.post('/auth/me') as unknown as MeResponse;
                    // console.log("Fetched user details:", data); // DEBUG
                    if (data?.success && data?.user) {
                        set({
                            isLoggedIn: true,
                            userDetails: {
                                id: data.user.id ?? data.user._id ?? '',
                                username: data.user.username,
                                email: data.user.email,
                                number: data.user.number,
                                isVerified: data.user.isVerified,
                            },
                        });
                    } else {
                        set({ isLoggedIn: false, userDetails: null });
                    }
                } catch (error) {
                    toast.error('Failed to fetch user details')
                    console.error("Failed to fetch user details:", error);
                }
            },
            getUserDetails: () => {
                return get().userDetails;
            },
        }),
        {
            name: 'user-store',
        }
    )
)

// Soft logout on `auth:expired` (dispatched by axios interceptor when refresh fails)
if (typeof window !== 'undefined') {
    window.addEventListener('auth:expired', () => {
        useUserStore.getState().logout();
    });
}
