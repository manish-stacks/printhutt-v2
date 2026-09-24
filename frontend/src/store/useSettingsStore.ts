import { useEffect } from 'react';
import { create } from 'zustand';
import { axiosInstance } from '@/utils/axios';
import { FREE_GIFT_ID, FREE_THRESHOLD } from '@/lib/constants/gift';

/** Admin → Settings se aane wali public storefront config (ek baar fetch, sab jagah use) */
export interface StoreSettings {
  giftEnabled: boolean;
  giftProductId: string;
  giftThreshold: number;
  giftTitle: string;
  giftImage?: string;
  announcementText?: string;
  announcementLink?: string;
  showVisitorCounter: boolean;
  showDealCountdown: boolean;
  dealCountdownMinutes: number;
  codEnabled: boolean;
  whatsappNumber?: string;
  [k: string]: any;
}

const bool = (v: unknown, d: boolean) => (v === undefined || v === null || v === '' ? d : v === true || v === 'true');
const num = (v: unknown, d: number) => (Number.isFinite(Number(v)) && v !== '' && v !== null ? Number(v) : d);

export function normalizeSettings(raw: Record<string, any> = {}): StoreSettings {
  return {
    ...raw,
    // fallback = purana live behaviour (deploy pe kuch na toote); admin se sab badla ja sakta hai
    giftEnabled: bool(raw.giftEnabled, true),
    giftProductId: String(raw.giftProductId || FREE_GIFT_ID),
    giftThreshold: num(raw.giftThreshold, FREE_THRESHOLD),
    giftTitle: String(raw.giftTitle || 'Free Acrylic Photo Keychain With NFC Tag'),
    giftImage: raw.giftImage?.url || undefined,
    announcementText: raw.announcementText || '',
    announcementLink: raw.announcementLink || '',
    showVisitorCounter: bool(raw.showVisitorCounter, true),
    showDealCountdown: bool(raw.showDealCountdown, true),
    dealCountdownMinutes: num(raw.dealCountdownMinutes, 59),
    codEnabled: bool(raw.codEnabled, true),
    whatsappNumber: raw.whatsappNumber || '',
  };
}

interface State {
  settings: StoreSettings;
  loaded: boolean;
  load: () => Promise<void>;
}

let inflight: Promise<void> | null = null;

export const useSettingsStore = create<State>((set, get) => ({
  settings: normalizeSettings(),
  loaded: false,
  load: () => {
    if (get().loaded) return Promise.resolve();
    if (inflight) return inflight;
    inflight = axiosInstance
      .get('/settings')
      .then((res: any) => set({ settings: normalizeSettings(res?.settings || res || {}), loaded: true }))
      .catch(() => set({ loaded: true }))
      .finally(() => { inflight = null; });
    return inflight;
  },
}));

/** Component me: const s = useStoreSettings(); */
export function useStoreSettings(): StoreSettings {
  const s = useSettingsStore((x) => x.settings);
  useEffect(() => { useSettingsStore.getState().load(); }, []);
  return s;
}
