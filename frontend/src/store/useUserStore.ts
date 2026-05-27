'use client'

import { toast } from "react-toastify";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { axiosInstance, setAccessToken } from "@/utils/axios";

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
                    if (data?.success && data?.user) {
                        set({
                            isLoggedIn: true,
                            userDetails: {
                                id: data.user.id ?? data.user._id ?? '',
                                username: data.user.username,
                                email: data.user.email,
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
