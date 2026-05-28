import type { Metadata } from "next";
import MainLayout from "@/layout/Main";
import { getSiteSettings } from "@/lib/getSettings";
import "./globals.css";
import '/public/style.css';
import '/public/acrylic.css';
import 'animate.css';
import "aos/dist/aos.css";
import 'remixicon/fonts/remixicon.css';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import Script from "next/script";

// Dynamic metadata — DB se aata hai
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    title: s.defaultTitle || s.siteName || "PrintHutt",
    description: s.defaultDescription || "",
    keywords: s.defaultKeywords,
    themeColor: s.themeColor || "#3d4750",
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
        {/* Meta Pixel */}
        {s.metaPixelId && (
          <Script
            id="fb-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${s.metaPixelId}');
                fbq('track', 'PageView');
              `,
            }}
          />
        )}

        {/* Microsoft Clarity */}
        {s.clarityId && (
          <Script id="ms-clarity" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${s.clarityId}");
            `}
          </Script>
        )}

        {/* Google Analytics */}
        {s.googleAnalyticsId && (
          <>
            <Script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${s.googleAnalyticsId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${s.googleAnalyticsId}');
              `}
            </Script>
          </>
        )}

        {/* Custom free-form head scripts (admin-controlled — XSS risk) */}
        {s.headScripts && (
          <div dangerouslySetInnerHTML={{ __html: s.headScripts }} />
        )}
      </head>
      <body>
        <MainLayout>
          <ToastContainer position="top-center" />
          {children}
        </MainLayout>

        {/* Custom free-form body scripts */}
        {s.bodyScripts && (
          <div dangerouslySetInnerHTML={{ __html: s.bodyScripts }} />
        )}
      </body>
    </html>
  );
}