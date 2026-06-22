'use client';
import { Product } from '@/lib/types/product';
import { wishlistService } from '@/_services/common/wishlist';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BiBell, BiChevronLeft, BiChevronRight, BiHeart, BiPlus, BiRefresh, BiStar, BiX, BiZoomIn } from 'react-icons/bi';
import { BsFileText, BsUpload } from 'react-icons/bs';
import { RiDiscountPercentFill, RiShoppingBag2Line, RiThumbUpFill } from 'react-icons/ri';
import { motion } from "framer-motion";
import Image from 'next/image';
import Breadcrumb from '@/components/Breadcrumb';
import { formatCurrency } from '@/helpers/helpers';
import ProductSlider from '@/components/ProductSlider';
import useCartSidebarStore from '@/store/useCartSidebarStore';
import { useCartStore } from '@/store/useCartStore';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/useUserStore';
import Link from 'next/link';

interface VariantImage { url: string; }

interface Variant {
  _id: string; size: string; color?: string; price: number;
  discountPrice?: number; discountType?: string; stock: number;
  images?: VariantImage[]; thumbnail?: VariantImage;
  isMainProduct?: boolean;
}
interface ProductProps {
  product: {
    _id: string; title: string; short_description: string; description: string;
    slug: string; imgAlt: string; thumbnail: { url: string }; images: { url: string }[];
    varient: Variant[]; brand: string; dimensions: string; shippingFee?: number;
    weight?: number; isVarientStatus?: boolean;
    returnPolicy?: { returnPeriod?: string };
    warrantyInformation?: { durationMonths?: number; warrantyType?: string; claimProcess?: string };
    shippingInformation?: { shippingTime?: string; shippingMethod?: string };
    offers?: { offerTitle?: string; offerDescription?: string }[];
    discountPrice?: number; discountType?: string; price?: number;
    meta?: { meta_title?: string; meta_description?: string; meta_keywords?: string };
    customizeLink: string; isCustomize?: boolean; isTextBox?: boolean; isImageBox?: boolean;
    reviews?: {
      userId?: { displayName?: string }; rating?: number; review?: string;
      createdAt?: string; images?: { url: string }[];
    }[];
    category?: { name: string };
  };
  relatedProduct: Product[];
}

function computeDiscountedPrice(price: number, discountType?: string, discountPrice?: number): number {
  if (!discountPrice || discountPrice === 0) return price;
  if (discountType === 'percentage') return price - (price * discountPrice) / 100;
  return price - discountPrice;
}

export default function ProductDetails({ product, relatedProduct }: ProductProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(product?.varient?.[0]?._id || '');
  const [showDescriptions, setShowDescriptions] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<'product' | 'brand'>('product');
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 58, seconds: 28 });
  const [textBox, setTextBox] = useState('');
  const [previewImage, setPreviewImage] = useState('');
  const [showImagePreview, setShowImagePreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { openCartSidebarView } = useCartSidebarStore();
  const addToCart = useCartStore(state => state.addToCart);
  const isLoggedIn = useUserStore(state => state.isLoggedIn);
  const router = useRouter();

  const selectedVariant = useMemo(
    () => product?.varient?.find(v => v._id === selectedVariantId) || product?.varient?.[0] || null,
    [selectedVariantId, product?.varient]
  );

  // console.log('Selected Variant:', product);

  const activePrice = useMemo(() => {
    if (selectedVariant?.price) {
      return selectedVariant.price;
    }

    return product?.price || 0;
  }, [selectedVariant, product]);


  const activeDiscountType = selectedVariant?.discountType || product?.discountType;
  const activeDiscountPrice = selectedVariant?.discountPrice ?? product?.discountPrice ?? 0;

  const activeFinalPrice = useMemo(() => {
    return computeDiscountedPrice(
      activePrice,
      activeDiscountType,
      activeDiscountPrice
    );
  }, [activePrice, activeDiscountType, activeDiscountPrice]);


  const productImages = useMemo(() => {
    // Agar variant ki apni images hain (isMainProduct ON ya variant images exist)
    const variantHasImages = selectedVariant?.images && selectedVariant.images.length > 0;
    const variantIsMain = (selectedVariant as any)?.isMainProduct;

    if (variantHasImages || variantIsMain) {
      const thumbUrl = selectedVariant?.thumbnail?.url;
      const galleryUrls = (selectedVariant?.images || []).map(
        img => `${img.url}?auto=format&fit=crop&w=800&q=80`
      );
      if (thumbUrl) return [`${thumbUrl}?auto=format&fit=crop&w=800&q=80`, ...galleryUrls];
      if (galleryUrls.length > 0) return galleryUrls;
    }

    // Fallback: product level images
    const thumbnailUrl = product?.thumbnail?.url
      ? `${product.thumbnail.url}?auto=format&fit=crop&w=800&q=80`
      : null;
    const imageUrls = product?.images?.map(img => `${img.url}?auto=format&fit=crop&w=800&q=80`) || [];
    return [thumbnailUrl, ...imageUrls].filter(Boolean) as string[];
  }, [selectedVariant, product]);

  useEffect(() => { setCurrentImageIndex(0); }, [selectedVariantId]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePrevImage = () => setCurrentImageIndex(prev => (prev + 1) % productImages.length);
  const handleNextImage = () => setCurrentImageIndex(prev => prev === 0 ? productImages.length - 1 : prev - 1);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setZoomPosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const keyHighlights = useMemo(() => [
    { label: 'Brand', value: product?.brand },
    { label: 'Dimensions', value: ' '+product?.dimensions },
    { label: 'Delivery', value: '5-8 Days or Depends on Location' },
    { label: 'Outer Material', value: 'A-Grade Standard Quality' },
    { label: 'Shipping', value: product?.shippingFee ? `₹${product.shippingFee}` : 'Free Shipping' },
    { label: 'Type', value: product?.category?.name },
  ], [product]);

  const ratingCounts = useMemo(() => ({ 5: 251, 4: 139, 3: 55, 2: 1, 1: 3 }), []);
  const totalRatings = useMemo(() => Object.values(ratingCounts).reduce((a, b) => a + b, 0), [ratingCounts]);
  const averageRating = useMemo(() =>
    Object.entries(ratingCounts).reduce((acc, [r, c]) => acc + Number(r) * c, 0) / totalRatings,
    [ratingCounts, totalRatings]);

  const dummyReviews = useMemo(() => [
    { id: 1, rating: 5, comment: 'Best one I ever bought!', author: 'Alroy', date: '6 January 2025', helpful: 2 },
    { id: 2, rating: 4, comment: 'Great quality and design', author: 'Sarah', date: '15 January 2025', helpful: 1 },
  ], []);

  //  FIXED — sahi validation
  const handleAddToCart = () => {
    if (!product) return;
    if (
  (product?.isVarientStatus &&
    (selectedVariant?.stock ?? 0) <= 0) ||
  (!product?.isVarientStatus &&
    (product?.stock ?? 0) <= 0)
) {
  toast.error("Product is out of stock");
  return;
}

    if (product.isCustomize) return router.push(product.customizeLink);

    //  isTextBox true ho to name required
    if (product.isTextBox && !textBox.trim()) {
      toast.error('Please enter your name before adding to cart');
      return;
    }

    //  isImageBox true ho to photo required
    if (product.isImageBox && !previewImage) {
      toast.error('Please upload your photo before adding to cart');
      return;
    }

    let finalProduct: any = { ...product };

    // custom_data build karo
    if (product.isTextBox || product.isImageBox || product.isVarientStatus) {

      finalProduct = {
        ...finalProduct,
        custom_data: {
          ...(product.isTextBox ? { name1: textBox } : {}),
          ...(product.isImageBox ? { previewCanvas: previewImage } : {}),
          ...(product.isVarientStatus ? { variant: selectedVariant?.size || '' } : {}),
        },
      };
    }

    if (selectedVariant) {
      finalProduct = { ...finalProduct, price: selectedVariant.price, selectedVariant };
    }

    // console.log(finalProduct);
    addToCart(finalProduct, 1);
    openCartSidebarView();
    toast.success('Product added to cart successfully!');
  };

  const handleAddToWishlist = async () => {
    if (!isLoggedIn) return router.push('/login');
    await wishlistService.addWishlist(product._id);
    toast.success('Product added to wishlist successfully!');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const isOutOfStock =
  !product?.status ||
  (
    product?.isVarientStatus
      ? (selectedVariant?.stock ?? 0) <= 0
      : (product?.stock ?? 0) <= 0
  );

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* <Breadcrumb title="Product Page" /> */}

        {/* Fullscreen product image modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
            <div className="relative w-full max-w-6xl mx-4">
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-rose-700 hover:text-rose-800 z-[999]">
                <BiX className="w-8 h-8" />
              </button>
              <div className="relative flex items-center justify-center">
                <img src={productImages[currentImageIndex]} alt={`${product?.slug}-${currentImageIndex + 1}`} className="w-auto h-[800px] sm:w-full max-[567px]:h-0 object-contain" />
                <button onClick={handlePrevImage} className="absolute left-4 top-1/2 -translate-y-1/2 bg-slate-600/60 p-2 rounded-full">
                  <BiChevronLeft className="w-8 h-8 text-white" />
                </button>
                <button onClick={handleNextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-600/60 p-2 rounded-full">
                  <BiChevronRight className="w-8 h-8 text-white" />
                </button>
              </div>
              <div className="flex justify-center mt-4 gap-2">
                {productImages.map((_, i) => (
                  <button key={i} onClick={() => setCurrentImageIndex(i)} className={`w-2 h-2 rounded-full ${currentImageIndex === i ? 'bg-white' : 'bg-white/50'}`} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/*  Uploaded image preview modal */}
        {showImagePreview && previewImage && (
          <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center" onClick={() => setShowImagePreview(false)}>
            <div className="relative bg-white rounded-xl p-4 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowImagePreview(false)} className="absolute top-3 right-3 text-gray-500 hover:text-red-500">
                <BiX className="w-6 h-6" />
              </button>
              <p className="text-sm font-semibold text-gray-700 mb-3">Uploaded Photo Preview</p>
              <img src={previewImage} alt="preview" className="w-full rounded-lg object-cover max-h-80" />
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Images */}
          <div className="md:sticky md:top-8 space-y-4 h-fit">
            <div
              className={`aspect-square bg-white rounded-lg overflow-hidden relative shadow-lg ${!isMobile ? 'cursor-zoom-in' : ''}`}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => !isMobile && setIsZoomed(true)}
              onMouseLeave={() => !isMobile && setIsZoomed(false)}
            >
              <img
                src={productImages[currentImageIndex]}
                alt={currentImageIndex === 0 ? product?.imgAlt || 'Product Image' : `${product?.slug}-${currentImageIndex + 1}`}
                className="w-full h-full object-cover transition-transform duration-200"
                style={!isMobile ? {
                  transform: isZoomed ? 'scale(2)' : 'scale(1)',
                  transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  transition: isZoomed ? 'none' : 'transform 0.3s ease-out',
                } : {}}
              />
              {!isZoomed && (
                <div className="absolute top-4 right-4 bg-white/80 p-2 rounded-full">
                  <BiZoomIn className="w-5 h-5 text-gray-600" />
                </div>
              )}
              <button onClick={e => { e.stopPropagation(); handlePrevImage(); }} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg hover:bg-white">
                <BiChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={e => { e.stopPropagation(); handleNextImage(); }} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg hover:bg-white">
                <BiChevronRight className="w-6 h-6" />
              </button>
            </div>

            <div className="relative">
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex space-x-2 pb-2">
                  {productImages.map((image, index) => (
                    <div key={index}
                      className={`flex-none w-24 max-[567px]:w-20 aspect-square rounded-lg overflow-hidden cursor-pointer transition-all ${currentImageIndex === index ? 'ring-2 ring-black ring-offset-2' : 'hover:opacity-75'}`}
                      onClick={() => setCurrentImageIndex(index)}
                    >
                      <img src={image} alt={`thumb-${index}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-gray-50 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-gray-50 pointer-events-none" />
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="space-y-6 mt-8 md:mt-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{product?.title}</h1>
              <p className="text-xs sm:text-sm text-gray-500">{product?.short_description}</p>
            </div>

            {/* Price */}
            <div className="flex flex-col sm:flex-row justify-between items-start">
              <div className="mb-4 sm:mb-0">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="text-2xl font-bold text-slate-900 leading-none">
                    {formatCurrency(activeFinalPrice)}
                  </span>

                  {Number(activeDiscountPrice) > 0 && (
                    <span className="text-base text-gray-400 line-through leading-none">
                      {formatCurrency(activePrice)}
                    </span>
                  )}

                  {Number(activeDiscountPrice) > 0 && (
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-rose-100 text-rose-600 text-sm font-semibold leading-none">
                      {activeDiscountType === 'percentage'
                        ? `${activeDiscountPrice}% OFF`
                        : `${formatCurrency(Number(activeDiscountPrice))} OFF`}
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-500 mt-1">inclusive of all taxes</p>
              </div>
              <div className="flex items-center space-x-1">
                <BiStar className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm sm:text-lg font-medium">4.4</span>
                <span className="text-blue-600 text-sm sm:text-lg cursor-pointer">| {totalRatings} Reviews</span>
              </div>
            </div>

            {/* Variant Selector */}
            {product?.isVarientStatus && product.varient && product.varient.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Select Size
                    {selectedVariant?.size && <span className="ml-2 font-normal text-gray-500">— {selectedVariant.size}</span>}
                  </h3>
                  {selectedVariant?.stock !== undefined && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${selectedVariant.stock > 10 ? 'bg-green-100 text-green-700' : selectedVariant.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {selectedVariant.stock > 10 ? 'In Stock' : selectedVariant.stock > 0 ? `Only ${selectedVariant.stock} left` : 'Out of Stock'}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.varient.map((variant) => {
                    const isSelected = selectedVariantId === variant._id;
                    const thumbUrl = variant.thumbnail?.url || variant.images?.[0]?.url;
                    const hasImages = !!(variant.thumbnail?.url || (variant.images && variant.images.length > 0));
                    return (
                      <motion.button key={variant._id} type="button" whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedVariantId(variant._id)}
                        className={`relative flex flex-col items-center rounded-xl border-2 transition-all duration-200 overflow-hidden ${isSelected ? 'border-pink-500 shadow-md shadow-pink-100' : 'border-gray-200 hover:border-gray-400'} ${hasImages ? 'w-24' : 'px-4 py-2 min-w-[60px]'}`}
                      >
                        {hasImages && thumbUrl && (
                          <div className="w-full aspect-square overflow-hidden bg-gray-100">
                            <img src={`${thumbUrl}?auto=format&fit=crop&w=200&q=80`} alt={variant.size} className="w-full h-full object-cover" />
                          </div>
                        )}
                        {!hasImages && variant.color && (
                          <div className="w-4 h-4 rounded-full border border-gray-300 mb-1" style={{ backgroundColor: variant.color }} />
                        )}
                        <div className={`text-xs font-medium text-center leading-tight ${hasImages ? 'py-1.5 px-1 w-full' : ''} ${isSelected ? 'text-pink-600' : 'text-gray-700'}`}>
                          {variant.size}
                        </div>
                        <div className={`text-xs pb-1.5 ${isSelected ? 'text-pink-500 font-semibold' : 'text-gray-500'}`}>
                          ₹{computeDiscountedPrice(variant.price, variant.discountType, variant.discountPrice).toFixed(0)}
                        </div>
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        {variant.stock === 0 && (
                          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                            <span className="text-xs text-red-500 font-medium">Sold Out</span>
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/*  Text Box — with warning */}
            {product?.isTextBox && (
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Enter Your Name <span className="text-red-500">*</span>
                </h3>
                <input
                  type="text" name="name" placeholder="Enter Your Name"
                  value={textBox} onChange={e => setTextBox(e.target.value)}
                  className={`border p-2 rounded-md w-full mt-1 outline-none focus:ring-2 ${!textBox.trim() ? 'border-red-300 focus:ring-red-300' : 'border-gray-300 focus:ring-indigo-300'}`}
                  maxLength={12}
                />
                {!textBox.trim() && (
                  <p className="text-xs text-red-500 mt-1">⚠ Name is required before adding to cart</p>
                )}
              </div>
            )}

            {/*  Image Box — upload + view + reset */}
            {product?.isImageBox && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Upload Your Photo <span className="text-red-500">*</span>
                </h3>
                <div className="flex items-center gap-3 flex-wrap">
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 flex items-center gap-2 text-sm shadow-md"
                  >
                    <BsUpload className="w-4 h-4" />
                    {previewImage ? 'Change Photo' : 'Choose Photo'}
                  </button>

                  {/*  View button — sirf upload ke baad dikhega */}
                  {previewImage && (
                    <>
                      <button type="button" onClick={() => setShowImagePreview(true)}
                        className="px-4 py-2 bg-blue-50 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center gap-2 text-sm"
                      >
                        <BiZoomIn className="w-4 h-4" />
                        View
                      </button>
                      <button type="button"
                        onClick={() => { setPreviewImage(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-600"
                      >
                        <BiRefresh className="w-4 h-4" />
                        Reset
                      </button>
                    </>
                  )}
                </div>

                {previewImage ? (
                  <div className="mt-3 flex items-center gap-2">
                    <img src={previewImage} alt="uploaded" className="w-14 h-14 rounded-lg object-cover border border-gray-200" />
                    <p className="text-xs text-green-600 font-medium">✓ Photo uploaded successfully</p>
                  </div>
                ) : (
                  <p className="text-xs text-red-500 mt-2">⚠ Photo is required before adding to cart</p>
                )}

                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
              </div>
            )}

            {/* Countdown */}
            <div className="flex justify-between items-center bg-blue-50 p-2 sm:p-4 rounded-lg">
              <div className="font-semibold text-black text-xs sm:text-base">
                Sale ends in:{' '}
                <span className="font-bold">
                  {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
              <motion.div animate={{ x: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 1 }}>
                <BiBell className="text-gray-600 text-xl" />
              </motion.div>
            </div>

            {/* CTA */}
            <div className="flex gap-2">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 bg-yellow-400 text-slate-700 py-3 px-6 rounded-md font-medium hover:bg-yellow-500 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RiShoppingBag2Line className="w-5 h-5" />
                 {product?.isCustomize
    ? 'Customize & Buy'
    : isOutOfStock
    ? 'Out of Stock'
    : 'ADD TO BAG'}
              </button>
              <button onClick={handleAddToWishlist} className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50">
                <BiHeart className="w-6 h-6" />
              </button>
            </div>

            {/* Badges */}
            <div className="py-4">
              <Image src="/img/shape/badges.png" width={400} height={50} alt="badges" className="w-[70%] max-[567px]:w-full" />
            </div>

            {/* Discount Banner */}
            <div className="p-4 border border-green-400 bg-gradient-to-t from-green-200 to-green-50 rounded-lg flex items-center space-x-3 shadow-md">
              <RiDiscountPercentFill className="text-green-600" size={32} />
              <p className="text-black font-medium max-[567px]:text-xs">
                Get ₹100 Off on prepaid orders. <br />Coupon code — <span className="font-bold">FLAT100</span>
              </p>
            </div>

            {/* Key Highlights */}
            <div className="border-t pt-4">
              <div className="w-full py-2"><span className="text-xl text-slate-900 font-medium">Key Highlights</span></div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                {keyHighlights.map((h, i) => (
                  <div key={i} className="space-y-1 border-b pb-2">
                    <p className="text-md text-gray-500">{h.label}</p>
                    <p className="text-md font-medium text-slate-700">{h.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Description Accordion */}
            <div>
              <div className="w-full cursor-pointer flex justify-between items-center py-2" onClick={() => setShowDescriptions(!showDescriptions)}>
                <div className="flex items-center gap-2">
                  <BsFileText className="text-gray-600" size={30} />
                  <div>
                    <p className="font-semibold text-black">Product Description</p>
                    <p className="text-gray-500 text-sm">Manufacture, Care and Fit</p>
                  </div>
                </div>
                <motion.div animate={{ rotate: showDescriptions ? 45 : 0 }}>
                  <BiPlus className="text-gray-600" size={20} />
                </motion.div>
              </div>
              {showDescriptions && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.3 }} className="mt-2 text-gray-700">
                  <div className="bb-details">
                    <div dangerouslySetInnerHTML={{ __html: product?.description }} className="mb-[12px] font-Poppins text-[#686e7d] leading-[28px] tracking-[0.03rem]" />
                    <ul className="list-disc pl-[20px] mb-0">
                      <li className="py-[5px] text-[15px] text-[#686e7d] font-Poppins leading-[28px] font-light">
                        <span className="inline-flex font-medium min-w-[150px]">Warranty</span>{product?.warrantyInformation?.durationMonths ? product?.warrantyInformation?.durationMonths + 'Months' : 'No'} ({product?.warrantyInformation?.warrantyType?.toUpperCase() ?? 'N/A'}){' '}
                        <span title={product?.warrantyInformation?.claimProcess} className="text-blue-600">how?</span>
                      </li>
                      <li className="py-[5px] text-[15px] text-[#686e7d] font-Poppins leading-[28px] font-light">
                        <span className="inline-flex font-medium min-w-[150px]">Shipping</span>{product?.shippingInformation?.shippingTime} ({product?.shippingInformation?.shippingMethod})
                      </li>
                      {product?.offers && product.offers.length > 0 && (
                        <li className="py-[5px] text-[15px] text-[#686e7d] font-Poppins leading-[28px] font-light">
                          <span className="inline-flex font-medium min-w-[150px]">Offers</span>{product.offers.map((o, i) => <span key={i} className="font-Poppins text-[#777] text-[14px]">{o.offerTitle} - {o.offerDescription}</span>)}
                        </li>
                      )}
                    </ul>
                    <ul className="list-disc pl-[20px] mb-0">
                      <li className="py-[5px] text-[15px] text-[#686e7d] font-Poppins leading-[28px] font-light">
                        <span className="inline-flex font-medium min-w-[150px]">Return</span>
                        {product?.returnPolicy?.returnPeriod || 'No Returns Allowed'}
                      </li>
                      <li className="py-[5px] text-[15px] text-[#686e7d] font-Poppins leading-[28px] font-light">
                        <span className="inline-flex font-medium min-w-[150px]">Services</span>Cash on Delivery available
                      </li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Reviews */}
            <div className="w-full">
              <div className="flex border-b">
                <button className={`px-4 py-2 font-semibold w-1/2 text-md max-[567px]:text-xs max-[567px]:p-0 ${activeTab === 'product' ? 'border-b-2 border-yellow-500 text-black' : 'text-gray-500'}`} onClick={() => setActiveTab('product')}>Product Reviews</button>
                <button className={`px-4 py-2 font-semibold w-1/2 text-md max-[567px]:text-xs max-[567px]:p-0 ${activeTab === 'brand' ? 'border-b-2 border-yellow-500 text-black' : 'text-gray-500'}`} onClick={() => setActiveTab('brand')}>Brand Reviews</button>
              </div>
              <div className="p-4">
                {activeTab === 'product' ? (
                  <div className="mt-4 space-y-6">
                    <p className="text-black font-medium text-md flex gap-2 max-[567px]:text-xs"><RiThumbUpFill size={20} />87% of verified buyers recommend this product.</p>
                    <div className="flex flex-col md:flex-row items-center justify-between">
                      <div className="flex flex-col items-center gap-6 md:flex-row md:items-center">
                        <div className="text-center md:text-left">
                          <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
                          <div className="flex items-center justify-center mt-1">
                            {[1, 2, 3, 4, 5].map(star => <BiStar key={star} className="w-4 h-4 text-yellow-400 fill-current" />)}
                          </div>
                          <p className="text-sm text-gray-500 mt-1 mb-4">{totalRatings} ratings</p>
                          <Link href={`/product-details/${product?.slug}/write-review`} className="border-2 border-sky-500 text-sky-600 px-4 py-2 rounded-md mt-2 font-semibold">RATE</Link>
                        </div>
                        <div className="flex-1 space-y-2 md:space-y-0 md:flex md:flex-col md:gap-2 max-[567px]:p-3">
                          {[5, 4, 3, 2, 1].map(rating => (
                            <div key={rating} className="flex items-center gap-2">
                              <span className="text-sm w-3">{rating}</span>
                              <BiStar className="w-4 h-4 text-yellow-400 fill-current" />
                              <div className="w-52 h-2 bg-gray-300 ml-2 rounded-full overflow-hidden">
                                <div className="h-2 bg-green-500" style={{ width: `${(ratingCounts[rating as 1 | 2 | 3 | 4 | 5] / totalRatings) * 100}%` }} />
                              </div>
                              <span className="text-sm text-gray-500 w-10">({ratingCounts[rating as 1 | 2 | 3 | 4 | 5]})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {product?.reviews && product.reviews.length > 0 ? (
                        product.reviews.map((review, index) => (
                          <div key={index} className="border-t pt-4">
                            <div className="reviews-bb-box flex gap-4 mb-6 max-[575px]:flex-col">

                              {/* Reviewer Image */}
                              <div className="inner-image flex-shrink-0">
                                <img
                                  src="/img/dummy-image.jpg"
                                  alt="reviewer"
                                  className="w-[50px] h-[50px] rounded-[10px] object-cover"
                                />
                              </div>

                              {/* Review Content */}
                              <div className="inner-contact flex-1">
                                <h4 className="font-quicksand text-[16px] font-bold text-[#3d4750]">
                                  {review?.userId?.displayName || 'User'}
                                </h4>

                                <div className="bb-pro-rating flex items-center mb-2">
                                  {Array(5).fill(0).map((_, i) => (
                                    <i
                                      key={i}
                                      className={`${i < (review?.rating ?? 5)
                                        ? 'ri-star-fill text-[#fea99a]'
                                        : 'ri-star-line text-[#777]'
                                        } text-[15px] mr-[3px]`}
                                    />
                                  ))}
                                </div>

                                <p className="font-Poppins text-[14px] leading-[26px] font-light text-[#686e7d]">
                                  {review.review}
                                </p>

                                {/* Review Images */}
                                {review?.images?.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-3">
                                    {review.images.map((img, i) => (
                                      <img
                                        key={i}
                                        src={img.url}
                                        alt={`review-img-${i}`}
                                        className="w-[60px] h-[60px] rounded-[10px] object-cover border"
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        dummyReviews.map(review => (
                          <div key={review.id} className="border-t pt-4">
                            <div className="flex items-center mb-2">
                              {[...Array(review.rating)].map((_, i) => <BiStar key={i} className="w-4 h-4 text-yellow-400 fill-current" />)}
                            </div>
                            <p className="text-sm mb-2">{review.comment}</p>
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <p>{review.author} — {review.date}</p>
                              <p>{review.helpful} people found this helpful</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600 mt-4">
                    PrintHutt has received positive feedback from customers for its premium quality neon signs, personalized gifts, LED lamps, and custom décor products. Many buyers appreciate the product quality, unique designs, fast delivery, and responsive customer support. Customers have especially praised the durability and finishing of personalized lamps and neon products. The brand claims over 654K+ sales and highlights features like free shipping, customization options, and secure payments. However, as with most custom-printing businesses, some online discussions suggest that experiences may vary depending on product type and expectations. Overall, PrintHutt is considered a growing custom gifting and printing brand in India with generally positive customer satisfaction.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <section className="section-related-product py-[50px] max-[1199px]:py-[35px]">
        <div className="flex flex-wrap justify-between relative items-center mx-auto min-[1400px]:max-w-[1320px] min-[1200px]:max-w-[1140px] min-[992px]:max-w-[960px] min-[768px]:max-w-[720px] min-[576px]:max-w-[540px]">
          <div className="flex flex-wrap w-full">
            <div className="w-full px-[12px]">
              <div className="section-title mb-[20px] pb-[20px] z-[5] relative flex flex-col max-[991px]:pb-[0]">
                <div className="section-detail max-[991px]:mb-[12px]">
                  <h2 className="bb-title font-quicksand mb-[0] p-[0] text-[25px] font-bold text-[#3d4750] relative inline capitalize leading-[1] tracking-[0.03rem] max-[767px]:text-[23px]">You May Also Like</h2>
                  <p className="font-Poppins max-w-[400px] mt-[10px] text-[14px] text-[#686e7d] leading-[18px] font-light tracking-[0.03rem] max-[991px]:mx-[auto]">Browse The Collection of Top Products.</p>
                </div>
              </div>
            </div>
            <div className="w-full px-[12px]">
              <div className="bb-deal-slider m-[-12px]">
                <ProductSlider products={relatedProduct} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}