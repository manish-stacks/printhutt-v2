"use client"
import { wishlistService } from '@/_services/common/wishlist';
import { formatCurrency } from '@/helpers/helpers';
import { Product } from '@/lib/types/product';
import { useAddToCart } from '@/hooks/useAddToCart';
import useQuickStore from '@/store/useQuickStore';
import { useUserStore } from '@/store/useUserStore';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { RiEyeLine, RiHeart3Line, RiShoppingBag4Line, RiFlashlightLine, RiStarFill, RiStarLine, RiPlayFill } from 'react-icons/ri';
import { effectivePricing, cardVideoId, youtubeThumb } from '@/lib/pricing';

interface ProductCardProps {
    product: Product;
    /** @deprecated — ab sab jagah ek hi DarkCard design hai */
    variant?: 'light' | 'dark';
}

const iconBtn = "w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-black/40 sm:bg-white/10 backdrop-blur-md border border-white/10 hover:bg-amber-400 hover:border-amber-400 transition-all duration-300 flex items-center justify-center group/btn";

/** Variant label: size → color → fallback */
const vLabel = (v: any, i: number) => v?.size || v?.color || `Option ${i + 1}`;

/** Single card design — site ke har listing me same (DarkCard) */
const ProductCard = ({ product }: ProductCardProps) => {
    const { handleAddToCart } = useAddToCart();
    const isLoggedIn = useUserStore((s) => s.isLoggedIn);
    const router = useRouter();
    const { openQuickView } = useQuickStore();

    const variants: any[] = useMemo(
        () => (product?.isVarientStatus && Array.isArray(product?.varient) ? product.varient.filter(Boolean) : []),
        [product]
    );
    const [vIdx, setVIdx] = useState(0);
    const selected = variants[vIdx] || null;

    const pr = effectivePricing(product, selected);
    const isOutOfStock = !product?.status || (selected ? Number(selected.stock ?? product.stock) <= 0 : product?.stock <= 0);
    const ytId = cardVideoId(product);
    const vThumb = selected?.thumbnail?.url || selected?.images?.[0]?.url;
    const mainSrc = vThumb || (ytId ? youtubeThumb(ytId) : product?.thumbnail?.url) || '/placeholder.jpg';
    const hoverSrc = !vThumb ? product?.images?.[0]?.url : undefined;
    const href = `/product-details/${product.slug}`;
    const rating = Math.round(Number(product?.rating) || 5);

    const onWishlist = async () => {
        if (!isLoggedIn) return router.push(`/login?redirect=${encodeURIComponent(href)}`);
        try {
            const res: any = await wishlistService.addWishlist(product._id);
            toast(res?.message || 'Added to wishlist');
        } catch (e: any) {
            toast.error(e?.message || 'Could not update wishlist');
        }
    };
    const onCustomize = () => router.push(product?.customizeLink || href);
    const onAdd = () => {
        if (isOutOfStock) return;
        handleAddToCart(product, selected || undefined);
    };

    const showVariants = variants.length > 1;
    const shown = variants.slice(0, 3);

    return (
        <div className="group h-full">
            <div className="relative flex flex-col h-full overflow-hidden rounded-[14px] border border-white/10 bg-[#13132a] hover:border-amber-400/40 transition-all duration-500 sm:hover:-translate-y-1.5 shadow-lg hover:shadow-amber-400/10">
                {/* Media */}
                <div className="relative aspect-square overflow-hidden bg-[#1b1b36]">
                    <Link href={href} className="block relative h-full" aria-label={product.title}>
                        <Image className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105" src={mainSrc} alt={product.title} width={600} height={600} loading="lazy" sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw" />
                        {hoverSrc && (
                            <Image className="hidden sm:block absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-all duration-700" src={hoverSrc} alt="" width={600} height={600} loading="lazy" sizes="25vw" />
                        )}
                        {ytId && !vThumb && (
                            <span className="absolute inset-0 flex items-center justify-center">
                                <span className="w-11 h-11 rounded-full bg-black/60 flex items-center justify-center text-white"><RiPlayFill size={22} /></span>
                            </span>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#13132a] via-transparent to-transparent" />
                    </Link>

                    <div className="absolute top-2.5 left-2.5 right-2.5 sm:top-3 sm:left-3 sm:right-3 flex items-start justify-between gap-1 pointer-events-none">
                        {(product.new || product.trending || product.sale) ? (
                            <span className="bg-white/10 backdrop-blur-md border border-white/10 text-white text-[9px] sm:text-[10px] font-bold px-2 sm:px-3 py-1 rounded-full uppercase tracking-wide">
                                {product.new ? 'New' : product.trending ? 'Trending' : 'Sale'}
                            </span>
                        ) : <span />}
                        {pr.hasDiscount && (
                            <span className="bg-amber-400 text-black text-[9px] sm:text-[10px] font-bold px-2 sm:px-3 py-1 rounded-full shadow-lg">
                                {pr.offPercent}% OFF
                            </span>
                        )}
                    </div>

                    <div className="ph-touch-show absolute right-2.5 sm:right-3 bottom-2.5 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 flex sm:flex-col gap-2 opacity-0 sm:translate-x-5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 z-10">
                        <button onClick={onWishlist} aria-label="Add to wishlist" className={iconBtn}><RiHeart3Line size={18} className="text-white group-hover/btn:text-black" /></button>
                        <button onClick={() => openQuickView(product)} aria-label="Quick view" className={iconBtn}><RiEyeLine size={18} className="text-white group-hover/btn:text-black" /></button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex flex-col flex-1 p-3 sm:p-4">
                    <div className="flex items-center gap-1.5 mb-1 min-w-0">
                        <RiFlashlightLine size={12} className="text-amber-400 shrink-0" />
                        <span className="text-white/40 text-[10px] sm:text-[11px] uppercase tracking-[0.12em] font-semibold truncate">{product?.category?.name || 'PrintHutt'}</span>
                    </div>
                    <Link href={href} className="block">
                        <h3 className="text-white text-[14px] sm:text-[16px] font-semibold leading-snug line-clamp-2 min-h-[2.6em] hover:text-amber-300 transition-colors">{product.title}</h3>
                    </Link>
                    <div className="flex items-center gap-0.5 mt-1.5">
                        {[...Array(5)].map((_, i) => i < rating
                            ? <RiStarFill key={i} size={12} className="text-amber-400" />
                            : <RiStarLine key={i} size={12} className="text-white/25" />)}
                    </div>

                    {/* Variants — user ko pata chale kaunse options hain */}
                    {showVariants && (
                        <div className="mt-2.5">
                            <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5">{variants.length} options</p>
                            <div className="flex flex-wrap gap-1.5">
                                {shown.map((v, i) => (
                                    <button
                                        key={v?._id || i}
                                        type="button"
                                        onClick={() => setVIdx(i)}
                                        title={vLabel(v, i)}
                                        className={`max-w-[100px] truncate px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-medium border transition-all
                                            ${i === vIdx ? 'bg-amber-400 text-black border-amber-400' : 'bg-white/5 text-white/70 border-white/15 hover:border-amber-400/60'}`}
                                    >
                                        {vLabel(v, i)}
                                    </button>
                                ))}
                                {variants.length > 3 && (
                                    <Link href={href} className="px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-medium border border-white/15 text-white/60 hover:text-amber-300">
                                        +{variants.length - 3}
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex-1" />
                    <div className="pt-2.5 mt-2.5 border-t border-white/10">
                        {product?.showPrice ? (
                            <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="flex items-baseline gap-1.5 flex-wrap">
                                        <span className="text-amber-400 text-[17px] sm:text-[22px] font-bold leading-none">{formatCurrency(pr.final)}</span>
                                        {pr.hasDiscount && <span className="text-white/30 text-[11px] sm:text-sm line-through">{formatCurrency(pr.mrp)}</span>}
                                    </div>
                                    <span className={`block text-[10px] sm:text-xs mt-1.5 font-medium ${isOutOfStock ? 'text-red-400' : 'text-emerald-400'}`}>{isOutOfStock ? 'Out of Stock' : 'In Stock'}</span>
                                </div>
                                <button onClick={product?.isCustomize ? onCustomize : onAdd} disabled={isOutOfStock} aria-label="Add to cart"
                                    className={`shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 ${isOutOfStock ? 'bg-gray-500 cursor-not-allowed opacity-50' : 'bg-amber-400 hover:bg-white'}`}>
                                    <RiShoppingBag4Line size={19} className="text-black" />
                                </button>
                            </div>
                        ) : (
                            <button disabled={isOutOfStock} onClick={onCustomize} className="w-full h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-400 hover:bg-white text-black text-[12px] sm:text-sm font-bold transition-all duration-300 disabled:opacity-50">
                                Customize Product
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(ProductCard);
