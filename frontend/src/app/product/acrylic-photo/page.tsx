"use client";
import React, { useEffect, useRef, useState } from 'react';
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
import { RiUploadCloud2Line, RiImageLine, RiShoppingCart2Line, RiInformationLine } from 'react-icons/ri';

export default function AcrylicPhoto() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const [selectedSize, setSelectedSize] = useState(BUTTON_VALUES_AND_PRICES[0].size);
  const [selectedThickness, setSelectedThickness] = useState(BUTTON_VALUES_AND_PRICES[0].thickness[0]);
  const [radiusValue, setRadiusValue] = useState<string>('normal-canvas');
  const [imageUrl, setImageUrl] = useState<string>(DEFAULT_IMAGE_URL);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [product, setProduct] = useState<Product>();
  const [fileName, setFileName] = useState<string>(''); // for nicer upload UI feedback
  const addToCart = useCartStore(state => state.addToCart);
  const removeFromCart = useCartStore(state => state.removeFromCart);
  const existingCartState = useCartStore();
  const { openCartSidebarView } = useCartSidebarStore();
  const [design, setDesign] = useState('frame');
  const [isShape, setIsShape] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const fetchedProduct = await get_product_by_id("67bef94296ffd7574b647c40");
        setProduct(fetchedProduct);
      } catch {
        console.error("Error fetching product.");
      }
    })();
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      fabricCanvasRef.current = initCanvas(canvasRef.current);
      loadImage(DEFAULT_IMAGE_URL);
    }
    return () => {
      fabricCanvasRef.current?.dispose();
    };
  }, []);

  const initCanvas = (canvasElement: HTMLCanvasElement) => {
    return new Canvas(canvasElement, {
      width: 700,
      height: 450,
      backgroundColor: 'white'
    });
  };

  const loadImage = async (url: string) => {
    if (!fabricCanvasRef.current) return;
    try {
      const img = await FabricImage.fromURL(url, { crossOrigin: 'Anonymous' });
      const canvas = fabricCanvasRef.current;
      const canvasWidth = canvas.width || 700;
      const canvasHeight = canvas.height || 450;

      const scaleX = canvasWidth / img.width!;
      const scaleY = canvasHeight / img.height!;
      const scale = Math.min(scaleX, scaleY);

      img.set({
        scaleX: scale,
        scaleY: scale,
        left: (canvasWidth - img.width! * scale) / 2,
        top: (canvasHeight - img.height! * scale) / 2,
      });

      canvas.clear();
      canvas.add(img);
      canvas.renderAll();
    } catch (error) {
      console.error("Error loading image:", error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      loadImage(DEFAULT_IMAGE_URL);
      setFileName('');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImageUrl(result);
      loadImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    const sizeOption = BUTTON_VALUES_AND_PRICES.find(option => option.size === size);
    if (sizeOption) {
      setSelectedThickness(sizeOption.thickness[0]);
    }
  };

  const handleOrientationChange = (newOrientation: 'portrait' | 'landscape') => {
    setOrientation(newOrientation);
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    const currentWidth = canvas.width || 700;
    const currentHeight = canvas.height || 450;

    canvas.setWidth(newOrientation === 'landscape' ? currentHeight : 700);
    canvas.setHeight(newOrientation === 'landscape' ? currentWidth : 450);

    const shadowBox = document.querySelector('.shadow-box');
    if (shadowBox) {
      shadowBox.classList.toggle('landscape', newOrientation === 'landscape');
    }

    loadImage(imageUrl);

    const [width, height] = selectedSize.split('x').map(Number);
    const widthElement = document.getElementById('width_val');
    const heightElement = document.getElementById('height_val');

    if (widthElement && heightElement) {
      if (newOrientation === 'landscape') {
        widthElement.textContent = height.toString();
        heightElement.textContent = width.toString();
      } else {
        widthElement.textContent = width.toString();
        heightElement.textContent = height.toString();
      }
    }
  };

  const handleThicknessChange = (thickness: ThicknessOption) => {
    setSelectedThickness(thickness);
  };

  const handleRadiusChange = (radius: string) => {
    setRadiusValue(radius);
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;
    canvasElement.className = '';
    canvasElement.classList.add(radius);
  };

  const [width, height] = selectedSize.split('x').map(Number);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setImageUrl(result);
          loadImage(result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleCanvasAction = async () => {
    try {
      const previewElement = document.getElementById('preview-section');
      if (!previewElement) {
        console.error('Preview section not found');
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      const canvas = await html2canvas(previewElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: 2,
        logging: false,
        onclone: (clonedDoc) => {
          const clonedCanvas = clonedDoc.querySelector('canvas');
          const originalCanvas = canvasRef.current;
          if (clonedCanvas && originalCanvas) {
            const context = clonedCanvas.getContext('2d');
            if (context) {
              context.drawImage(originalCanvas, 0, 0);
            }
          }
        }
      });

      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = canvas.width;
      finalCanvas.height = canvas.height;
      const ctx = finalCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(canvas, 0, 0);
        return finalCanvas.toDataURL('image/png');
      }
    } catch (error) {
      console.error('Error during download:', error);
    }
  };

  const handleDesignChange = (design: string) => {
    setDesign(design);
    if (design === 'frame') {
      setIsShape(true);
    } else {
      setIsShape(false);
      setRadiusValue('normal-canvas');
      const canvasElement = canvasRef.current;
      if (!canvasElement) return;
      canvasElement.className = '';
      canvasElement.classList.add('normal-canvas');
    }
  };

  const handleAddToCart = async () => {
    if (imageUrl === DEFAULT_IMAGE_URL) {
      toast.error('Please upload an image');
      return;
    }
    try {
      setIsAddingToCart(true);
      const previewCanvas = await handleCanvasAction();
      if (previewCanvas && product) {
        const custom_data: CheckoutData = {
          previewCanvas,
          previewImage: imageUrl,
          radiusValue: radiusValue,
          shapeName: radiusValue.split('-')[0],
          variant: orientation === 'landscape' ? selectedSize.split('x').reverse().join('x') : selectedSize,
          sizeThickness: selectedThickness.value,
          price: selectedThickness.price,
          frameDesign: design,
          orientation: orientation === 'landscape' ? 'portrait' : 'landscape',
        };

        const updatedProduct = {
          ...product,
          thumbnail: { ...product.thumbnail, url: previewCanvas },
          price: product.discountType === "percentage"
            ? (selectedThickness.price / ((100 - product.discountPrice) / 100))
            : (selectedThickness.price + product.discountPrice),
          custom_data,
        };

        const existingItem = existingCartState.items.find(
          (item) => item._id === product._id
        );
        if (existingItem) {
          removeFromCart(product._id);
        }

        addToCart(updatedProduct, 1);
        openCartSidebarView();
        return;
      }
    } catch (error) {
      console.error("Error while adding to cart:", error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  /* ── Reusable card section ── */
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
      <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );

  return (
    <section className="py-[40px] md:py-[60px] bg-gray-50 min-h-screen">
      <div className="mx-auto min-[1400px]:max-w-[1320px] min-[1200px]:max-w-[1140px] min-[992px]:max-w-[960px] min-[768px]:max-w-[720px] min-[576px]:max-w-[540px] px-[12px]">

        {/* HEADER */}
        <div className="text-center mb-[30px] md:mb-[40px]">
          <h1 className="text-[24px] md:text-[32px] font-bold text-gray-900 tracking-tight">
            Acrylic Photo Frame
          </h1>
          <p className="mt-2 text-sm md:text-base text-gray-500 max-w-[480px] mx-auto">
            Customize your perfect photo frame — choose size, shape, and orientation
          </p>
        </div>

        {/* PREVIEW CARD */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-8 mb-6">
          <div className="flex justify-center">
            <div id="canvasContainer" className="relative">
              <div
                className={`shadow-box ${radiusValue} ${orientation === 'landscape' ? 'landscape' : ''}`}
                id="preview-section"
              >
                <canvas ref={canvasRef} width={700} height={450} className="w-full h-full"></canvas>
              </div>

              <div id="width" className="absolute bg-black/80 text-white text-center text-xs px-2 py-0.5 rounded w-28">
                <span id="width_val">{orientation === 'landscape' ? height : width}</span> inch Width
              </div>

              <div id="height" className="absolute bg-black/80 text-white text-xs px-2 py-0.5 rounded transform -rotate-90">
                <span id="height_val">{orientation === 'landscape' ? width : height}</span> inch Height
              </div>

              {/* SHAPE PICKER */}
              <div className="flex flex-col gap-2">
                {isShape && (
                  <div id="cpanel-shape" className="cpanel-share">
                    <div id="availableShape">
                      <svg
                        onClick={() => handleRadiusChange('normal-canvas')}
                        viewBox="0 0 600 400"
                        width={600}
                        height={400}
                        className={`normal ${radiusValue === 'normal-canvas' ? 'activeshape' : ''}`}
                      >
                        <path d="M 0,0 L 600,0 L 600,400 L 0,400 Z" fill="#DD037C" />
                      </svg>
                      <svg
                        onClick={() => handleRadiusChange('roundEdge-canvas')}
                        viewBox="70 100 660 460"
                        width={660}
                        height={460}
                        className={`RoundEdge ${radiusValue === 'roundEdge-canvas' ? 'activeshape' : ''}`}
                      >
                        <path
                          d="M 100 100 h 600 a 30 30 0 0 1 30 30 v 400 a 30 30 0 0 1 -30 30 h -600 a 30 30 0 0 1 -30 -30 v -400 a 30 30 0 0 1 30 -30 z"
                          fill="#DD037C"
                        />
                      </svg>
                      <svg
                        onClick={() => handleRadiusChange('leaf-canvas')}
                        viewBox="-0.021657049655914307 -12000 12000.021484375 12000.001953125"
                        width="12000.021484375"
                        height="12000.001953125"
                        className={`Leaf ${radiusValue === 'leaf-canvas' ? 'activeshape' : ''}`}
                      >
                        <path
                          d="M 11995.6 -4370 c -26.8 440 -98 813.2 -231.6 1214 c -130.4 392 -307.2 752.8 -537.6 1097.2 c -179.6 269.2 -344.8 470 -580 705.2 c -128.4 128 -191.2 186 -308.4 283.6 c -412.8 344.4 -887.6 617.6 -1387.6 797.6 c -371.2 134 -761.2 220.4 -1156.4 256.4 c -184.4 16.4 -35.6 16 -4016.8 16 l -3777.2 -0 l 0 -3777.2 c 0 -4122.4 -1.6 -3839.2 22.4 -4070.8 c 49.2 -482.8 174.4 -954 372 -1400 c 36.4 -82 140.4 -290.4 183.6 -368 c 400.8 -716.8 974.8 -1309.6 1676 -1730 c 424.8 -254.8 881.6 -437.2 1366 -545.2 c 223.6 -50 393.6 -75.2 688 -101.6 c 41.6 -3.6 932.4 -5.2 3873.2 -6 l 3818.8 -1.2 l -0.4 3788.8 c -0.4 2084 -2 3812.4 -4 3841.2 z"
                          fill="#DD037C"
                        />
                      </svg>
                      <svg
                        onClick={() => handleRadiusChange('egghorizontal-canvas')}
                        viewBox="-490 71.9000015258789 490 346.20001220703125"
                        width={490}
                        height="346.20001220703125"
                        className={`Egghorizontal ${radiusValue === 'egghorizontal-canvas' ? 'activeshape' : ''}`}
                      >
                        <path
                          d="M -302.6 418.1 C -437.9 418.1 -490 340.7 -490 245 S -437.9 71.9 -302.6 71.9 S 0 149.3 0 245 S -167.2 418.1 -302.6 418.1 z"
                          fill="#DD037C"
                        />
                      </svg>
                      <svg
                        onClick={() => handleRadiusChange('extraRoundhorizontal-canvas')}
                        viewBox="-2754.613037109375 11.048904418945312 2745.621826171875 1800.828125"
                        width="2745.621826171875"
                        height="1800.828125"
                        className={`ExtraRoundhorizontal ${radiusValue === 'extraRoundhorizontal-canvas' ? 'activeshape' : ''}`}
                      >
                        <path
                          d="M -2750 615 c 8 -133 31 -211 91 -311 c 49 -81 162 -183 251 -227 c 141 -68 135 -68 1063 -65 c 828 3 830 3 895 25 c 218 75 380 256 424 475 c 22 108 23 700 1 803 c -48 228 -234 423 -460 480 c -89 23 -1698 22 -1794 0 c -216 -51 -399 -231 -455 -448 c -17 -65 -27 -545 -16 -732 z"
                          fill="#DD037C"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              <a
                className="sizeguide"
                target="_blank"
                href="https://s3.ap-south-1.amazonaws.com/printhutt.dev.bucket/others/size-chart-new_optimized_tns7y8_yujbed.webp"
              >
                Size guide?
              </a>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">

          {/* UPLOAD CARD */}
          <div className="lg:col-span-2">
            <Section title="Upload Your Image">
              <div className="flex items-start gap-2 text-xs text-emerald-600 mb-3 bg-emerald-50 border border-emerald-100 rounded-lg p-2.5">
                <RiInformationLine className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Upload high-resolution image for best printing quality. Our designers will refine the design to your satisfaction.
                </span>
              </div>

              <label
                htmlFor="acrylic-file-input"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition"
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <RiUploadCloud2Line className="w-10 h-10 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {fileName ? (
                        <span className="flex items-center gap-1 text-blue-600">
                          <RiImageLine /> {fileName}
                        </span>
                      ) : (
                        'Click to upload or drag and drop'
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPEG, JPG · Max 10MB
                    </p>
                  </div>
                </div>
                <input
                  id="acrylic-file-input"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png,image/jpeg,image/jpg"
                  className="hidden"
                />
              </label>
            </Section>
          </div>

          {/* DESIGN + ORIENTATION (left column) */}
          <div className="space-y-5 md:space-y-6">

            {/* Design */}
            <Section title="Select Design">
              <div className="flex gap-2">
                {[
                  { key: 'frame', label: 'Frame' },
                  { key: 'cutout', label: 'Cutout' },
                ].map((opt) => {
                  const active = design === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => handleDesignChange(opt.key)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition active:scale-[0.98] ${active
                        ? 'bg-blue-500 text-white shadow-md shadow-blue-200'
                        : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50'
                        }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </Section>

            {/* Orientation */}
            <Section title="Select Orientation">
              <div className="flex gap-2">
                {[
                  { key: 'portrait' as const, label: 'Landscape' },
                  { key: 'landscape' as const, label: 'Portrait' },
                ].map((opt) => {
                  const active = orientation === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => handleOrientationChange(opt.key)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition active:scale-[0.98] ${active
                        ? 'bg-green-500 text-white shadow-md shadow-green-200'
                        : 'bg-white text-green-600 border border-green-200 hover:bg-green-50'
                        }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </Section>
          </div>

          {/* SIZE + THICKNESS (right column) */}
          <div className="space-y-5 md:space-y-6">

            {/* Sizes */}
            <Section title="Sizes (inches)">
              <div className="flex flex-wrap gap-2">
                {BUTTON_VALUES_AND_PRICES.map((option) => {
                  const active = selectedSize === option.size;
                  return (
                    <button
                      key={option.size}
                      onClick={() => handleSizeChange(option.size)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition active:scale-[0.98] ${active
                        ? 'bg-purple-500 text-white shadow-md shadow-purple-200'
                        : 'bg-white text-purple-600 border border-purple-200 hover:bg-purple-50'
                        }`}
                    >
                      {option.size}
                    </button>
                  );
                })}
              </div>
            </Section>

            {/* Thickness */}
            <Section title="Thickness (mm)">
              <div className="flex flex-wrap gap-2">
                {BUTTON_VALUES_AND_PRICES.find((option) => option.size === selectedSize)?.thickness.map((thickness) => {
                  const active = selectedThickness.value === thickness.value;
                  return (
                    <button
                      key={thickness.value}
                      onClick={() => handleThicknessChange(thickness)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition active:scale-[0.98] ${active
                        ? 'bg-red-500 text-white shadow-md shadow-red-200'
                        : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'
                        }`}
                    >
                      {thickness.value}
                    </button>
                  );
                })}
              </div>
            </Section>
          </div>
        </div>

        {/* STICKY PRICE / BUY BUTTON */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-gray-500">Total Price</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900">
              {formatCurrency(selectedThickness.price)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {selectedSize} · {selectedThickness.value} · {design} · {orientation === 'landscape' ? 'Portrait' : 'Landscape'}
            </p>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            className={`flex items-center gap-2 font-semibold py-3 px-6 md:px-8 rounded-xl text-sm md:text-base shadow-lg transition active:scale-[0.98] ${isAddingToCart
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-200'
              }`}
          >
            <RiShoppingCart2Line className="w-5 h-5" />
            {isAddingToCart ? 'Adding to Cart...' : 'Buy Now'}
          </button>
        </div>

      </div>
    </section>
  );
}