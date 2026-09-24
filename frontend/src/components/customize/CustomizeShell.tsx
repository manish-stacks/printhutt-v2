import Link from 'next/link';
import { RiTruckLine, RiShieldCheckLine, RiMagicLine, RiCustomerService2Line, RiUploadCloud2Line, RiPaletteLine, RiShoppingBag3Line, RiArrowRightSLine, RiStarFill } from 'react-icons/ri';

const CMYK = ['#00AEEF', '#EC008C', '#FFF200', '#fbbf24'];

const TRUST = [
  { icon: RiTruckLine, title: 'Fast Delivery', sub: 'Pan-India shipping' },
  { icon: RiShieldCheckLine, title: '100% Secure', sub: 'UPI / Card / COD' },
  { icon: RiMagicLine, title: 'Premium Print', sub: 'HD, fade-resistant' },
  { icon: RiCustomerService2Line, title: 'Design Support', sub: 'WhatsApp help' },
];

const STEPS = [
  { icon: RiUploadCloud2Line, title: 'Upload', sub: 'Add Photo / Name' },
  { icon: RiPaletteLine, title: 'Personalise', sub: 'Choose Size & style' },
  { icon: RiShoppingBag3Line, title: 'Checkout', sub: 'Live preview' },
];

/** Sabhi customize pages ka common themed frame (layout.tsx se lagta hai) */
export default function CustomizeShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="ph-customize bg-[#15112e]">
      {/* ── Top band ── */}
      <div className="relative bg-[#241B4F] text-white overflow-hidden">
        <div className="absolute inset-x-0 top-0 flex h-1">{CMYK.map((c) => <span key={c} className="flex-1" style={{ background: c }} />)}</div>
        <div className="pointer-events-none absolute -right-20 -top-24 w-72 h-72 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-4 pt-4 pb-3 flex items-center justify-between gap-3 text-xs sm:text-sm">
          <nav className="flex items-center gap-1 text-white/60 min-w-0">
            <Link href="/" className="hover:text-white shrink-0">Home</Link>
            <RiArrowRightSLine className="shrink-0" />
            <span className="text-white font-medium truncate">Personalise your gift</span>
          </nav>
          <div className="flex items-center gap-0.5 shrink-0">
            {[0, 1, 2, 3, 4].map((i) => <RiStarFill key={i} className="text-amber-400" size={13} />)}
            <span className="ml-1.5 text-white/70 hidden sm:inline">50,000+ happy customers</span>
          </div>
        </div>

        {/* Stepper */}
        <div className="relative max-w-6xl mx-auto px-4 pb-4">
          <ol className="grid grid-cols-3 gap-2 sm:gap-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex items-center gap-2 sm:gap-3 min-w-0 rounded-2xl bg-white/[0.06] border border-white/10 px-2.5 py-2 sm:px-4 sm:py-3">
                <span className="relative w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-amber-400 text-[#241B4F] flex items-center justify-center">
                  <s.icon size={17} />
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white text-[#241B4F] text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                </span>
                <div className="min-w-0">
                  <p className="text-[12px] sm:text-sm font-semibold leading-tight truncate">{s.title}</p>
                  <p className="text-[11px] text-white/50 leading-tight truncate hidden sm:block">{s.sub}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="ph-cz-body">{children}</div>

      {/* ── Trust band ── */}
      <section className="border-t border-white/10 bg-[#15112e]">
        <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          {TRUST.map((t) => (
            <div key={t.title} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 sm:p-4">
              <span className="w-10 h-10 rounded-xl bg-amber-400/15 text-amber-400 flex items-center justify-center shrink-0"><t.icon size={20} /></span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{t.title}</p>
                <p className="text-xs text-white/50 truncate">{t.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
