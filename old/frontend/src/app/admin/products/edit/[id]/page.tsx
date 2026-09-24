"use client"
import { get_parent_categories } from '@/_services/admin/category';
import { get_all_offer } from '@/_services/admin/offer';
import { get_product_by_id, update_a_product } from '@/_services/admin/product';
import { get_all_return } from '@/_services/admin/return-policy';
import { get_all_shipping } from '@/_services/admin/shipping';
import { get_parent_sub_categories } from '@/_services/admin/sub-category';
import { get_all_warranty } from '@/_services/admin/warranty';
import { ImageUpload } from '@/components/admin/products/ImageUpload';
import { generateSlug } from '@/helpers/helpers';
import { validateProductForm } from '@/utils/form';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RiLoader2Line } from 'react-icons/ri';
import { toast } from 'react-toastify';
import Select, { MultiValue } from 'react-select';
import type { ShippingInformation } from '@/lib/types/shipping';
import type { Warranty } from '@/lib/types/warranty';
import type { ReturnPolicy } from '@/lib/types/return';
import type { CategoryFormData } from '@/lib/types/category';
import type { Offer } from '@/lib/types/offer';
import type { ImageType, Option } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import dynamic from 'next/dynamic';
import type { ProductFormData } from '@/lib/types/product';
import Image from 'next/image';
//  Same VariantSection as add page
import VariantSection from '@/app/admin/products/VariantSection';

const QuillEditor = dynamic(() => import('@/components/QuillEditor'), { ssr: false });

interface UpdateProductResponse {
  success: boolean;
  message?: string;
}

const initialFormData: ProductFormData = {
  title: '', slug: '', description: '', short_description: '',
  category: '', subcategory: '', price: 0, discountType: '', discountPrice: 0,
  rating: 0, stock: 0, tags: [], sku: '', weight: 0,
  availabilityStatus: 'in_stock', minimumOrderQuantity: 1, dimensions: '',
  warrantyInformation: '', shippingInformation: '', returnPolicy: '',
  demoVideo: '', imgAlt: '', status: false, ishome: false, trending: false,
  isTextBox: false, textBoxCount: 1, isImageBox: false, imageBoxCount: 1, hot: false, sale: false, new: false,
  isCustomize: false, images: [], thumbnail: '', meta_title: '',
  meta_keywords: '', meta_description: '', shippingFee: 0, offers: [],
  isVarientStatus: false, varient: [], customizeLink: '', totalPrice: 0
};

export default function EditProduct() {
  const params = useParams();
  const id = params?.id as string | undefined;

  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [shippings, setShippings] = useState<ShippingInformation[]>([]);
  const [returns, setReturns] = useState<ReturnPolicy[]>([]);
  const [categories, setCategories] = useState<CategoryFormData[]>([]);
  const [subcategories, setSubCategories] = useState<CategoryFormData[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [image, setImage] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const calculateTotalPrice = (price: number, discountType: string, discountPrice: number) => {
    if (discountType === 'percentage') return Math.round(price / ((100 - discountPrice) / 100));
    if (discountType === 'fixed') return Math.round(price + discountPrice);
    return Math.round(price);
  };

  const extractId = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object' && val._id) return String(val._id);
    return String(val);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [warrantyData, shippingData, returnData, categoryData, offerData, productData] = await Promise.all([
          get_all_warranty(),
          get_all_shipping(),
          get_all_return(),
          get_parent_categories(),
          get_all_offer(),
          get_product_by_id(id),
        ]);
        // console.log('shipping:', shippingData);
        setWarranties(warrantyData.data);
        setShippings(shippingData.data);
        setReturns(returnData.data);
        setCategories(categoryData.data);
        setOffers(offerData.data);

        const categoryId = extractId(productData.category);
        const subcategoryId = extractId(productData.subcategory);
        const warrantyId = extractId(productData.warrantyInformation);
        const shippingId = extractId(productData.shippingInformation);
        const returnId = extractId(productData.returnPolicy);

        const sellPrice = productData.discountType === 'percentage'
          ? Math.round(productData.price * (1 - productData.discountPrice / 100))
          : productData.discountType === 'fixed'
            ? Math.round(productData.price - productData.discountPrice)
            : Math.round(productData.price);

        setFormData({
          ...productData,
          category: categoryId,
          subcategory: subcategoryId,
          warrantyInformation: warrantyId,
          shippingInformation: shippingId,
          returnPolicy: returnId,
          meta_description: productData.meta?.meta_description || '',
          meta_keywords: productData.meta?.meta_keywords || '',
          meta_title: productData.meta?.meta_title || '',
          totalPrice: sellPrice,
          offers: (productData.offers || []).map(extractId),
        });

        setImage(productData.thumbnail?.url || null);

        if (categoryId) {
          const subcategoryData = await get_parent_sub_categories(categoryId);
          setSubCategories(subcategoryData.category || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load product data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updatedData = { ...prev, [name]: value };
      if (name === 'title') updatedData.slug = generateSlug(value);
      if (name === 'shippingInformation') {
        const found = shippings.find(s => s._id === value);
        updatedData.shippingFee = found?.shippingFee ?? 0;
      }
      if (['totalPrice', 'discountType', 'discountPrice'].includes(name)) {
        const totalPrice = parseFloat(updatedData.totalPrice as unknown as string) || 0;
        const discountPrice = parseFloat(updatedData.discountPrice as unknown as string) || 0;
        updatedData.price = calculateTotalPrice(totalPrice, updatedData.discountType, discountPrice);
      }
      return updatedData;
    });
  };

  const handleToggle = (field: keyof ProductFormData) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleImagesChange = (images: ProductFormData['images']) => {
    setFormData(prev => ({ ...prev, images }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, thumbnail: file as unknown as ProductFormData['thumbnail'] }));
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCategoryChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, category: value, subcategory: '' }));
    setSubCategories([]);
    if (value) {
      try {
        const subcategoryData = await get_parent_sub_categories(value);
        setSubCategories(subcategoryData.category || []);
      } catch { toast.error('Error loading subcategories'); }
    }
  };

  const handleTagsChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const inputValue = e.currentTarget.value.trim();
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue && !formData.tags.includes(inputValue)) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, inputValue] }));
        e.currentTarget.value = '';
      }
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const options = offers.map(offer => ({ value: offer._id, label: offer.offerTitle.toUpperCase() }));
  const handleSelectChangeOffer = (selectedOptions: any) => {
    setFormData(prev => ({ ...prev, offers: selectedOptions ? selectedOptions.map((o: any) => o.value) : [] }));
  };
  const selectedOffers = options.filter(o => formData.offers.includes(o.value));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateProductForm(formData);
    if (validationErrors.length > 0) { setErrors(validationErrors); return; }
    setErrors([]);

    try {
      setIsSubmitting(true);
      const formDataToSend = new FormData();

      // Product thumbnail (new file only)
      if (formData.thumbnail instanceof File) {
        formDataToSend.append('thumbnail', formData.thumbnail);
      }

      // Product gallery images (new files only)
      if (formData.images?.length > 0) {
        formData.images.forEach((img: any) => {
          if (img?.file instanceof File) {
            formDataToSend.append('images', img.file);
          }
        });
      }

      // ✅ Variant files — thumbnail + gallery (new files only)
      if (formData.isVarientStatus && formData.varient.length > 0) {
        formData.varient.forEach((variant: any, vIdx: number) => {
          if (variant.thumbnail?.file instanceof File) {
            formDataToSend.append(`variant_thumbnail_${vIdx}`, variant.thumbnail.file);
          }
          ; (variant.images || []).forEach((img: any, imgIdx: number) => {
            if (img?.file instanceof File) {
              formDataToSend.append(`variant_image_${vIdx}_${imgIdx}`, img.file);
            }
          });
        });
      }

      // All scalar fields (thumbnail, images, varient skip)
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'thumbnail' && key !== 'images' && key !== 'varient') {
          if (typeof value === 'object' && value !== null) {
            formDataToSend.append(key, JSON.stringify(value));
          } else {
            formDataToSend.append(key, String(value));
          }
        }
      });

      // ✅ variantsForJson — existing S3 URLs + isMainProduct, blank filter
      const variantsForJson = formData.varient.map((v: any) => ({
        ...(v._id ? { _id: v._id } : {}),
        size: v.size,
        color: v.color,
        price: v.price,
        discountPrice: v.discountPrice,
        discountType: v.discountType,
        stock: v.stock,
        isMainProduct: v.isMainProduct || false,
        thumbnail: v.thumbnail?.url?.startsWith('http')
          ? { url: v.thumbnail.url, public_id: v.thumbnail.public_id, fileType: v.thumbnail.fileType }
          : null,
        images: (v.images || [])
          .filter((img: any) => img?.url?.startsWith('http'))
          .map((img: any) => ({ url: img.url, public_id: img.public_id, fileType: img.fileType })),
      }));
      formDataToSend.set('varient', JSON.stringify(variantsForJson));

      if (!id) throw new Error("Product ID is required");

      const response = await update_a_product(id, formDataToSend) as unknown as UpdateProductResponse;

      if (response.success) {
        toast.success('Product updated successfully!');
        router.back();
      } else {
        toast.error(response.message || 'Failed to update product');
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error(msg);
      setErrors([msg]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditorChange = (value: string) => {
    setFormData(prev => ({ ...prev, description: value }));
  };

  if (!id) { toast.error("No product ID provided."); return null; }
  if (loading) return <LoadingSpinner />;

  return (
    <>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="flex flex-wrap mt-20 mb-52">

          {/* Header */}
          <div className="w-full px-4 mb-5">
            <div className="bg-white text-black flex justify-between align-middle p-6 rounded-lg shadow-md shadow-black-300">
              <h3 className="text-lg font-bold">Update Product</h3>
              <button type="button" onClick={() => router.back()} className="bg-blue-500 text-white py-1 px-7 rounded">Back</button>
            </div>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="w-full px-4 mb-5">
              <div className="bg-red-50 border-l-4 border-red-500 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Please correct the following errors:</h3>
                    <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                      {errors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Left Side */}
          <div className="w-full md:w-8/12 lg:w-8/12 px-4 space-y-6">

            <div className="bg-white text-black p-6 rounded-lg space-y-5 shadow-md shadow-black-300">
              <div>
                <label className="block text-sm font-medium text-gray-700">Product Name *</label>
                <input className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 mt-1"
                  name="title" value={formData.title} onChange={handleInputChange} placeholder="Enter product name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Slug *</label>
                <input className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 mt-1"
                  name="slug" value={formData.slug} onChange={handleInputChange} placeholder="product-slug" />
              </div>
            </div>

            <div className="bg-white text-black p-6 rounded-lg space-y-5 shadow-md shadow-black-300">
              <label className="block text-sm font-medium text-gray-700">Thumbnail *</label>
              <p className="text-xs text-gray-600">Image Size Should Be 800 x 800.</p>
              <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                <div className="text-center">
                  {image ? (
                    <Image width={800} height={800} src={image} alt="Thumbnail Preview" className="mx-auto max-w-full rounded-md w-40 h-40" />
                  ) : (
                    <svg className="mx-auto size-12 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd" />
                    </svg>
                  )}
                  <div className="mt-4 flex text-sm text-gray-600">
                    <label className="cursor-pointer font-semibold text-indigo-600 hover:text-indigo-500">
                      <span>Upload a file</span>
                      <input type="file" className="sr-only" accept="image/png,image/jpg,image/jpeg,image/gif" onChange={handleFileChange} />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-600">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
            </div>

            <div className="bg-white text-black p-6 rounded-lg space-y-5 shadow-md shadow-black-300">
              <label className="block text-sm font-medium text-gray-700">Gallery Images *</label>
              <p className="text-xs text-gray-600">Image Size Should Be 800 x 800.</p>
              <ImageUpload images={formData.images} onImagesChange={handleImagesChange} productId={id} />
            </div>

            <div className="bg-white text-black p-6 rounded-lg space-y-5 shadow-md shadow-black-300">
              <label className="block text-sm font-medium text-gray-700">Short Description *</label>
              <textarea className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 mt-1"
                name="short_description" rows={5} value={formData.short_description} onChange={handleInputChange} placeholder="Enter short description" />
            </div>

            <div className="bg-white text-black p-6 rounded-lg space-y-5 shadow-md shadow-black-300">
              <label className="block text-sm font-medium text-gray-700">Description *</label>
              <QuillEditor value={formData.description} onChange={handleEditorChange} />
            </div>

            <div className="bg-white text-black p-6 rounded-lg space-y-5 shadow-md shadow-black-300">
              <label className="block text-sm font-medium text-gray-900">Product Data *</label>
              <div className='flex justify-between gap-3'>
                <div className="w-4/12 mt-4">
                  <label className="block font-medium text-gray-700">Sell Price</label>
                  <input className="block w-full h-10 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    type="number" name="totalPrice" value={formData.totalPrice || ''} onChange={handleInputChange} placeholder='Total price' />
                </div>
                <div className="w-4/12 mt-4">
                  <label className="block mb-2 text-sm font-medium text-gray-900">Discount Type</label>
                  <select name="discountType" value={formData.discountType || ''} onChange={handleInputChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                    <option value="">Select discount type</option>
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div className="w-4/12 mt-4">
                  <label className="block font-medium text-gray-700">Discount</label>
                  <input className="block w-full h-10 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    type="number" name="discountPrice" value={formData.discountPrice || ''} onChange={handleInputChange} placeholder='Discount' />
                </div>
                <div className="w-4/12 mt-4">
                  <label className="block font-medium text-gray-700">Product MRP</label>
                  <input className="block w-full h-10 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    type="number" name='price' value={formData.price || ''} onChange={handleInputChange} placeholder='Product price' />
                </div>
              </div>

              <div className="mt-4">
                <label className="block font-medium text-gray-700">Tags</label>
                <div className="mt-2">
                  {formData.tags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="ml-2 text-red-500 hover:text-red-700">&times;</button>
                    </span>
                  ))}
                  <input className="flex-grow bg-white px-2 py-1 text-base text-gray-900 outline-none placeholder-gray-400 focus:ring-0"
                    type="text" placeholder="Add a tag" onKeyDown={handleTagsChange} />
                </div>
              </div>

              <div className='flex justify-between gap-3'>
                <div className="w-4/12 mt-4">
                  <label className="block font-medium text-gray-700">Rating</label>
                  <input className="block w-full h-10 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    type="number" name="rating" value={formData.rating || ''} onChange={handleInputChange} placeholder='rating' />
                </div>
                <div className="w-4/12 mt-4">
                  <label className="block font-medium text-gray-700">Stock</label>
                  <input className="block w-full h-10 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    type="number" name="stock" value={formData.stock || ''} onChange={handleInputChange} placeholder='stock' />
                </div>
                <div className="w-4/12 mt-4">
                  <label className="block font-medium text-gray-700">SKU</label>
                  <input className="block w-full h-10 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    type="text" name="sku" value={formData.sku || ''} onChange={handleInputChange} placeholder='sku' />
                </div>
              </div>

              <div className='flex justify-between gap-3'>
                <div className="w-4/12 mt-4">
                  <label className="block font-medium text-gray-700">Product Availability</label>
                  <select name="availabilityStatus" value={formData.availabilityStatus || ''} onChange={handleInputChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                    <option value="">Availability Status</option>
                    <option value="in_stock">In Stock</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="out_of_stock">Out Of Stock</option>
                  </select>
                </div>
                <div className="w-4/12 mt-4">
                  <label className="block font-medium text-gray-700">Minimum Order Quantity</label>
                  <input className="block w-full h-10 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    type="number" name="minimumOrderQuantity" value={formData.minimumOrderQuantity || ''} onChange={handleInputChange} />
                </div>
                <div className="w-4/12 mt-4">
                  <label className="block font-medium text-gray-700">Dimensions</label>
                  <input className="block w-full h-10 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    type="text" name="dimensions" value={formData.dimensions || ''} onChange={handleInputChange} placeholder='w x h x d' />
                </div>
              </div>

              <div className='flex gap-3'>
                <div className="w-4/12 mt-4">
                  <label className="block font-medium text-gray-700">Product weight</label>
                  <input className="block w-full h-10 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    type="text" name="weight" value={formData.weight || ''} onChange={handleInputChange} placeholder='weight' />
                </div>
                <div className="w-8/12 mt-4">
                  <label className="block font-medium text-gray-700">Preview Video</label>
                  <input className="block w-full h-10 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    type="text" name="demoVideo" value={formData.demoVideo || ''} onChange={handleInputChange} placeholder='Preview Video URL' />
                </div>
              </div>
            </div>

            <div className="bg-white text-black p-6 rounded-lg space-y-5 shadow-md shadow-black-300">
              <label className="block text-sm font-medium text-gray-900">Product Policy</label>
              <div className='flex justify-between gap-3'>
                <div className="w-4/12 mt-4">
                  <label className="block font-medium text-gray-700">Warranty Information</label>
                  <select name="warrantyInformation" value={formData.warrantyInformation || ''} onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-600">
                    <option value="">Choose Warranty</option>
                    {warranties.length === 0 ? <option disabled>No data found</option> : warranties.map(w => <option key={w._id} value={w._id}>{w.warrantyType.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="w-4/12 mt-4">
                  <label className="block font-medium text-gray-700">Shipping Information</label>
                  <select name="shippingInformation" value={formData.shippingInformation || ''} onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-600">
                    <option value="">Choose Shipping</option>
                    {shippings.length === 0 ? <option disabled>No data found</option> : shippings.map(s => <option key={s._id} value={s._id}>{s.shippingMethod.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="w-4/12 mt-4">
                  <label className="block font-medium text-gray-700">Return Policy</label>
                  <select name="returnPolicy" value={formData.returnPolicy || ''} onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-600">
                    <option value="">Choose Return Policy</option>
                    {returns.length === 0 ? <option disabled>No data found</option> : returns.map(r => <option key={r._id} value={r._id}>{r.returnPeriod.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="w-full md:w-4/12 lg:w-4/12 px-4 space-y-6">

            <div className="bg-white text-black p-6 rounded-lg space-x-3 shadow-md shadow-black-300">
              <button type="submit" disabled={isSubmitting} className="bg-green-500 text-white py-2 px-7 rounded gap-1">
                <span className='flex'>
                  {isSubmitting && <RiLoader2Line className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? 'Updating...' : 'Update'}
                </span>
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-bold mb-4">Product Status</h3>
              <div className="space-y-4">
                {[
                  { key: 'status', label: 'Active' },
                  // { key: 'ishome', label: 'Show on Home' },
                  { key: 'trending', label: 'Trending' },
                  { key: 'hot', label: 'Hot Deal' },
                  // { key: 'sale', label: 'On Sale' },
                  { key: 'new', label: 'New Arrival' },
                  { key: 'isVarientStatus', label: 'Variant Available' },
                  { key: 'isCustomize', label: 'Customizable' },
                  { key: 'isTextBox', label: 'Text Box' },
                  { key: 'isImageBox', label: 'Image Box' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="flex items-center">
                      <input type="checkbox" checked={formData[key as keyof ProductFormData] as boolean}
                        onChange={() => handleToggle(key as keyof ProductFormData)} className="sr-only peer" />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
                      <span className="ml-3 text-sm font-medium text-gray-900">{label}</span>
                    </label>
                    {key === 'isTextBox' && formData.isTextBox && (
                      <div className="mt-2 ml-14 flex items-center gap-2">
                        <span className="text-xs text-gray-500">How many text fields from user?</span>
                        <input type="number" min={1} max={10} value={formData.textBoxCount ?? 1}
                          onChange={(e) => setFormData((prev) => ({ ...prev, textBoxCount: Math.min(10, Math.max(1, parseInt(e.target.value, 10) || 1)) }))}
                          className="w-16 h-8 rounded-md bg-white px-2 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300" />
                      </div>
                    )}
                    {key === 'isImageBox' && formData.isImageBox && (
                      <div className="mt-2 ml-14 flex items-center gap-2">
                        <span className="text-xs text-gray-500">How many photos from user?</span>
                        <input type="number" min={1} max={10} value={formData.imageBoxCount ?? 1}
                          onChange={(e) => setFormData((prev) => ({ ...prev, imageBoxCount: Math.min(10, Math.max(1, parseInt(e.target.value, 10) || 1)) }))}
                          className="w-16 h-8 rounded-md bg-white px-2 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {formData.isCustomize && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-bold mb-4">Customize Options</h3>
                <input type="text" placeholder='link' name='customizeLink'
                  value={formData.customizeLink} onChange={handleInputChange}
                  className="block w-full h-10 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
              </div>
            )}

            {/*  Same VariantSection as add page — with image upload */}
            {formData.isVarientStatus && (
              <VariantSection formData={formData} setFormData={setFormData} />
            )}

            <div className="bg-white text-black p-6 rounded-lg space-x-3 shadow-md shadow-black-300">
              <label className="block font-medium text-gray-700 ml-3">Offers On</label>
              <Select options={options} isMulti value={selectedOffers} onChange={handleSelectChangeOffer} />
              <label className="block font-medium text-gray-700 ml-3 mt-3">Shipping Fee</label>
              <input type="text" name="shippingFee" value={formData.shippingFee || ''} onChange={handleInputChange}
                className="block w-full h-10 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                placeholder='Shipping Fee' />
            </div>

            <div className="bg-white text-black p-6 rounded-lg space-x-3 shadow-md shadow-black-300">
              <label className="block font-medium text-gray-700 ml-3">Select Category</label>
              <select id="category" name="category" value={formData.category || ''} onChange={handleCategoryChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                <option value="">Choose Category</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name.toUpperCase()}</option>
                ))}
              </select>
              <label className="block font-medium text-gray-700 ml-3 mt-3">Select Sub Category</label>
              <select id="subcategory" name="subcategory" value={formData.subcategory || ''} onChange={handleInputChange}
                disabled={!formData.category}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                <option value="">Choose SubCategory</option>
                {subcategories.map(sub => (
                  <option key={sub._id} value={sub._id}>{sub.name.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div className="bg-white text-black p-6 rounded-lg space-y-5 shadow-md shadow-black-300">
              <div>
                <label className="block text-sm font-medium text-gray-700">Meta Title</label>
                <input className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 mt-1"
                  type="text" name='meta_title' value={formData.meta_title || ''} onChange={handleInputChange} placeholder="Meta Title" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Meta keywords</label>
                <input className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 mt-1"
                  type="text" name='meta_keywords' value={formData.meta_keywords || ''} onChange={handleInputChange} placeholder="Meta Keywords" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Meta Description</label>
                <textarea className="flex h-28 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 mt-1"
                  name='meta_description' value={formData.meta_description || ''} onChange={handleInputChange} placeholder="Meta Description" />
              </div>
              <div>
                <label className="block font-medium text-gray-700">Image Alt Text</label>
                <input className="block w-full h-10 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  type="text" name="imgAlt" value={formData.imgAlt || ''} onChange={handleInputChange} placeholder='Img Alt' />
              </div>
            </div>

          </div>
        </div>
      </form>
    </>
  );
}