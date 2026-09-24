'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { RiMenu2Line, RiSearch2Line, RiExternalLinkLine, RiArrowRightSLine } from 'react-icons/ri';
import { UserMenu } from './UserMenu';
import { mainMenuItems } from '../sidebar/menuItems';

interface HeaderProps {
  isSidebarCollapsed: boolean;
  onMenuClick: () => void;
}

/* Sab menu links flat — quick-jump search ke liye */
const ALL_LINKS: { label: string; group?: string; path: string }[] = mainMenuItems.flatMap((m: any) =>
  m.submenu ? m.submenu.map((s: any) => ({ label: s.label, group: m.label, path: s.path })) : [{ label: m.label, path: m.path }]
);

const titleize = (s: string) => s.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const Header = ({ isSidebarCollapsed, onMenuClick }: HeaderProps) => {
  const pathname = usePathname() || '';
  const router = useRouter();
  const [q, setQ] = useState('');
  const [focus, setFocus] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const crumbs = pathname.split('/').filter(Boolean).slice(1).filter((p) => !/^[a-f\d]{24}$/i.test(p));
  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return ALL_LINKS.filter((l) => `${l.group || ''} ${l.label}`.toLowerCase().includes(t)).slice(0, 8);
  }, [q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        boxRef.current?.querySelector('input')?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const go = (path: string) => { setQ(''); setFocus(false); router.push(path); };

  return (
    <header className={`fixed right-0 top-0 z-30 h-16 flex items-center gap-3 border-b border-[#e8eaf0] bg-white/90 backdrop-blur-md px-3 sm:px-5 transition-all duration-300 left-0 ${isSidebarCollapsed ? 'lg:left-[76px]' : 'lg:left-64'}`}>
      <button onClick={onMenuClick} className="lg:hidden p-2 -ml-1 rounded-xl hover:bg-gray-100 text-gray-700" aria-label="Open menu">
        <RiMenu2Line size={22} />
      </button>

      {/* Breadcrumb */}
      <nav className="hidden md:flex items-center gap-1 text-[13px] text-gray-500 min-w-0">
        <Link href="/admin/dashboard" className="hover:text-gray-900">Admin</Link>
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            <RiArrowRightSLine className="shrink-0" />
            <span className={`truncate ${i === crumbs.length - 1 ? 'text-gray-900 font-semibold' : ''}`}>{titleize(c)}</span>
          </React.Fragment>
        ))}
      </nav>

      {/* Quick jump */}
      <div ref={boxRef} className="relative flex-1 max-w-md ml-auto">
        <RiSearch2Line className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setTimeout(() => setFocus(false), 150)}
          onKeyDown={(e) => { if (e.key === 'Enter' && results[0]) go(results[0].path); }}
          placeholder="Jump to… (Ctrl K)"
          className="w-full h-10 pl-9 pr-3 rounded-xl border border-[#e8eaf0] bg-[#f5f6fa] text-[14px] text-gray-800 placeholder:text-gray-400 outline-none focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
        />
        {focus && results.length > 0 && (
          <div className="absolute left-0 right-0 top-12 bg-white rounded-xl border border-[#e8eaf0] shadow-xl py-1.5 z-50">
            {results.map((r) => (
              <button key={r.path} onMouseDown={() => go(r.path)} className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-indigo-50">
                <span className="text-[14px] text-gray-800">{r.label}</span>
                {r.group && <span className="text-[11px] text-gray-400">{r.group}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <a href="/" target="_blank" rel="noreferrer" className="hidden sm:inline-flex items-center gap-1.5 h-10 px-3 rounded-xl border border-[#e8eaf0] text-[13px] font-medium text-gray-700 hover:bg-gray-50">
        <RiExternalLinkLine size={16} /> View store
      </a>
      <UserMenu />
    </header>
  );
};

export default Header;
