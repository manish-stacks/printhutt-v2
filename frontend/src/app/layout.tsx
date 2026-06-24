import type { Metadata, Viewport } from "next";
import MainLayout from "@/layout/Main";
import { getSiteSettings } from "@/lib/getSettings";
import "./globals.css";
import '/public/style.css';
import '/public/acrylic.css';
import 'remixicon/fonts/remixicon.css';
import { ToastContainer } from 'react-toastify';

export async function generateViewport(): Promise<Viewport> {
  const s = await getSiteSettings();
  return {
    themeColor: s.themeColor || "#3d4750",
    width: 'device-width',
    initialScale: 1,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    title: s.defaultTitle || s.siteName || "PrintHutt",
    description: s.defaultDescription || "",
    keywords: s.defaultKeywords,
    icons: s.favicon?.url ? { icon: s.favicon.url } : undefined,
    openGraph: {
      title: s.defaultTitle || s.siteName,
      description: s.defaultDescription,
      images: s.ogImage?.url ? [s.ogImage.url] : undefined,
      siteName: s.siteName,
    },
    twitter: {
      card: 'summary_large_image',
      title: s.defaultTitle || s.siteName,
      description: s.defaultDescription,
      images: s.ogImage?.url ? [s.ogImage.url] : undefined,
    },
    verification: s.googleSiteVerification
      ? { google: s.googleSiteVerification }
      : undefined,
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const s = await getSiteSettings();

  return (
    <html lang="en">
      <head>
  
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&display=swap"
          rel="stylesheet"
        />

        {/* Cormorant Garamond preloaded via Google Fonts in <head> */}

        {/* Meta Pixel / Google Analytics / Clarity ab "Custom Scripts" (headScripts) se
            inject hote hain — admin settings me poora script paste karein. */}
        {s.headScripts && (
          <script dangerouslySetInnerHTML={{ __html: s.headScripts }} />
        )}
      </head>
      <body>
        <MainLayout>
          <ToastContainer position="top-center" />
          {children}
        </MainLayout>

        {s.bodyScripts && (
          <script dangerouslySetInnerHTML={{ __html: s.bodyScripts }} />
        )}
      </body>
    </html>
  );
}