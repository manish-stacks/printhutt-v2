'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { RiArrowDownSLine, RiCloseLine, RiContractLeftLine, RiContractRightLine } from 'react-icons/ri';
import { mainMenuItems } from './menuItems';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCollapsedChange: (collapsed: boolean) => void;
}

type Sub = { id: string; label: string; path: string };

/* path me query ho (orders?status=pending) to wo bhi match karo */
const useCurrentUrl = () => {
  const pathname = usePathname() || '';
  const [search, setSearch] = useState('');
  useEffect(() => { setSearch(window.location.search); }, [pathname]);
  return { pathname, full: pathname + search };
};

const isActivePath = (target: string, pathname: string, full: string) => {
  if (target.includes('?')) return full === target;
  return pathname === target || (target !== '/admin/dashboard' && pathname.startsWith(target + '/'));
};

export function Sidebar({ isOpen, onClose, onCollapsedChange }: SidebarProps) {
  const { pathname, full } = useCurrentUrl();
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  // Active submenu auto-expand
  useEffect(() => {
    const next: Record<string, boolean> = {};
    mainMenuItems.forEach((m: any) => {
      if (m.submenu?.some((s: Sub) => isActivePath(s.path.split('?')[0], pathname, full))) next[m.id] = true;
    });
    setOpen((o) => ({ ...o, ...next }));
    onClose(); // mobile: navigate hote hi drawer band
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleCollapse = () => {
    setCollapsed((c) => { onCollapsedChange(!c); return !c; });
  };

  const itemBase = 'group relative flex items-center gap-3 rounded-xl text-[14px] font-medium transition-colors';

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-[#0b0820]/60 backdrop-blur-[2px] transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <aside
        className={`fixed left-0 top-0 z-50 h-screen flex flex-col bg-[#1b1537] text-white transition-all duration-300
          ${collapsed ? 'lg:w-[76px]' : 'lg:w-64'} w-[270px]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Brand */}
        <div className="h-16 shrink-0 flex items-center justify-between px-4 border-b border-white/10">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 shrink-0 rounded-xl bg-white flex items-center justify-center overflow-hidden">
              <Image src="/print-hutt-logo.webp" alt="PrintHutt" width={36} height={36} className="object-contain p-0.5" />
            </span>
            {!collapsed && (
              <span className="leading-tight">
                <span className="block text-[15px] font-bold tracking-tight">PrintHutt</span>
                <span className="block text-[11px] text-white/45">Admin Console</span>
              </span>
            )}
          </Link>
          <button onClick={onClose} className="lg:hidden p-2 rounded-lg hover:bg-white/10" aria-label="Close menu"><RiCloseLine size={20} /></button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,.15)_transparent]">
          {mainMenuItems.map((item: any) => {
            const Icon = item.icon;
            if (!item.submenu) {
              const active = isActivePath(item.path, pathname, full);
              return (
                <Link key={item.id} href={item.path} title={collapsed ? item.label : undefined}
                  className={`${itemBase} px-3 h-11 ${active ? 'bg-white/[0.08] text-white' : 'text-white/65 hover:bg-white/[0.05] hover:text-white'} ${collapsed ? 'lg:justify-center' : ''}`}>
                  {active && <span className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r bg-amber-400" />}
                  <Icon size={18} className={active ? 'text-amber-400' : ''} />
                  <span className={collapsed ? 'lg:hidden' : ''}>{item.label}</span>
                </Link>
              );
            }
            const groupActive = item.submenu.some((s: Sub) => isActivePath(s.path, pathname, full) || isActivePath(s.path.split('?')[0], pathname, full));
            const expanded = !!open[item.id] && !collapsed;
            return (
              <div key={item.id}>
                <button type="button" title={collapsed ? item.label : undefined}
                  onClick={() => (collapsed ? toggleCollapse() : setOpen((o) => ({ ...o, [item.id]: !o[item.id] })))}
                  className={`${itemBase} w-full px-3 h-11 ${groupActive ? 'text-white' : 'text-white/65 hover:bg-white/[0.05] hover:text-white'} ${collapsed ? 'lg:justify-center' : ''}`}>
                  <Icon size={18} className={groupActive ? 'text-amber-400' : ''} />
                  <span className={`flex-1 text-left ${collapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
                  <RiArrowDownSLine size={18} className={`transition-transform ${expanded ? 'rotate-180' : ''} ${collapsed ? 'lg:hidden' : ''}`} />
                </button>
                {expanded && (
                  <div className="ml-[21px] pl-3 border-l border-white/10 my-1 space-y-0.5">
                    {item.submenu.map((s: Sub) => {
                      const active = isActivePath(s.path, pathname, full);
                      return (
                        <Link key={s.id} href={s.path}
                          className={`block px-3 py-2 rounded-lg text-[13.5px] transition-colors ${active ? 'bg-amber-400 text-[#1b1537] font-semibold' : 'text-white/60 hover:text-white hover:bg-white/[0.05]'}`}>
                          {s.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Collapse */}
        <div className="hidden lg:block shrink-0 p-3 border-t border-white/10">
          <button onClick={toggleCollapse} className={`w-full h-10 flex items-center gap-2 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.05] text-sm ${collapsed ? 'justify-center' : 'px-3'}`}>
            {collapsed ? <RiContractRightLine size={18} /> : <><RiContractLeftLine size={18} /> Collapse</>}
          </button>
        </div>
      </aside>
    </>
  );
}
