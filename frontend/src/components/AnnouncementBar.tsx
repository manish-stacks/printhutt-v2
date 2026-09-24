'use client';
import Link from 'next/link';
import { useStoreSettings } from '@/store/useSettingsStore';

/** Admin → Settings → Storefront → "Announcement text" (khaali ho to kuch nahi dikhta) */
export default function AnnouncementBar() {
  const { announcementText, announcementLink } = useStoreSettings();
  if (!announcementText) return null;
  const body = <span className="font-medium">{announcementText}</span>;
  return (
    <div className="bg-gradient-to-r from-[#241B4F] via-[#3b2a7a] to-[#241B4F] text-white text-center text-xs sm:text-sm px-4 py-2">
      {announcementLink ? <Link href={announcementLink} className="hover:underline">{body} →</Link> : body}
    </div>
  );
}
