'use client'

import { toast } from "react-toastify";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { axiosInstance, setAccessToken } from "@/utils/axios";
import { userCartService } from '@/_services/common/usercart';
import { useCartStore, cartItemKey, hasInlineBase64 } from '@/store/useCartStore';

interface UserDetails {
    id: string;
    username: string;
    email: string;
    number?: string;
    isVerified?: boolean;
    name?: string;
}

interface MeResponse {
    success?: boolean;
    user?: {
        _id?: string;
        id?: string;
        username: string;
        email: string;
        number?: string;
        isVerified?: boolean;
    };
}

interface UserState {
    isLoggedIn: boolean;
    hasHydrated: boolean;
    userDetails: UserDetails | null;
    setHasHydrated: (v: boolean) => void;
    login: (user: UserDetails) => void;
    logout: () => void;
    getUserDetails: () => UserDetails | null;
    fetchUserDetails: (silent?: boolean) => Promise<void>;
}


// Login ke baad cart merge — single-flight (double call pe duplicate nahi banega)
let syncing: Promise<void> | null = null;

const toPayload = (item: any) => ({
  productId: item._id,
  variantId: item.selectedVariant?._id,
  size: item.selectedVariant?.size,
  color: item.selectedVariant?.color,
  quantity: item.quantity,
  price: item.price,
  discountType: item.discountType,
  discountPrice: item.discountPrice,
  custom_data: item.custom_data,
});

const dbToStore = (it: any) => {
  const p = it.productId;
  if (!p) return null;
  const productId = String(p?._id ?? p);
  const cd = it.custom_data;
  const customThumb = cd && typeof cd === 'object' && typeof cd._thumb === 'string' ? cd._thumb : null;
  const baseProduct = typeof p === 'object' ? p : { _id: productId };
  return {
    ...baseProduct,
    _id: productId,
    quantity: it.quantity,
    price: it.price,
    ...(it.discountType ? { discountType: it.discountType } : {}),
    ...(typeof it.discountPrice === 'number' ? { discountPrice: it.discountPrice } : {}),
    ...(it.variantId ? { selectedVariant: { _id: String(it.variantId), size: it.size, color: it.color, price: it.price } } : {}),
    ...(cd ? { custom_data: cd } : {}),
    ...(customThumb ? { thumbnail: { ...(baseProduct as any).thumbnail, url: customThumb } } : {}),
    _dbItemId: String(it._id),
  };
};

export function syncCartOnLogin(): Promise<void> {
  if (syncing) return syncing;
  syncing = (async () => {
    try {
      const local = useCartStore.getState().items.filter(
        (item: any) => !item.isGift && !hasInlineBase64(item)
      );
      const existingRes: any = await userCartService.get();
      const dbStoreItems = (existingRes?.items ?? []).map(dbToStore).filter(Boolean);
      const dbKeys = new Set(dbStoreItems.map((i: any) => cartItemKey(i)));

      // sirf wahi local items bhejo jo DB me already nahi (custom → _customId se match)
      const localOnly = local.filter((item: any) => !dbKeys.has(cartItemKey(item)));

      let finalItems = dbStoreItems;
      if (localOnly.length > 0) {
        await userCartService.merge(localOnly.map(toPayload));
        const res: any = await userCartService.get();
        finalItems = (res?.items ?? []).map(dbToStore).filter(Boolean);
      }
      useCartStore.getState().syncFromDb(finalItems as any);
    } catch (e) {
      console.error('Cart sync on login failed', e);
    } finally {
      syncing = null;
    }
  })();
  return syncing;
}

export const useUserStore = create<UserState>()(
    persist(
        (set, get) => ({
            isLoggedIn: false,
            hasHydrated: false,
            userDetails: null,
            setHasHydrated: (v) => set({ hasHydrated: v }),
            login: (user) => {
                set({ isLoggedIn: true, userDetails: user });
            },
            logout: async () => {
                // Network fail ho tab bhi local session clear — warna user "stuck logged-in" rehta tha
                try {
                    await axiosInstance.get("/auth/logout");
                } catch (error) {
                    console.warn("Logout request failed, clearing local session", error);
                } finally {
                    setAccessToken(null);
                    set({ isLoggedIn: false, userDetails: null });
                }
            },
            fetchUserDetails: async (silent = false) => {
                try {
                    // /auth/session kabhi 401 nahi deta: access valid → user,
                    // access expire → server-side refresh rotate, guest → {success:false}
                    const data = await axiosInstance.get('/auth/session') as unknown as MeResponse & { accessToken?: string };
                    if (data?.accessToken) setAccessToken(data.accessToken);
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
                        setAccessToken(null);
                        set({ isLoggedIn: false, userDetails: null });
                        if (!silent) toast.error('Session expired, please login again');
                    }
                } catch (error) {
                    // Network/server error pe existing session mat udao (offline flicker se logout nahi)
                    if (!silent) toast.error('Failed to fetch user details');
                    else console.warn('Session check failed:', (error as Error)?.message);
                }
            },
            getUserDetails: () => {
                return get().userDetails;
            },
        }),
        {
            name: 'user-store',
            onRehydrateStorage: () => (state) => {
                // localStorage se state load hone ke baad — flicker rokne ke liye
                state?.setHasHydrated(true);
            },
        }
    )
)

// Soft logout on `auth:expired` (dispatched by axios interceptor when refresh fails).
// ⚠️ Yahan /auth/logout network call NAHI karte — sirf local state clear.
// Network logout call khud 401/timeout de sakti thi jisse payment ke beech
// user logout ho jata tha (Bug #3). Ab sirf token + flag clear hota hai.
if (typeof window !== 'undefined') {
    window.addEventListener('auth:expired', () => {
        setAccessToken(null);
        useUserStore.setState({ isLoggedIn: false, userDetails: null });
        // Protected page pe the → login pe bhejo (redirect back ke saath)
        const path = window.location.pathname;
        if (path.startsWith('/user')) {
            window.location.href = `/login?redirect=${encodeURIComponent(path)}`;
        }
    });
}