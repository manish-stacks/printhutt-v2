
"use client";

/**
 * Heart-shaped LED photo frame — 9 photo upload customizer.
 */
import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { BiRefresh } from 'react-icons/bi';
import { BsUpload } from 'react-icons/bs';
import { RiShoppingBag2Line } from 'react-icons/ri';
import { toast } from 'react-toastify';
import { get_product_by_id } from '@/_services/admin/product';
import { useCartStore } from '@/store/useCartStore';
import useCartSidebarStore from '@/store/useCartSidebarStore';
import type { Product } from '@/lib/types/product';
import { formatCurrency } from '@/helpers/helpers';

/* ⬇️ apna heart-frame product _id yahan daalo */
const PRODUCT_ID = '6a3d07b59ae503417e15ffe9';

const SLOTS = 9;
const MAX_SIDE = 1200; // longest edge px
const JPEG_QUALITY = 0.85;

const SLOT_LABELS = [
    'Top-Left', 'Top-Center', 'Top-Right',
    'Mid-Left', 'Center', 'Mid-Right',
    'Bottom-Left', 'Bottom-Center', 'Bottom-Right',
];

const EDIT_PATH = '/customize/frame/heart-led-photo-frame';

export default function HeartFramePage() {
    const [product, setProduct] = useState<Product>();
    const [images, setImages] = useState<(string | null)[]>(Array(SLOTS).fill(null));
    const [isAdding, setIsAdding] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

    const addToCart = useCartStore((s) => s.addToCart);
    const updateCustomItem = useCartStore((s) => s.updateCustomItem);
    const { openCartSidebarView } = useCartSidebarStore();

    useEffect(() => {
        (async () => {
            try {
                const p = await get_product_by_id(PRODUCT_ID);
                setProduct(p);
            } catch (e) {
                console.error('Error fetching product:', e);
            }
        })();
    }, []);

    /* Edit mode: URL me ?editId=<customId> ho to cart se existing photos preload */
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const id = params.get('editId');
        if (!id) return;
        setEditId(id);
        try {
            const items = useCartStore.getState().items;
            const found = items.find(
                (it) => (it as any).custom_data?._customId === id
            );
            const existing = (found as any)?.custom_data?.customImages as unknown[] | undefined;
            if (Array.isArray(existing)) {
                const next = Array(SLOTS).fill(null) as (string | null)[];
                existing.slice(0, SLOTS).forEach((u, i) => {
                    if (typeof u === 'string') next[i] = u;
                });
                setImages(next);
            }
        } catch (e) {
            console.error('preload edit images failed', e);
        }
    }, []);

    const resizeToDataUrl = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error('read failed'));
            reader.onloadend = () => {
                const img = new window.Image();
                img.onload = () => {
                    const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
                    const w = Math.round(img.width * scale);
                    const h = Math.round(img.height * scale);
                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return reject(new Error('no canvas ctx'));
                    ctx.drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
                };
                img.onerror = () => reject(new Error('image decode failed'));
                img.src = reader.result as string;
            };
            reader.readAsDataURL(file);
        });

    const handleUpload = (i: number) => async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Please choose an image file');
            return;
        }
        try {
            const dataUrl = await resizeToDataUrl(file);
            setImages((prev) => {
                const next = [...prev];
                next[i] = dataUrl;
                return next;
            });
        } catch (err) {
            console.error(err);
            toast.error('Could not process that image, try another');
        }
    };

    const clearSlot = (i: number) =>
        setImages((prev) => {
            const next = [...prev];
            next[i] = null;
            return next;
        });

    const resetAll = () => setImages(Array(SLOTS).fill(null));

    const filledCount = images.filter(Boolean).length;
    const allFilled = filledCount === SLOTS;

    const handleAddToCart = () => {
        if (!allFilled) {
            toast.error(`Please upload all ${SLOTS} photos (${filledCount}/${SLOTS} done)`);
            return;
        }
        if (!product) {
            toast.error('Product not loaded yet, please wait');
            return;
        }
        try {
            setIsAdding(true);

            if (editId) {
                /* Edit mode — existing cart item update */
                updateCustomItem(
                    editId,
                    { customImages: images, photoCount: SLOTS, _editPath: EDIT_PATH },
                    (images[4] as string) || undefined
                );
                openCartSidebarView();
                toast.success('Cart updated');
                return;
            }

            const custom_data = {
                customImages: images,
                photoCount: SLOTS,
                _editPath: EDIT_PATH,
                _customId: `hf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            };
            const updatedProduct = {
                ...product,
                thumbnail: { ...product.thumbnail, url: (images[4] as string) },
                custom_data,
            } as unknown as Product;

            addToCart(updatedProduct, 1);
            openCartSidebarView();
            toast.success('Added to cart');
        } catch (err) {
            console.error('Error while adding to cart:', err);
            toast.error('Could not add to cart');
        } finally {
            setIsAdding(false);
        }
    };

    const getProductPrice = () => {
        if (!product?.price) return '₹0';

        if (product.discountType && product.discountPrice) {
            const discountedPrice = product.discountType === 'percentage'
                ? product.price - (product.price * product.discountPrice) / 100
                : product.price - product.discountPrice;

            return formatCurrency ? formatCurrency(discountedPrice) : `₹${discountedPrice}`;
        }

        return formatCurrency ? formatCurrency(product.price) : `₹${product.price}`;
    };

    const productPrice = getProductPrice();

    return (
        <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-10">
            <div className="container mx-auto px-4">
                <h1 className="text-3xl md:text-4xl font-semibold text-center text-gray-800 mb-2">
                    Heart LED Photo Frame
                </h1>
                <p className="text-center text-gray-500 mb-8">
                    Upload your 9 favourite photos — {filledCount}/{SLOTS} added
                </p>

                <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto items-start">
                    <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-6">
                        <div className="grid grid-cols-3 gap-3">
                            {images.map((img, i) => (
                                <div key={i} className="relative aspect-[3/4]">
                                    <button
                                        type="button"
                                        onClick={() => inputRefs.current[i]?.click()}
                                        className={`w-full h-full rounded-lg border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-colors
                      ${img ? 'border-emerald-500' : 'border-gray-300 hover:border-pink-400 bg-gray-50'}`}
                                        title={SLOT_LABELS[i]}
                                    >
                                        {img ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={img} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <BsUpload className="w-5 h-5 text-gray-400 mb-1" />
                                                <span className="text-[11px] text-gray-400">Photo {i + 1}</span>
                                            </>
                                        )}
                                    </button>
                                    {img && (
                                        <button
                                            type="button"
                                            onClick={() => clearSlot(i)}
                                            className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm leading-none"
                                            title="Remove"
                                        >
                                            ×
                                        </button>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        ref={(el) => { inputRefs.current[i] = el; }}
                                        onChange={handleUpload(i)}
                                    />
                                </div>
                            ))}
                        </div>

                        {filledCount > 0 && (
                            <button
                                type="button"
                                onClick={resetAll}
                                className="mt-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"
                            >
                                <BiRefresh className="w-4 h-4" /> Reset all
                            </button>
                        )}
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-6 md:sticky md:top-6">
                        {product && (
                            <>
                                <h2 className="text-xl font-semibold text-gray-800">{product.title}</h2>
                                <p className="text-2xl font-bold text-pink-600 mt-1">
                                    {productPrice} <del className="text-gray-400 text-sm ml-2">₹{product.price ?? ''}</del>
                                </p>
                            </>
                        )}

                        <ul className="list-disc list-inside text-gray-600 text-sm mt-5 space-y-1">
                            <li>Upload 9 clear, high-quality photos.</li>
                            <li>Portrait (vertical) photos best fit karti hain.</li>
                            <li>Center photo (slot 5) frame ke beech me aati hai.</li>
                            <li>Recommended: 1000×1400px+ per photo.</li>
                        </ul>

                        <div className="mt-6 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-pink-500 transition-all"
                                style={{ width: `${(filledCount / SLOTS) * 100}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{filledCount} of {SLOTS} uploaded</p>

                        <button
                            type="button"
                            onClick={handleAddToCart}
                            disabled={isAdding || !allFilled}
                            className="w-full mt-6 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-md font-medium flex items-center justify-center gap-2"
                        >
                            <RiShoppingBag2Line className="w-5 h-5" />
                            {isAdding
                                ? (editId ? 'Updating...' : 'Adding to Cart...')
                                : allFilled
                                    ? (editId ? 'Update Cart' : 'Add to Cart')
                                    : `Upload ${SLOTS - filledCount} more`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
