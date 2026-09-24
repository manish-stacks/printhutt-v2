"use client";
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RiArrowRightSLine, RiShuffleLine, RiTimeLine, RiLayoutGridLine, RiInboxLine } from 'react-icons/ri';
import ProductCard from './ProductCard';
import { productService } from '@/_services/common/productService';
import { categoryService } from '@/_services/common/categoryService';

type Sort = 'recommended' | 'newest';
interface Sub { _id: string; name: string; slug: string; image?: { url?: string }; productCount?: number }
interface Props { slug: string; subslug?: string }

const LIMIT = 12;
const pretty = (s = '') => s.replace(/-/g, ' ');
const mergeUnique = (prev: any[], next: any[]) => {
  const ids = new Set(prev.map((p) => p?._id));
  return [...prev, ...next.filter((p) => p && !ids.has(p._id))];
};

/* Session-stable seed → har visit pe naya random order (Flipkart style),
   par back-navigation / infinite scroll pe order same rahe */
const getSeed = (key: string) => {
  if (typeof window === 'undefined') return 1;
  const k = `ph-seed:${key}`;
  const old = sessionStorage.getItem(k);
  if (old) return Number(old);
  const s = Math.floor(Math.random() * 1e9) + 1;
  sessionStorage.setItem(k, String(s));
  return s;
};

const SkeletonCard = () => (
  <div className="rounded-[14px] overflow-hidden bg-[#13132a] animate-pulse">
    <div className="aspect-square bg-white/5" />
    <div className="p-4 space-y-2.5">
      <div className="h-2.5 w-1/3 bg-white/10 rounded" />
      <div className="h-3.5 w-4/5 bg-white/10 rounded" />
      <div className="h-3.5 w-3/5 bg-white/10 rounded" />
      <div className="h-6 w-2/5 bg-white/10 rounded mt-4" />
    </div>
  </div>
);

export default function CategoryListing({ slug, subslug }: Props) {
  const key = subslug || slug;
  const [subs, setSubs] = useState<Sub[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sort, setSort] = useState<Sort>('recommended');
  const lock = useRef(false);
  const sentinel = useRef<HTMLDivElement | null>(null);
  const reqId = useRef(0);

  const seed = useMemo(() => (sort === 'recommended' ? getSeed(key) : undefined), [key, sort]);

  // Category page → uske subcategories
  useEffect(() => {
    if (subslug) return;
    categoryService.getSubcategoryAll('all', slug)
      .then((r: any) => setSubs(r?.categories || []))
      .catch(() => setSubs([]));
  }, [slug, subslug]);

  const fetchPage = useCallback(async (p: number) => {
    const id = ++reqId.current;
    p === 1 ? setLoading(true) : setLoadingMore(true);
    try {
      const res: any = subslug
        ? await productService.getProductsBySubCategory(p, subslug, LIMIT, seed)
        : await productService.getProductsByCategory(p, slug, LIMIT, seed);
      if (id !== reqId.current) return; // stale response (sort/slug badla)
      const list = res?.products || [];
      setProducts((prev) => (p === 1 ? list : mergeUnique(prev, list)));
      if (subslug && p === 1) setSubs(res?.categories || []);
      setTotal(res?.pagination?.total ?? null);
      setHasMore(!!res?.pagination?.hasMore);
    } catch (e) {
      if (id === reqId.current) { setHasMore(false); console.error(e); }
    } finally {
      if (id === reqId.current) { setLoading(false); setLoadingMore(false); lock.current = false; }
    }
  }, [slug, subslug, seed]);

  useEffect(() => {
    setPage(1); setProducts([]); setHasMore(true);
    fetchPage(1);
  }, [fetchPage]);

  useEffect(() => { if (page > 1) fetchPage(page); }, [page, fetchPage]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && hasMore && !loading && !loadingMore && !lock.current) {
        lock.current = true;
        setPage((p) => p + 1);
      }
    }, { rootMargin: '400px' });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading, loadingMore]);

  const activeSub = subs.find((s) => s.slug === subslug);
  const title = pretty(activeSub?.name || subslug || slug);

  return (
    <div className="bg-[#f7f6fb] min-h-[60vh]">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[#241B4F] text-white">
        <div className="absolute inset-x-0 top-0 flex h-1">{['#00AEEF', '#EC008C', '#FFF200', '#fbbf24'].map((c) => <span key={c} className="flex-1" style={{ background: c }} />)}</div>
        <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full bg-amber-400/10 blur-2xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-7 sm:py-10">
          <nav className="flex items-center gap-1 text-[12px] text-white/50 mb-3 flex-wrap">
            <Link href="/" className="hover:text-white">Home</Link>
            <RiArrowRightSLine />
            {subslug ? (<><Link href={`/category/${slug}`} className="hover:text-white capitalize">{pretty(slug)}</Link><RiArrowRightSLine /></>) : null}
            <span className="text-white/80 capitalize">{title}</span>
          </nav>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-[26px] sm:text-[38px] font-bold capitalize leading-tight tracking-tight">{title}</h1>
              <p className="text-white/60 text-sm mt-1">
                {total !== null ? `${total} product${total === 1 ? '' : 's'}` : 'Loading collection…'} · Personalised & premium printed
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Neon special banner */}
      {slug === 'neon' && !subslug && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5">
          <Link href="/product/customize-neon-sign" className="block rounded-2xl overflow-hidden">
            <Image src="https://s3.ap-south-1.amazonaws.com/printhutt.dev.bucket/others/neon.png" alt="Customize neon sign" width={1294} height={300} className="w-full h-[140px] sm:h-[260px] object-cover" />
          </Link>
        </div>
      )}

      {/* ── Sub-category chips (horizontal scroll, no empty gaps) ── */}
      {subs.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5">
          <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x">
            {subslug && (
              <Link href={`/category/${slug}`} className="snap-start shrink-0 flex items-center gap-2 h-[52px] pl-2 pr-4 rounded-2xl bg-white border border-gray-200 hover:border-[#241B4F] transition text-sm font-medium text-gray-700">
                <span className="w-9 h-9 rounded-xl bg-[#241B4F]/5 flex items-center justify-center text-[#241B4F]"><RiLayoutGridLine /></span>All
              </Link>
            )}
            {subs.map((s) => {
              const active = s.slug === subslug;
              return (
                <Link key={s._id} href={`/category/${slug}/${s.slug}`}
                  className={`snap-start shrink-0 flex items-center gap-2 h-[52px] pl-1.5 pr-4 rounded-2xl border transition text-sm font-medium capitalize
                    ${active ? 'bg-[#241B4F] border-[#241B4F] text-white' : 'bg-white border-gray-200 text-gray-700 hover:border-[#241B4F]'}`}>
                  <span className="relative w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    {s.image?.url && <Image src={s.image.url} alt={s.name} fill sizes="40px" className="object-cover" />}
                  </span>
                  <span className="whitespace-nowrap">{s.name}</span>
                  {!!s.productCount && <span className={`text-[11px] ${active ? 'text-white/60' : 'text-gray-400'}`}>{s.productCount}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <p className="text-[13px] text-gray-500 hidden sm:block">
            Showing <span className="font-semibold text-gray-800">{products.length}</span>{total !== null && <> of {total}</>}
          </p>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-gray-200 ml-auto">
            {([['recommended', 'For you', RiShuffleLine], ['newest', 'Newest', RiTimeLine]] as const).map(([v, label, Icon]) => (
              <button key={v} onClick={() => setSort(v)}
                className={`flex items-center gap-1.5 px-3 h-8 rounded-lg text-[13px] font-medium transition ${sort === v ? 'bg-[#241B4F] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Icon size={14} />{label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 pb-14">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : products.map((p) => <ProductCard key={p._id} product={p} />)}
          {loadingMore && Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={`m${i}`} />)}
        </div>

        {hasMore && !loading && <div ref={sentinel} className="h-5" />}

        {!loading && products.length === 0 && (
          <div className="flex flex-col items-center text-center py-16 px-4">
            <span className="w-16 h-16 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-[#241B4F] mb-4"><RiInboxLine size={28} /></span>
            <h3 className="text-lg font-semibold text-gray-900">No products here yet</h3>
            <p className="text-sm text-gray-500 mt-1 mb-5">New designs are on the way. Meanwhile explore everything else.</p>
            <Link href="/products" className="px-5 h-11 inline-flex items-center rounded-xl bg-[#241B4F] text-white text-sm font-semibold">Browse all products</Link>
          </div>
        )}

        {!hasMore && !loading && products.length > 0 && (
          <p className="text-center text-[13px] text-gray-400 pt-8">You&apos;ve seen it all ✨</p>
        )}
      </section>
    </div>
  );
}
