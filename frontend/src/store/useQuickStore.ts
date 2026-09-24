import { create } from 'zustand';

import type { Product } from '@/lib/types/product';

type QuickViewState = {
    isOpen: boolean;
    product: Product | null;
    openQuickView: (product: Product) => void;
    closeQuickView: () => void;
};

const useQuickStore = create<QuickViewState>((set) => ({
    isOpen: false,
    product: null,
    openQuickView: (product) => set({ isOpen: true, product }),
    closeQuickView: () => set({ isOpen: false, product: null }),
}));


export default useQuickStore;
