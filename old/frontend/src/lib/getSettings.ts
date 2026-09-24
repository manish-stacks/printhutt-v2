// Server-side (RSC) helper — settings DB se laao layout/metadata ke liye
// ✅ FIX: NEXT_PUBLIC_ env server-side RSC mein unreliable hota hai PM2 cluster mein
//         Internal URL directly use karo — no cross-process env dependency
const API_URL =
  process.env.INTERNAL_API_URL ||          // production: http://127.0.0.1:4000/api
  process.env.NEXT_PUBLIC_API_URL ||        // fallback dev
  'http://localhost:4000/api';

export interface SiteSettings {
  siteName?: string;
  defaultTitle?: string;
  defaultDescription?: string;
  defaultKeywords?: string;
  ogImage?: { url?: string };
  favicon?: { url?: string };
  logo?: { url?: string };
  themeColor?: string;
  googleAnalyticsId?: string;
  metaPixelId?: string;
  clarityId?: string;
  googleSiteVerification?: string;
  headScripts?: string;
  bodyScripts?: string;
  siteUrl?: string;
  [k: string]: unknown;
  bulkDeleteEnabled?: boolean;
}

// ✅ FIX: revalidate 60→300 (5 min) — settings baar baar nahi badalte
//         Cluster mode mein har worker apna fetch cache rakhta hai,
//         isliye Next.js fetch cache + revalidate dono kaam karte hain
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const res = await fetch(`${API_URL}/settings`, {
      next: { revalidate: 300 }, // ✅ 5 min cache — was 60s
    });
    if (!res.ok) return {};
    const json = await res.json();
    return (json?.settings as SiteSettings) || {};
  } catch {
    return {};
  }
}