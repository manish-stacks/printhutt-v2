"use client";
import { readCompressed } from '@/utils/read-image';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ThicknessOption, CheckoutData } from '@/lib/types';
import { BUTTON_VALUES_AND_PRICES, DEFAULT_IMAGE_URL } from './constants';
import { Canvas, FabricImage } from 'fabric';
import { formatCurrency } from '@/helpers/helpers';
import html2canvas from 'html2canvas';
import { get_product_by_id } from '@/_services/admin/product';
import { Product } from '@/lib/types/product';
import { useCartStore } from '@/store/useCartStore';
import { toast } from 'react-toastify';
import useCartSidebarStore from '@/store/useCartSidebarStore';
import { RiZoomInLine, RiZoomOutLine, RiFocus3Line, RiFullscreenLine, RiDragMove2Line, RiUploadCloud2Line, RiShoppingBag4Line, RiInformationLine, RiRulerLine, RiCheckLine, RiCloseLine } from 'react-icons/ri';

type Orientation = 'landscape' | 'portrait'; // visual orientation of the finished piece

/** key => (label, CSS border-radius). Keys keep the "-canvas" suffix: admin order view + shapeName use them. */
const SHAPES: { key: string; label: string; radius: string }[] = [
  { key: 'normal-canvas', label: 'Classic', radius: '0' },
  { key: 'roundEdge-canvas', label: 'Rounded', radius: '4%' },
  { key: 'extraRoundhorizontal-canvas', label: 'Soft', radius: '16%' },
  { key: 'leaf-canvas', label: 'Leaf', radius: '24% 0 24% 0' },
  { key: 'petal-canvas', label: 'Petal', radius: '0 45% 0 45% / 0 60% 0 60%' },
  { key: 'egghorizontal-canvas', label: 'Egg', radius: '41% 59% 70% 35% / 49% 55% 50% 51%' },
  { key: 'arch-canvas', label: 'Arch', radius: '50% 50% 0 0 / 65% 65% 0 0' },
  { key: 'oval-canvas', label: 'Oval', radius: '50%' },
];

const DESIGNS = [
  { key: 'frame', label: 'Frame', hint: 'Full photo, choose a shape' },
  { key: 'cutout', label: 'Cutout', hint: 'We cut around your subject' },
];

/* module-level (was re-created on every render before → children remounted) */
const Card = ({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5">
    <div className="flex items-baseline justify-between gap-2 mb-3">
      <h3 className="text-[15px] font-semibold text-white">{title}</h3>
      {note && <span className="text-xs text-white/45">{note}</span>}
    </div>
    {children}
  </div>
);

const chip = (active: boolean) =>
  `rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${active
    ? 'border-amber-400 bg-amber-400 text-[#1f1640] shadow-[0_8px_22px_-10px_rgba(251,191,36,.8)]'
    : 'border-white/15 bg-white/5 text-white/80 hover:border-amber-400/60 hover:text-white'}`;

export default function AcrylicPhoto() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const imageUrlRef = useRef<string>(DEFAULT_IMAGE_URL);
  const photoRef = useRef<FabricImage | null>(null);
  const coverScaleRef = useRef(1);
  const [zoom, setZoom] = useState(1); // 1 = fill (cover), up to 3x

  const [selectedSize, setSelectedSize] = useState(BUTTON_VALUES_AND_PRICES[0].size);
  const [selectedThickness, setSelectedThickness] = useState<ThicknessOption>(BUTTON_VALUES_AND_PRICES[0].thickness[0]);
  const [radiusValue, setRadiusValue] = useState<string>('normal-canvas');
  const [imageUrl, setImageUrl] = useState<string>(DEFAULT_IMAGE_URL);
  const [orientation, setOrientation] = useState<Orientation>('landscape');
  const [design, setDesign] = useState('frame');
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [product, setProduct] = useState<Product>();
  const [fileName, setFileName] = useState<string>('');

  const addToCart = useCartStore((s) => s.addToCart);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const cartItems = useCartStore((s) => s.items);
  const { openCartSidebarView } = useCartSidebarStore();

  const isPortrait = orientation === 'portrait';
  const [w, h] = selectedSize.split('x').map(Number);
  const dispW = isPortrait ? h : w;
  const dispH = isPortrait ? w : h;
  const hasImage = imageUrl !== DEFAULT_IMAGE_URL;
  const shape = SHAPES.find((s) => s.key === radiusValue) || SHAPES[0];
  const sizeOption = useMemo(() => BUTTON_VALUES_AND_PRICES.find((o) => o.size === selectedSize), [selectedSize]);
  const [coverMin, setCoverMin] = useState(0.3); // 'fit whole photo' ka zoom level (image load pe set hota hai)
  const edgePx = parseInt(selectedThickness.value) <= 3 ? 2 : parseInt(selectedThickness.value) <= 5 ? 4 : 6;

  useEffect(() => {
    (async () => {
      try {
        setProduct(await get_product_by_id('67bef94296ffd7574b647c40'));
      } catch {
        console.error('Error fetching product.');
      }
    })();
  }, []);

  /* photo canvas ko hamesha cover kare (khali jagah nahi) jab tak user "Fit" na chune */
  const clamp = (img: FabricImage, canvas: Canvas) => {
    const cw = canvas.width || 700, ch = canvas.height || 450;
    const iw = img.getScaledWidth(), ih = img.getScaledHeight();
    let l = img.left ?? 0, t = img.top ?? 0;
    l = iw >= cw ? Math.min(0, Math.max(cw - iw, l)) : (cw - iw) / 2;
    t = ih >= ch ? Math.min(0, Math.max(ch - ih, t)) : (ch - ih) / 2;
    img.set({ left: l, top: t });
  };

  const loadImage = useCallback(async (url: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    try {
      const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
      if (fabricCanvasRef.current !== canvas) return; // unmounted meanwhile
      const cw = canvas.width || 700;
      const ch = canvas.height || 450;
      const cover = Math.max(cw / img.width!, ch / img.height!);
      coverScaleRef.current = cover;
      setCoverMin(Math.min(1, Math.min(cw / img.width!, ch / img.height!) / cover));
      img.set({
        scaleX: cover, scaleY: cover,
        left: (cw - img.width! * cover) / 2, top: (ch - img.height! * cover) / 2,
        selectable: true, evented: true,
        hasControls: false, hasBorders: false, lockRotation: true,
        hoverCursor: 'grab', moveCursor: 'grabbing',
      });
      img.on('moving', () => { clamp(img, canvas); });
      canvas.clear();
      canvas.backgroundColor = 'white';
      canvas.add(img);
      photoRef.current = img;
      setZoom(1);
      canvas.renderAll();
    } catch (error) {
      console.error('Error loading image:', error);
    }
  }, []);

  /* zoom: canvas ke center ke around, taaki photo jump na kare */
  const applyZoom = (z: number) => {
    const canvas = fabricCanvasRef.current, img = photoRef.current;
    if (!canvas || !img) return;
    const cw = canvas.width || 700, ch = canvas.height || 450;
    const oldS = img.scaleX || 1;
    const newS = coverScaleRef.current * z;
    const cx = (cw / 2 - (img.left ?? 0)) / oldS; // canvas center in image coords
    const cy = (ch / 2 - (img.top ?? 0)) / oldS;
    img.set({ scaleX: newS, scaleY: newS, left: cw / 2 - cx * newS, top: ch / 2 - cy * newS });
    clamp(img, canvas);
    img.setCoords();
    setZoom(z);
    canvas.requestRenderAll();
  };

  const fitWhole = () => {
    const canvas = fabricCanvasRef.current, img = photoRef.current;
    if (!canvas || !img) return;
    const s = Math.min((canvas.width || 700) / img.width!, (canvas.height || 450) / img.height!);
    img.set({ scaleX: s, scaleY: s });
    clamp(img, canvas);
    img.setCoords();
    setZoom(s / coverScaleRef.current);
    canvas.requestRenderAll();
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const c = new Canvas(canvasRef.current, { width: 700, height: 450, backgroundColor: 'white', selection: false });
    fabricCanvasRef.current = c;
    loadImage(DEFAULT_IMAGE_URL);
    return () => { fabricCanvasRef.current = null; c.dispose(); };
  }, [loadImage]);

  const applyFile = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please choose an image file'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10MB'); return; }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      imageUrlRef.current = result;
      setImageUrl(result);
      loadImage(result);
    };
    readCompressed(reader, file);
  };

  const clearImage = () => {
    setFileName('');
    imageUrlRef.current = DEFAULT_IMAGE_URL;
    setImageUrl(DEFAULT_IMAGE_URL);
    if (fileInputRef.current) fileInputRef.current.value = '';
    loadImage(DEFAULT_IMAGE_URL);
  };

  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    const opt = BUTTON_VALUES_AND_PRICES.find((o) => o.size === size);
    if (opt) {
      // same thickness rakho agar naye size me available hai
      setSelectedThickness(opt.thickness.find((t) => t.value === selectedThickness.value) || opt.thickness[0]);
    }
  };

  const handleOrientationChange = (o: Orientation) => {
    if (o === orientation) return;
    setOrientation(o);
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    canvas.setDimensions({ width: o === 'portrait' ? 450 : 700, height: o === 'portrait' ? 700 : 450 });
    loadImage(imageUrlRef.current);
  };

  const handleDesignChange = (d: string) => {
    setDesign(d);
    if (d !== 'frame') setRadiusValue('normal-canvas');
  };

  const handleCanvasAction = async () => {
    const el = captureRef.current;
    if (!el) return;
    try {
      fabricCanvasRef.current?.discardActiveObject();
      fabricCanvasRef.current?.requestRenderAll();
      await new Promise((r) => setTimeout(r, 100));
      const shot = await html2canvas(el, { useCORS: true, allowTaint: true, backgroundColor: null, scale: 2, logging: false });
      return shot.toDataURL('image/png');
    } catch (error) {
      console.error('Error during capture:', error);
    }
  };

  const handleAddToCart = async () => {
    if (!product) { toast.error('Product is still loading, please try again in a moment.'); return; }
    if (!hasImage) { toast.error('Please upload an image'); return; }
    try {
      setIsAddingToCart(true);
      const previewCanvas = await handleCanvasAction();
      if (!previewCanvas) { toast.error('Could not create preview, please try again'); return; }
      const custom_data: CheckoutData = {
        previewCanvas,
        previewImage: imageUrl,
        imageUrl,
        radiusValue,
        shapeName: radiusValue.split('-')[0],
        variant: isPortrait ? selectedSize.split('x').reverse().join('x') : selectedSize,
        sizeThickness: selectedThickness.value,
        price: selectedThickness.price,
        frameDesign: design,
        orientation, // visual orientation (same values as before)
      };
      const updatedProduct = {
        ...product,
        thumbnail: { ...product.thumbnail, url: previewCanvas },
        price: product.discountType === 'percentage'
          ? selectedThickness.price / ((100 - product.discountPrice) / 100)
          : selectedThickness.price + product.discountPrice,
        custom_data,
      };
      if (cartItems.find((item) => item._id === product._id)) removeFromCart(product._id);
      addToCart(updatedProduct, 1);
      openCartSidebarView();
    } catch (error) {
      console.error('Error while adding to cart:', error);
      toast.error('Something went wrong, please try again');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const CtaButton = ({ className = '' }: { className?: string }) => (
    <button
      onClick={handleAddToCart}
      disabled={isAddingToCart}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-6 py-3 text-[15px] font-bold text-[#1f1640] shadow-[0_12px_28px_-10px_rgba(245,158,11,.75)] transition hover:brightness-105 ${className}`}
    >
      <RiShoppingBag4Line className="h-5 w-5" />
      {isAddingToCart ? 'Preparing preview…' : hasImage ? 'Add to Cart' : 'Upload photo to continue'}
    </button>
  );

  return (
    <section className="min-h-screen pb-28 pt-8 lg:pb-16 lg:pt-12 text-white">
      {/* fabric wrapper ko responsive banata hai (700px fixed nahi) */}
      <style>{`
        .acr-stage .canvas-container, .acr-stage canvas { width:100% !important; height:100% !important; display:block; }
        .acr-wall { background: radial-gradient(120% 90% at 50% 0%, #2c2360 0%, #1a1440 60%, #120e30 100%); }
      `}</style>

      <div className="mx-auto max-w-6xl px-4">
        <header className="mb-6 lg:mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Acrylic Photo Frame</h1>
          <p className="mt-1.5 max-w-xl text-sm text-white/60">Upload a photo, pick a shape and size. What you see below is what we print.</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-8">
          {/* ───── PREVIEW (sticky on desktop) ───── */}
          <div className="lg:sticky lg:top-[150px] self-start">
            <div className="acr-wall relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-3xl border border-white/10 p-6 sm:min-h-[440px] sm:p-10">
              <div
                className="relative"
                style={{
                  width: isPortrait ? 'min(100%, 300px)' : 'min(100%, 520px)',
                  aspectRatio: isPortrait ? '450 / 700' : '700 / 450',
                  transition: 'width .3s ease',
                }}
              >
                {/* outer: shadow + acrylic edge + gloss (NOT captured for cart thumbnail) */}
                <div
                  className="absolute inset-0"
                  style={{
                    borderRadius: shape.radius,
                    boxShadow: `0 0 0 ${edgePx}px rgba(255,255,255,.55), 0 30px 50px -18px rgba(0,0,0,.75), 0 10px 18px rgba(0,0,0,.35)`,
                    transition: 'border-radius .3s ease, box-shadow .3s ease',
                  }}
                />
                {/* inner: captured by html2canvas */}
                <div
                  id="acrylic-capture"
                  ref={captureRef}
                  className="acr-stage absolute inset-0 overflow-hidden bg-white"
                  style={{ borderRadius: shape.radius, transition: 'border-radius .3s ease' }}
                >
                  <canvas ref={canvasRef} width={700} height={450} />
                </div>
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{ borderRadius: shape.radius, background: 'linear-gradient(115deg, rgba(255,255,255,.28) 0%, rgba(255,255,255,0) 38%, rgba(255,255,255,0) 70%, rgba(255,255,255,.12) 100%)' }}
                />
                {!hasImage && (
                  <div className="absolute inset-x-0 -bottom-9 text-center text-xs text-white/50">Sample preview — upload your photo</div>
                )}
              </div>
            </div>

            {hasImage && (
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 sm:p-4">
                <p className="mb-2 flex items-center gap-1.5 text-xs text-white/55">
                  <RiDragMove2Line className="text-amber-400" /> Drag the photo to reposition · use the slider to zoom
                </p>
                <div className="flex items-center gap-3">
                  <button type="button" aria-label="Zoom out" onClick={() => applyZoom(Math.max(coverMin, +(zoom - 0.1).toFixed(2)))} className="rounded-lg p-2 text-white/70 hover:bg-white/10"><RiZoomOutLine size={20} /></button>
                  <input
                    type="range" min={coverMin} max={3} step={0.01} value={zoom}
                    onChange={(e) => applyZoom(parseFloat(e.target.value))}
                    aria-label="Zoom"
                    className="h-1.5 flex-1 cursor-pointer accent-amber-400"
                  />
                  <button type="button" aria-label="Zoom in" onClick={() => applyZoom(Math.min(3, +(zoom + 0.1).toFixed(2)))} className="rounded-lg p-2 text-white/70 hover:bg-white/10"><RiZoomInLine size={20} /></button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" onClick={() => applyZoom(1)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:border-amber-400/60"><RiFocus3Line /> Fill &amp; center</button>
                  <button type="button" onClick={fitWhole} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:border-amber-400/60"><RiFullscreenLine /> Fit whole photo</button>
                </div>
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/80">
                <RiRulerLine className="text-amber-400" />
                {dispW}″ W × {dispH}″ H · {selectedThickness.value}
              </span>
              <a
                className="text-white/60 underline decoration-white/30 underline-offset-4 hover:text-amber-300"
                target="_blank" rel="noopener noreferrer"
                href="https://s3.ap-south-1.amazonaws.com/printhutt.dev.bucket/others/size-chart-new_optimized_tns7y8_yujbed.webp"
              >
                Size guide
              </a>
            </div>
          </div>

          {/* ───── OPTIONS ───── */}
          <div className="space-y-4">
            <Card title="Your photo">
              <label
                htmlFor="acrylic-file-input"
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); applyFile(e.dataTransfer.files?.[0]); }}
                className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed p-4 transition ${isDragging ? 'border-amber-400 bg-amber-400/10' : 'border-white/20 hover:border-amber-400/70 hover:bg-white/5'}`}
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-400">
                  {hasImage ? <RiCheckLine size={26} /> : <RiUploadCloud2Line size={26} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{fileName || 'Click to upload or drag & drop'}</span>
                  <span className="block text-xs text-white/50">PNG, JPEG, JPG · Max 10MB</span>
                </span>
                {hasImage && (
                  <button type="button" aria-label="Remove photo" onClick={(e) => { e.preventDefault(); clearImage(); }} className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white">
                    <RiCloseLine size={18} />
                  </button>
                )}
                <input id="acrylic-file-input" type="file" ref={fileInputRef} onChange={(e) => applyFile(e.target.files?.[0])} accept="image/png,image/jpeg,image/jpg" className="hidden" />
              </label>
              <p className="mt-3 flex items-start gap-2 text-xs text-white/50">
                <RiInformationLine className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                Use a high-resolution image for the best print. Our designers fine-tune the design before printing.
              </p>
            </Card>

            <Card title="Design">
              <div className="grid grid-cols-2 gap-2">
                {DESIGNS.map((d) => (
                  <button key={d.key} onClick={() => handleDesignChange(d.key)} className={`${chip(design === d.key)} text-left`}>
                    <span className="block">{d.label}</span>
                    <span className={`block text-[11px] font-normal ${design === d.key ? 'text-[#1f1640]/70' : 'text-white/45'}`}>{d.hint}</span>
                  </button>
                ))}
              </div>
            </Card>

            {design === 'frame' && (
              <Card title="Shape" note={shape.label}>
                <div className="grid grid-cols-4 gap-2">
                  {SHAPES.map((s) => {
                    const active = radiusValue === s.key;
                    return (
                      <button
                        key={s.key}
                        onClick={() => setRadiusValue(s.key)}
                        aria-label={s.label}
                        aria-pressed={active}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border px-1 py-2.5 transition ${active ? 'border-amber-400 bg-amber-400/10' : 'border-white/10 bg-white/5 hover:border-white/30'}`}
                      >
                        <span className={`block h-8 w-11 ${active ? 'bg-amber-400' : 'bg-white/40'}`} style={{ borderRadius: s.radius }} />
                        <span className={`text-[11px] ${active ? 'font-semibold text-amber-300' : 'text-white/60'}`}>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </Card>
            )}

            <Card title="Orientation">
              <div className="grid grid-cols-2 gap-2">
                {(['landscape', 'portrait'] as Orientation[]).map((o) => (
                  <button key={o} onClick={() => handleOrientationChange(o)} className={`${chip(orientation === o)} flex items-center justify-center gap-2 capitalize`}>
                    <span className={`block border-2 ${o === 'landscape' ? 'h-3 w-5' : 'h-5 w-3'} ${orientation === o ? 'border-[#1f1640]' : 'border-white/60'} rounded-[3px]`} />
                    {o}
                  </button>
                ))}
              </div>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card title="Size" note="inches">
                <div className="flex flex-wrap gap-2">
                  {BUTTON_VALUES_AND_PRICES.map((o) => (
                    <button key={o.size} onClick={() => handleSizeChange(o.size)} className={chip(selectedSize === o.size)}>{o.size}</button>
                  ))}
                </div>
              </Card>
              <Card title="Thickness" note="mm">
                <div className="flex flex-wrap gap-2">
                  {sizeOption?.thickness.map((t) => (
                    <button key={t.value} onClick={() => setSelectedThickness(t)} className={chip(selectedThickness.value === t.value)}>{t.value}</button>
                  ))}
                </div>
              </Card>
            </div>

            {/* Desktop price bar */}
            <div className="hidden items-center justify-between gap-4 rounded-2xl border border-amber-400/25 bg-gradient-to-br from-[#241B4F] to-[#1a1440] p-5 lg:flex">
              <div>
                <p className="text-xs text-white/50">Total price</p>
                <p className="text-3xl font-extrabold text-amber-400">{formatCurrency(selectedThickness.price)}</p>
                <p className="mt-0.5 text-xs capitalize text-white/45">{selectedSize} · {selectedThickness.value} · {design} · {orientation}</p>
              </div>
              <CtaButton className="min-w-[210px]" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile / tablet sticky buy bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#15112e]/95 px-4 pt-3 backdrop-blur lg:hidden" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-2xl font-extrabold leading-none text-amber-400">{formatCurrency(selectedThickness.price)}</p>
            <p className="mt-1 truncate text-[11px] capitalize text-white/50">{selectedSize} · {selectedThickness.value} · {orientation}</p>
          </div>
          <CtaButton className="shrink-0 px-5" />
        </div>
      </div>
    </section>
  );
}
