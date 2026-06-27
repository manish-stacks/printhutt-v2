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
    hasHydrated: boolean;
    userDetails: UserDetails | null;
    setHasHydrated: (v: boolean) => void;
    login: (user: UserDetails) => void;
    logout: () => void;
    getUserDetails: () => UserDetails | null;
    fetchUserDetails: () => Promise<void>;
}


// Login ke baad cart merge — ye function login success pe call karo
export async function syncCartOnLogin(): Promise<void> {
  try {
    const localItems = useCartStore.getState().items;
    const persistableLocal = localItems.filter((item: any) => !item.isGift);

    // Step 1: Pehle DB ka current cart fetch karo
    const existingRes: any = await userCartService.get();
    const existingDbItems: any[] = existingRes?.items ?? [];

    // DB mein already kya hai uska set banao (productId string se)
    const dbProductIds = new Set(
      existingDbItems.map((it: any) => {
        const p = it.productId;
        return `${p?._id ?? p}::${it.variantId ?? ''}::${it.size ?? ''}`;
      })
    );

    // Step 2: Sirf wo local items merge karo jo DB mein nahi hain already
    const newLocalOnly = persistableLocal.filter((item: any) => {
      const key = `${item._id}::${item.selectedVariant?._id ?? ''}::${item.selectedVariant?.size ?? ''}`;
      return !dbProductIds.has(key);
    });

    if (newLocalOnly.length > 0) {
      const payload = newLocalOnly.map((item: any) => ({
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

    // Step 3: Fresh cart fetch karo (merge ke baad)
    const res: any = newLocalOnly.length > 0
      ? await userCartService.get()
      : existingRes;
    const dbItems: any[] = res?.items ?? [];

    // Step 4: DB items → store format mein convert karo + dedup
    const seen = new Set<string>();
    const storeItems = dbItems.reduce((acc: any[], it: any) => {
      const p = it.productId;
      if (!p) return acc;

      // ✅ FIX: String convert karo — ObjectId aur string dono handle
      const productId = String(p?._id ?? p);
      const variantId = String(it.variantId ?? '');
      const size = String(it.size ?? '');
      const key = `${productId}::${variantId}::${size}`;

      if (seen.has(key)) {
        // Duplicate — quantity merge karo
        const existing = acc.find((a: any) => {
          const aKey = `${String(a._id)}::${String(a.selectedVariant?._id ?? '')}::${String(a.selectedVariant?.size ?? '')}`;
          return aKey === key;
        });
        if (existing) existing.quantity = Math.max(existing.quantity, it.quantity);
        return acc;
      }
      seen.add(key);

      const sv = it.variantId
        ? { _id: variantId, size: it.size, color: it.color, price: it.price }
        : null;

      acc.push({
        ...(typeof p === 'object' ? p : { _id: productId }),
        _id: productId,
        quantity: it.quantity,
        price: it.price,
        ...(sv ? { selectedVariant: sv } : {}),
        ...(it.custom_data ? { custom_data: it.custom_data } : {}),
        _dbItemId: String(it._id),
      });
      return acc;
    }, []);

    useCartStore.getState().syncFromDb(storeItems);
  } catch (e) {
    console.error('❌ Cart sync on login failed', e);
  }
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
    });
}