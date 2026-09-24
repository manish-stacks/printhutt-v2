"use client"
import { get_product_by_id } from '@/_services/admin/product';
import React, { useState, useRef, useEffect } from 'react';
import { BiRefresh, BiUpload } from 'react-icons/bi';
import { BsUpload } from 'react-icons/bs';
import { RiShoppingBag2Line } from 'react-icons/ri';
import useCartSidebarStore from '@/store/useCartSidebarStore';
import { useCartStore } from '@/store/useCartStore';
import { toast } from 'react-toastify';
import { formatCurrency } from '@/helpers/helpers';
// Add toast import - you'll need to install react-hot-toast or similar




export default function App() {
  const [previewImage, setPreviewImage] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('');
  const fileInputRef = useRef(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [product, setProduct] = useState(null);
  const [activeVarient, setActiveVarient] = useState<string>('0');
  const [varientSize, setVarientSize] = useState<string>('default'); // Added missing state
  const { openCartSidebarView } = useCartSidebarStore();
  const addToCart = useCartStore(state => state.addToCart);

  useEffect(() => {
    (async () => {
      try {
        const fetchedProduct = await get_product_by_id('68832f5e76edc677c1de112c');
        setProduct(fetchedProduct);
        setActiveVarient(fetchedProduct?.varient[0]?._id || '0');
        setVarientSize(fetchedProduct?.varient[0]?.size || 'default'); // Initialize variant size
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    })();
  }, []);

  const festivalLabels = [
    { value: 'rakhsha', label: 'Raksha Bandhan', preview: '🏵️', url: 'https://s3.ap-south-1.amazonaws.com/printhutt.dev.bucket/others/rakshi-png.png' }
  ];

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onchangeVarient = (id: string) => {
    setActiveVarient(id);
    const varient = product?.varient.find(item => item._id === id);
    if (varient) {
      // Create a new product object instead of mutating the existing one
      setProduct(prevProduct => ({
        ...prevProduct,
        price: varient.price || 0
      }));
      setVarientSize(varient.size || 'default');
    }
  }

  const handleAddToCart = async () => {
    if (!previewImage) {
      toast.error('Please upload a preview image.');
      return;
    }

    if (!product) {
      toast.error('Product not loaded. Please try again.');
      return;
    }

    try {
      setIsAddingToCart(true);
      
      const custom_data = {
        previewImage,
        price: product.price,
        selectedLabel: selectedLabel,
        variant: (varientSize === 'default' ? product?.varient[0]?.size : varientSize) + ` (${selectedLabel})`,
      };

      const updatedProduct = {
        ...product,
        thumbnail: { ...product.thumbnail, url: previewImage },
        custom_data,
      };

      // console.log(updatedProduct);
      // Add to cart first
      addToCart(updatedProduct, 1);
      
      // Then open sidebar
      openCartSidebarView();

      // Show success message
      toast.success('Product added to cart successfully!');

    } catch (error) {
      console.error("Error while adding to cart:", error);
      toast.error('Failed to add product to cart. Please try again.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Fix the price calculation logic
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
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url("https://s3.ap-south-1.amazonaws.com/printhutt.dev.bucket/others/photo-1506744038136-46273834b3fb_hq8v7q_xgcbbw.avif")',
      }}
    >
      <div className="min-h-screen bg-black/40 backdrop-blur-sm py-6 sm:py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-script text-white text-center mb-6 sm:mb-8 px-2">
            Acrylic Photo Puzzles
          </h1>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto">
            {/* Preview Section */}
            <div className="relative">
              <div id="preview-section" className="relative md:sticky top-0 bg-black/80 rounded-lg p-4 backdrop-blur-sm border border-white/10">
                {/* Upload Label */}
                <div className="text-center mb-4">
                  <h3 className="text-white text-lg font-semibold mb-2">Preview Your Puzzle</h3>
                  {selectedLabel && (
                    <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 rounded-full px-3 py-1">
                      <span className="text-lg">{festivalLabels.find(l => l.value === selectedLabel)?.preview}</span>
                      <span className="text-amber-200 text-sm font-medium">
                        {festivalLabels.find(l => l.value === selectedLabel)?.label} Theme
                      </span>
                    </div>
                  )}
                </div>

                {/* Square Preview Container */}
                <div className="aspect-square rounded-lg overflow-hidden flex items-center justify-center bg-white/90 border-2 border-dashed border-amber-500/50 relative">
                  {previewImage ? (
                    <div className="w-full h-full relative">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      {/* Puzzle overlay effect */}
                      {/* <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent pointer-events-none"></div> */}

                      {/* Festival Label Overlay */}
                      {selectedLabel && (
                        <div className="absolute top-0 right-0 rounded-full text-sm font-semibold  flex items-center gap-1">
                          <img src={festivalLabels.find(l => l.value === selectedLabel)?.url} alt="Festival Label" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-amber-500/70">
                      <BiUpload className="w-16 h-16 mb-4" />
                      <p className="text-sm">Upload your photo to see preview</p>

                      {/* Festival Label Overlay */}
                      {selectedLabel && (
                        <div className="absolute top-0 right-0 rounded-full text-sm font-semibold flex items-center gap-1">
                          <img src={festivalLabels.find(l => l.value === selectedLabel)?.url} alt="Festival Label" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Customization Section */}
            <div className="bg-white/95 backdrop-blur-sm rounded-lg p-5 sm:p-8 shadow-xl">
              <div className="space-y-6">
                {/* Size Selection */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Choose Size</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {product?.varient?.map((v, index) => (
                      <button
                        key={index}
                        onClick={() => onchangeVarient(v?._id)}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${activeVarient === v?._id
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-gray-200 hover:border-amber-300'
                          }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-gray-800">{v?.size}</p>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 ${activeVarient === v?._id
                            ? 'border-amber-500 bg-amber-500'
                            : 'border-gray-300'
                            }`}></div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Festival Label Selection */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Choose Festival Theme (Optional)</h3>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    <button
                      onClick={() => setSelectedLabel('')}
                      className={`p-3 border-2 rounded-lg text-left transition-all ${selectedLabel === ''
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 hover:border-amber-300'
                        }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-800">No Theme</p>
                        </div>
                        <div className={`w-3 h-3 rounded-full border-2 ${selectedLabel === ''
                          ? 'border-amber-500 bg-amber-500'
                          : 'border-gray-300'
                          }`}></div>
                      </div>
                    </button>
                    {festivalLabels.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSelectedLabel(option.value)}
                        className={`p-3 border-2 rounded-lg text-left transition-all ${selectedLabel === option.value
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-gray-200 hover:border-amber-300'
                          }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{option.preview}</span>
                            <p className="font-medium text-gray-800 text-sm">{option.label}</p>
                          </div>
                          <div className={`w-3 h-3 rounded-full border-2 ${selectedLabel === option.value
                            ? 'border-amber-500 bg-amber-500'
                            : 'border-gray-300'
                            }`}></div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload Section */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Upload Your Photo</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-colors flex items-center gap-2 shadow-lg"
                    >
                      <BsUpload className="w-4 h-4" />
                      Choose Photo
                    </button>
                    {previewImage && (
                      <button
                        onClick={() => setPreviewImage('')}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <BiRefresh className="w-4 h-4" />
                        Reset
                      </button>
                    )}
                  </div>

                  {/* Upload Requirements */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    {/* <h4 className="font-semibold text-blue-800 mb-2">Photo Requirements:</h4> */}
                    <ul className="text-blue-700 text-sm space-y-1">
                      <li>• Upload high-quality image (PNG/JPG)</li>
                      <li>• File size: Maximum 10MB</li>
                      <li>• Festival themes will be applied as decorative labels</li>
                    </ul>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                {/* Add to Cart */}
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart || !previewImage || !product}
                    className={`w-full py-4 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${!previewImage || !product
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-yellow-400 text-slate-700 hover:bg-yellow-500'
                      }`}
                  >
                    <RiShoppingBag2Line className="w-5 h-5" />
                    {isAddingToCart ? 'Adding to Cart...' : `Add to Cart - ${productPrice}`}
                  </button>

                  {!previewImage && (
                    <p className="text-red-500 text-sm text-center mt-2">
                      Please upload an image first
                    </p>
                  )}
                  
                  {!product && (
                    <p className="text-red-500 text-sm text-center mt-2">
                      Loading product...
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}