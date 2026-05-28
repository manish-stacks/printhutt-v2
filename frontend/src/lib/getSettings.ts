// Server-side (RSC) helper — settings DB se laao layout/metadata ke liye
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

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
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const res = await fetch(`${API_URL}/settings`, {
      next: { revalidate: 60 }, // 1 min Next-side cache
    });
    if (!res.ok) return {};
    const json = await res.json();
    return (json?.settings as SiteSettings) || {};
  } catch {
    return {};
  }
}