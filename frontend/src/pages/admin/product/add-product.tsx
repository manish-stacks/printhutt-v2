"use client"

import { get_parent_categories } from '@/_services/admin/category';
import { get_all_offer } from '@/_services/admin/offer';
import { add_new_product } from '@/_services/admin/product';
import { get_all_return } from '@/_services/admin/return-policy';
import { get_all_shipping } from '@/_services/admin/shipping';
import { get_parent_sub_categories } from '@/_services/admin/sub-category';
import { get_all_warranty } from '@/_services/admin/warranty';
import { ImageUpload } from '@/components/admin/products/ImageUpload';
import { generateSlug } from '@/helpers/helpers';
import { validateProductForm } from '@/utils/form';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RiLoader2Line } from 'react-icons/ri';
import { toast } from 'react-toastify';
import Select, { MultiValue } from 'react-select';
import type { ProductFormData } from '@/lib/types/product';
import type { Warranty } from '@/lib/types/warranty';
import type { ShippingInformation } from '@/lib/types/shipping';
import type { ReturnPolicy } from '@/lib/types/return';
import type { CategoryFormData } from '@/lib/types/category';
import type { Offer } from '@/lib/types/offer';
import type { Option } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import dynamic from 'next/dynamic';
import type { ChangeEvent, KeyboardEvent, FormEvent } from 'react';
import Image from 'next/image';
import VariantSection from '@/app/admin/products/VariantSection';

const QuillEditor = dynamic(() => import('@/components/QuillEditor'), { ssr: false });

const initialFormData: ProductFormData = {
  title: '',
  slug: '',
  description: '',
  short_description: '',
  category: '',
  subcategory: '',
  price: 0,
  discountType: '',
  discountPrice: 0,
  rating: 5,
  stock: 1000,
  tags: [],
  sku: '',
  weight: 0,
  availabilityStatus: 'in_stock',
  minimumOrderQuantity: 1,
  dimensions: '',
  warrantyInformation: '',
  shippingInformation: '',
  returnPolicy: '',
  demoVideo: '',
  imgAlt: '',
  status: true,
  ishome: false,
  trending: false,
  hot: false,
  sale: false,
  new: false,
  isCustomize: false,
  images: [],
  thumbnail: '',
  meta_title: '',
  meta_keywords: '',
  meta_description: '',
  shippingFee: 0,
  offers: [],
  isVarientStatus: false,
  varient: [],
  customizeLink: '',
  totalPrice: 0
};

function generateSKU(title: string) {
  const prefix = title.replace(/[^a-zA-Z0-9]/g, "").substring(0, 3).toUpperCase();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${random}`;
}

const calculateTotalPrice = (price: number, discountType: string, discountPrice: number) => {
  if (discountType === 'percentage') {
    const discountFactor = (100 - discountPrice) / 100;
    return Math.round(price / discountFactor);
  } else if (discountType === 'fixed') {
    return Math.round(price + discountPrice);
  } else {
    return Math.round(price);
  }
};


export default function AddProduct() {
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [warrantyData, shippingData, returnData, categoryData, offerData] = await Promise.all([
          get_all_warranty(),
          get_all_shipping(),
          get_all_return(),
          get_parent_categories(),
          get_all_offer()
        ]);
        setWarranties(warrantyData.data);
        setShippings(shippingData.data);
        setReturns(returnData.data);
        setCategories(categoryData.data);
        setOffers(offerData.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updatedData = { ...prev, [name]: value };
      if (name === 'title') {
        updatedData.slug = generateSlug(value);
        updatedData.sku = generateSKU(value);
        updatedData.meta_title = value;
        updatedData.meta_description = value;
        updatedData.meta_keywords = value;
        updatedData.imgAlt = value;
      }
      if (name === 'shippingInformation') {
        const shippingfilter = shippings.find(ship => ship._id === value);
        updatedData.shippingFee = shippingfilter?.shippingFee ? shippingfilter.shippingFee : 0;
      }
      if (['totalPrice', 'discountType', 'discountPrice'].includes(name)) {
        const totalPrice = parseFloat(updatedData.totalPrice as string) || 0;
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

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, thumbnail: file as unknown as ProductFormData['thumbnail'] }));
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCategoryChange = async (event: ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target;
    setFormData(prev => ({ ...prev, category: value }));
    try {
      setLoading(true);
      const categoryData = await get_parent_sub_categories(value);
      setSubCategories(categoryData.category);
    } catch (error) {
      if (error instanceof Error) toast.error('Failed to fetch sub categories');
    } finally {
      setLoading(false);
    }
  };

  const handleTagsChange = (e: KeyboardEvent<HTMLInputElement>) => {
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

  const options = offers && offers.map(offer => ({
    value: offer._id,
    label: offer.offerTitle.toUpperCase(),
  }));

  const handleSelectChangeOffer = (selectedOptions: MultiValue<Option> | null) => {
    const selectedOffers = selectedOptions ? selectedOptions.map(option => option.value) : [];
    setFormData(prev => ({ ...prev, offers: selectedOffers }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const validationErrors = validateProductForm(formData);
    if (validationErrors.length > 0) { setErrors(validationErrors); return; }
    setErrors([]);

    try {
      setIsSubmitting(true);
      const formDataToSend = new FormData();

      // Product thumbnail
      if (typeof File !== 'undefined' && formData.thumbnail instanceof File) {
        formDataToSend.append('thumbnail', formData.thumbnail);
      }

      // Product gallery images
      if (formData.images && formData.images.length > 0) {
        formData.images.forEach((image: any) => {
          if (image.file instanceof File) {
            formDataToSend.append('images', image.file);
          }
        });
      }

      // ✅ Variant files — thumbnail + gallery
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

      // ✅ variantsForJson — sirf scalar data + existing S3 URLs (no file objects, no blank URLs)
      const variantsForJson = formData.varient.map((v: any) => ({
        size: v.size,
        color: v.color,
        price: v.price,
        discountPrice: v.discountPrice,
        discountType: v.discountType,
        stock: v.stock,
        isMainProduct: v.isMainProduct || false,
      }));
      formDataToSend.set('varient', JSON.stringify(variantsForJson));

      const response = await add_new_product(formDataToSend);

      if (response.success) {
        toast.success('Product created successfully!');
        setFormData(initialFormData);
        setImage(null);
        router.push('/admin/products');
      } else {
        toast.error(response.message || 'Failed to create product');
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast.error(error.message || 'Failed to create product. Please try again.');
      setErrors([error.message || 'Failed to create product. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditorChange = (value: string) => {
    setFormData(prev => ({ ...prev, description: value }));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <form onSubmit={handleSubmit} encType={'multipart/form-data'}>
        <div className="flex flex-wrap mt-20 mb-52">
          {/* top row */}
          <div className="w-full md:w-12/12 lg:w-12/12 px-4 mb-5">
            <div className="bg-white text-black flex justify-between align-middle p-6 rounded-lg shadow-md shadow-black-300">
              <h3 className="text-lg font-bold">Create Product</h3>
              <button className="bg-blue-500 text-white py-1 px-7 rounded">Back</button>
            </div>
          </div>

          <div className="w-full md:w-12/12 lg:w-12/12 px-4 mb-5">
            {errors.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Please correct the following errors:</h3>
                    <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* left side */}
          <div className="w-full md:w-8/12 lg:w-8/12 px-4 space-y-6">
            <div className="bg-white text-black p-6 rounded-lg space-y-5 shadow-md shadow-black-300">
              <div>
                <label className="block text-sm font-medium text-gray-700">Product Name *</label>
                <input
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 mt-1"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                />
              </div>
              <div >
                <label className="block text-sm font-medium text-gray-700">Slug Name *</label>
                <input
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 mt-1"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="product-name"
                />
              </div>
            </div>

            <div className="bg-white text-black p-6 rounded-lg space-y-5 shadow-md shadow-black-300">
              <div>
                <label className="block text-sm font-medium text-gray-700">Thumbnail *</label>
                <p className="text-xs/5 text-gray-600">Image Size Should Be 800 x 800.</p>
                <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                  <div className="text-center">
                    {image ? (
                      <Image width={800} height={800} src={image} alt="Thumbnail Preview" className="mx-auto max-w-full rounded-md w-40 h-40" />
                    ) : (
                      <svg className="mx-auto size-12 text-gray-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd" />
                      </svg>
                    )}
                    <div className="mt-4 flex text-sm/6 text-gray-600">
                      <label className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 hover:text-indigo-500">
                        <span>Upload a file</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept="image/png, image/jpg, image/jpeg, image/gif"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs/5 text-gray-600">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white text-black p-6 rounded-lg space-y-5 shadow-md shadow-black-300">
              <div>
                <label className="block text-sm font-medium text-gray-700">Gallery Images *</label>
                <p className="text-xs/5 text-gray-600">Image Size Should Be 800 x 800.</p>
                <ImageUpload
                  images={formData.images}
                  onImagesChange={handleImagesChange}
                  productId={''}
                />
              </div>
            </div>

            <div className="bg-white text-black p-6 rounded-lg space-y-5 shadow-md shadow-black-300">
              <div>
                <label className="block text-sm font-medium text-gray-700">Short description *</label>
                <textarea
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 mt-1"
                  id="short_description"
                  name="short_description"
                  rows={5}
                  value={formData.short_description}
                  onChange={handleInputChange}
                  placeholder="Enter category short description"
                />
              </div>
            </div>

            <div className="bg-white text-black p-6 rounded-lg space-y-5 shadow-md shadow-black-300">
              <div>
                <label className="block text-sm font-medium text-gray-700">Description *</label>
                <QuillEditor value={formData.description} onChange={handleEditorChange} />
              </div>
            </div>

            <div className="bg-white text-black p-6 rounded-lg space-y-5 shadow-md shadow-black-300">
              <div>
                <label className="block text-sm font-medium text-gray-900">Product Data *</label>
                <div className='flex justify-between gap-3'>
                  <div className="w-4/12 mt-4">
                    <label className="block font-medium text-gray-700">Sell Price</label>
                    <input
                      className="block w-full h-10 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      type="number"
                      name="totalPrice"
                      id="totalPrice"
                      value={formData.totalPrice || ''}
                      onChange={handleInputChange}
                      placeholder='Total price'
                    />
                  </div>
                  <div className="w-4/12 mt-4">
                    <label className="block mb-2 text-sm font-medium text-gray-900">Discount Type</label>
                    <select
                      name="discountType"
                      value={formData.discountType || ''}
                      onChange={handleInputChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    >
                      <option value="">Select discount type</option>
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>
                  <div className="w-4/12 mt-4">
                    <label className="block font-medium text-gray-700">Discount</label>
                    <input
                      className="block w-full h-10 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      type="number"
                      name="discountPrice"
                      id="discountPrice"
                      value={formData.discountPrice || ''}
                      onChange={handleInputChange}
                      placeholder='Discount'
                    />
                  </div>
                  <div className="w-4/12 mt-4">
                    <label className="block font-medium text-gray-700">Product MRP</label>
                    <input
                      className="block w-full h-10 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      type="number"
                      name='price'
                      value={formData.price || ''}
                      onChange={handleInputChange}
                      placeholder='Product price'
                    />
                  </div>
                </div>

                <div className="w-12/12 mt-4">
                  <label className="block font-medium text-gray-700">Tags</label>
                  <div className="mt-2">
                    {formData.tags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="ml-2 text-red-500 hover:text-red-700">&times;</button>
                      </span>
                    ))}
                    <input
                      className="flex-grow bg-white px-2 py-1 text-base text-gray-900 outline-none placeholder-gray-400 focus:ring-0"
                      type="text"
                      id="tags"
                      placeholder="Add a tag"
                      onKeyDown={handleTagsChange}
                    />
                  </div>
                </div>

                <div className='flex justify-between gap-3'>
                  <div className="w-4/12 mt-4">
                    <label className="block font-medium text-gray-700">Rating</label>
                    <input
                      className="block w-full h-10 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      type="number" name="rating" id="rating" placeholder='rating'
                      value={formData.rating || ''} onChange={handleInputChange}
                    />
                  </div>
                  <div className="w-4/12 mt-4">
                    <label className="block font-medium text-gray-700">Stock</label>
                    <input
                      className="block w-full h-10 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      type="number" name="stock" id="stock" placeholder='stock'
                      value={formData.stock || ''} onChange={handleInputChange}
                    />
                  </div>
                  <div className="w-4/12 mt-4">
                    <label className="block font-medium text-gray-700">SKU</label>
                    <input
                      className="block w-full h-10 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      type="text" name="sku" id="sku" placeholder='sku'
                      value={formData.sku || ''} onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className='flex justify-between gap-3'>
                  <div className="w-4/12 mt-4">
                    <label className="block font-medium text-gray-700">Product Availability</label>
                    <select
                      id='availabilityStatus' name="availabilityStatus"
                      value={formData.availabilityStatus || ''} onChange={handleInputChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    >
                      <option value="">Availability Status</option>
                      <option value="in_stock">In Stock</option>
                      <option value="low_stock">Low Stock</option>
                      <option value="out_of_stock">Out Of Stock</option>
                    </select>
                  </div>
                  <div className="w-4/12 mt-4">
                    <label className="block font-medium text-gray-700">Minimum Order Quantity</label>
                    <input
                      className="block w-full h-10 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      type="number" name="minimumOrderQuantity" id="minimumOrderQuantity"
                      placeholder='minimumOrderQuantity' value={formData.minimumOrderQuantity || ''} onChange={handleInputChange}
                    />
                  </div>
                  <div className="w-4/12 mt-4">
                    <label className="block font-medium text-gray-700">Dimensions</label>
                    <input
                      type="text" name="dimensions" id="dimensions"
                      value={formData.dimensions || ''} onChange={handleInputChange}
                      className="block w-full h-10 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      placeholder='w x h x d'
                    />
                  </div>
                </div>

                <div className='flex justify-between gap-3'>
                  <div className="w-4/12 mt-4">
                    <label className="block font-medium text-gray-700">Product weight</label>
                    <input
                      type="text" name="weight" id="weight"
                      value={formData.weight || ''} onChange={handleInputChange}
                      className="block w-full h-10 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      placeholder='weight'
                    />
                  </div>
                </div>

                <div className='flex justify-between gap-3'>
                  <div className="w-8/12 mt-4">
                    <label className="block font-medium text-gray-700">Preview Video</label>
                    <input
                      type="text" name="demoVideo" id="demoVideo"
                      value={formData.demoVideo || ''} onChange={handleInputChange}
                      className="block w-full h-10 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      placeholder='Preview Video'
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white text-black p-6 rounded-lg space-y-5 shadow-md shadow-black-300">
              <div>
                <label className="block text-sm font-medium text-gray-900">Product Policy</label>
                <div className='flex justify-between gap-3'>
                  <div className="w-4/12 mt-4">
                    <label className="block font-medium text-gray-700">Warranty Information</label>
                    <select name="warrantyInformation" id="warrantyInformation" value={formData.warrantyInformation || ''} onChange={handleInputChange} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm mt-1">
                      <option>Choose</option>{warranties.length === 0 ? <option>No data found</option> : warranties.map(w => <option key={w._id} value={w._id}>{w.warrantyType.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div className="w-4/12 mt-4">
                    <label className="block font-medium text-gray-700">Shipping Information</label>
                    <select name="shippingInformation" id="shippingInformation" value={formData.shippingInformation || ''} onChange={handleInputChange} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm mt-1">
                      <option>Choose</option>{shippings.length === 0 ? <option>No data found</option> : shippings.map(s => <option key={s._id} value={s._id}>{s.shippingMethod.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div className="w-4/12 mt-4">
                    <label className="block font-medium text-gray-700">Return Policy</label>
                    <select name="returnPolicy" id="returnPolicy" value={formData.returnPolicy || ''} onChange={handleInputChange} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm mt-1">
                      <option>Choose</option>{returns.length === 0 ? <option>No data found</option> : returns.map(r => <option key={r._id} value={r._id}>{r.returnPeriod.toUpperCase()}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* right side */}
          <div className="w-full md:w-4/12 lg:w-4/12 px-4 space-y-6">
            <div className="bg-white text-black p-6 rounded-lg space-x-3 shadow-md shadow-black-300">
              <button type="submit" disabled={isSubmitting} className="bg-green-500 text-white py-2 px-7 rounded gap-1">
                <span className='flex'>
                  {isSubmitting && <RiLoader2Line className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? 'Creating...' : 'Save'}
                </span>
              </button>
              <button type="submit" className="bg-blue-500 text-white py-2 px-7 rounded gap-1">
                <span className='flex'>
                  {isSubmitting && <RiLoader2Line className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? 'Creating...' : 'Save & Edit'}
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
                  { key: 'isVarientStatus', label: 'Varient Available' },
                  { key: 'isCustomize', label: 'Customizable' },
                  { key: 'isTextBox', label: 'Text Box' },
                  { key: 'isImageBox', label: 'Image Box' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData[key as keyof ProductFormData] as boolean}
                      onChange={() => handleToggle(key as keyof ProductFormData)}
                      className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                    <span className="ml-3 text-sm font-medium text-gray-900">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {formData.isCustomize && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-bold mb-4">Customize Options</h3>
                <input
                  type="text" placeholder='link' name='customizeLink'
                  value={formData.customizeLink} onChange={handleInputChange}
                  className="block w-full h-10 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            )}

            {/*  VariantSection — sahi import path + sahi component */}
            {formData.isVarientStatus && (
              <VariantSection formData={formData} setFormData={setFormData} />
            )}

            <div className="bg-white text-black p-6 rounded-lg space-x-3 shadow-md shadow-black-300">
              <label className="block font-medium text-gray-700 ml-3">Offers On</label>
              <Select options={options} isMulti onChange={handleSelectChangeOffer} />
              <label className="block font-medium text-gray-700 ml-3 mt-3">Shipping Fee</label>
              <input
                type="text" name="shippingFee" id="shippingFee"
                value={formData.shippingFee || ''} onChange={handleInputChange}
                className="block w-full h-10 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                placeholder='Shipping Fee'
              />
            </div>

            <div className="bg-white text-black p-6 rounded-lg space-x-3 shadow-md shadow-black-300">
              <label className="block font-medium text-gray-700 ml-3">Select Category</label>
              <select
                id="category" name="category"
                value={formData.category || ''} onChange={handleCategoryChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              >
                <option>Choose Category</option>
                {categories && categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name.toUpperCase()}</option>
                ))}
              </select>
              <label className="block font-medium text-gray-700 ml-3 mt-3">Select Sub Category</label>
              <select
                id="subcategory" name="subcategory"
                value={formData.subcategory || ''} onChange={handleInputChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              >
                <option>Choose SubCategory</option>
                {subcategories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div className="bg-white text-black p-6 rounded-lg space-y-5 shadow-md shadow-black-300">
              <div>
                <label className="block text-sm font-medium text-gray-700">Meta Title</label>
                <input className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 mt-1"
                  id='meta_title' placeholder="Meta Title" type="text" name='meta_title'
                  value={formData.meta_title || ''} onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Meta keywords</label>
                <input className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 mt-1"
                  id='meta_keywords' placeholder="Meta Keywords" type="text" name='meta_keywords'
                  value={formData.meta_keywords || ''} onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Meta Description</label>
                <textarea
                  className="flex h-28 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 mt-1"
                  placeholder="Meta Description" id='meta_description' name='meta_description'
                  value={formData.meta_description || ''} onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700">Image Alt Text</label>
                <input
                  className="block w-full h-10 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  type="text" name="imgAlt" id="imgAlt"
                  value={formData.imgAlt || ''} onChange={handleInputChange}
                  placeholder='Img Alt'
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}