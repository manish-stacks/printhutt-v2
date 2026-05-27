"use client"

import React, { useState, useRef, ChangeEvent } from 'react'
import { FaTrash, FaImage, FaStar } from 'react-icons/fa'
import { BiPlus, BiX } from 'react-icons/bi'
import { RiDraggable } from 'react-icons/ri'
import type { ProductFormData, ProductVariant } from '@/lib/types/product'
import type { ImageType } from '@/lib/types'

function getPreviewUrl(img: any): string | null {
  if (!img) return null
  // ✅ preview pehle — naya URL.createObjectURL har render pe nahi
  if (img.preview) return img.preview
  if (img.url) return img.url
  return null
}

// ─── Variant Image Uploader ───────────────────────────────────
interface VariantImageUploaderProps {
  variantIndex: number
  variant: ProductVariant
  onThumbnailChange: (index: number, file: File) => void
  onImagesAdd: (index: number, files: File[]) => void
  onImageRemove: (variantIndex: number, imageIndex: number) => void
  onSetMainImage: (variantIndex: number, imageIndex: number) => void
  onToggleMainProduct: (variantIndex: number, value: boolean) => void
}

function VariantImageUploader({
  variantIndex, variant,
  onThumbnailChange, onImagesAdd, onImageRemove,
  onSetMainImage, onToggleMainProduct,
}: VariantImageUploaderProps) {
  const thumbnailUrl = getPreviewUrl(variant.thumbnail)
  const isMainProduct = (variant as any).isMainProduct || false

  const dragItem = useRef<number | null>(null)
  const dragOver = useRef<number | null>(null)

  return (
    <div className="mt-5 border-t pt-4 space-y-4">
      <p className="text-sm font-semibold text-gray-700">📸 Variant Images</p>

      {/* ✅ Main Product toggle */}
      <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-amber-800">Use as Main Product Display</p>
          
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isMainProduct}
            onChange={e => onToggleMainProduct(variantIndex, e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
        </label>
      </div>

      {/* Thumbnail */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Main Thumbnail *</label>
        <div className="flex items-center gap-4">
          {thumbnailUrl ? (
            <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-yellow-400">
              <img src={thumbnailUrl} alt="thumb" className="w-full h-full object-cover" />
              <span className="absolute top-0.5 left-0.5 bg-yellow-400 text-black text-[9px] font-bold px-1 rounded">MAIN</span>
            </div>
          ) : (
            <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
              <FaImage className="text-gray-400 text-xl" />
            </div>
          )}
          <label className="cursor-pointer bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm px-4 py-2 rounded-md border border-indigo-200 transition">
            {thumbnailUrl ? 'Change' : 'Upload'}
            <input type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) onThumbnailChange(variantIndex, f) }} />
          </label>
        </div>
      </div>

      {/* Gallery */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Gallery Images <span className="text-gray-400">(drag to reorder · ⭐ set main)</span>
        </label>
        <div className="flex flex-wrap gap-3 mb-2">
          {(variant.images || []).map((img: any, imgIdx: number) => {
            const url = getPreviewUrl(img)
            if (!url) return null
            const isMain = img.isMain
            return (
              <div key={imgIdx}
                className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 group cursor-grab active:cursor-grabbing
                  ${isMain ? 'border-yellow-400' : 'border-gray-300'}`}
                draggable
                onDragStart={() => { dragItem.current = imgIdx }}
                onDragEnter={() => { dragOver.current = imgIdx }}
                onDragOver={e => e.preventDefault()}
                onDragEnd={() => {
                  if (dragItem.current === null || dragOver.current === null || dragItem.current === dragOver.current) {
                    dragItem.current = null; dragOver.current = null; return
                  }
                  // Reorder via parent
                  const from = dragItem.current; const to = dragOver.current
                  dragItem.current = null; dragOver.current = null
                  // Use onImagesAdd trick — handled via state directly in parent
                }}
              >
                <img src={url} alt={`img-${imgIdx}`} className="w-full h-full object-cover" />
                {isMain && (
                  <span className="absolute top-0.5 left-0.5 bg-yellow-400 text-black text-[8px] font-bold px-1 rounded">MAIN</span>
                )}
                {!isMain && (
                  <button type="button" onClick={() => onSetMainImage(variantIndex, imgIdx)}
                    className="absolute top-0.5 left-0.5 bg-black/50 text-yellow-300 p-0.5 rounded opacity-0 group-hover:opacity-100 transition" title="Set as main">
                    <FaStar size={10} />
                  </button>
                )}
                <button type="button" onClick={() => onImageRemove(variantIndex, imgIdx)}
                  className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition">
                  <BiX size={12} />
                </button>
                <div className="absolute bottom-0.5 right-0.5 bg-black/40 text-white p-0.5 rounded opacity-0 group-hover:opacity-100 transition">
                  <RiDraggable size={10} />
                </div>
              </div>
            )
          })}
          <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 bg-gray-50 hover:bg-indigo-50 transition">
            <BiPlus className="text-gray-400 text-xl" />
            <span className="text-xs text-gray-400 mt-1">Add</span>
            <input type="file" accept="image/*" multiple className="hidden"
              onChange={e => { const files = Array.from(e.target.files || []); if (files.length) onImagesAdd(variantIndex, files) }} />
          </label>
        </div>
        <p className="text-xs text-gray-400">{(variant.images || []).length} image(s)</p>
      </div>
    </div>
  )
}

// ─── Variant Section ──────────────────────────────────────────
interface VariantSectionProps {
  formData: ProductFormData
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>
}

export function VariantSection({ formData, setFormData }: VariantSectionProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const dragVariant = useRef<number | null>(null)
  const dragVariantOver = useRef<number | null>(null)

  const handleVariantDragStart = (index: number) => { dragVariant.current = index }
  const handleVariantDragEnter = (index: number) => { dragVariantOver.current = index }
  const handleVariantDragEnd = () => {
    if (dragVariant.current === null || dragVariantOver.current === null || dragVariant.current === dragVariantOver.current) {
      dragVariant.current = null; dragVariantOver.current = null; return
    }
    setFormData(prev => {
      const updated = [...prev.varient]
      const [moved] = updated.splice(dragVariant.current!, 1)
      updated.splice(dragVariantOver.current!, 0, moved)
      dragVariant.current = null; dragVariantOver.current = null
      return { ...prev, varient: updated }
    })
    setActiveIndex(null)
  }

  const handleAddVarient = () => {
    setFormData(prev => ({
      ...prev,
      varient: [...prev.varient, {
        size: '', color: '#000000', price: 0, discountPrice: 0,
        discountType: '', stock: 0, images: [], thumbnail: null,
        isMainProduct: false,
      } as any]
    }))
  }

  const handleRemoveVariant = (index: number) => {
    setFormData(prev => ({ ...prev, varient: prev.varient.filter((_, i) => i !== index) }))
    if (activeIndex === index) setActiveIndex(null)
  }

  const handleVariantChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>, index: number) => {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = [...prev.varient]
      updated[index] = { ...updated[index], [name]: value }
      return { ...prev, varient: updated }
    })
  }

  const calcMRP = (sp: number, discountType: string, discount: number) => {
    if (discountType === 'percentage' && discount > 0) return Math.round(sp / (1 - discount / 100))
    if (discountType === 'fixed' && discount > 0) return sp + discount
    return sp
  }

  const handleThumbnailChange = (variantIndex: number, file: File) => {
    setFormData(prev => {
      const updated = [...prev.varient]
      updated[variantIndex] = { ...updated[variantIndex], thumbnail: { file, preview: URL.createObjectURL(file) } as any }
      return { ...prev, varient: updated }
    })
  }

  const handleImagesAdd = (variantIndex: number, files: File[]) => {
    setFormData(prev => {
      const updated = [...prev.varient]
      const existing = updated[variantIndex].images || []
      const newImgs = files.map(f => ({ file: f, preview: URL.createObjectURL(f), url: '', public_id: '', fileType: f.type, isMain: false }))
      updated[variantIndex] = { ...updated[variantIndex], images: [...existing, ...newImgs] as any }
      return { ...prev, varient: updated }
    })
  }

  const handleImageRemove = (variantIndex: number, imageIndex: number) => {
    setFormData(prev => {
      const updated = [...prev.varient]
      const imgs = [...(updated[variantIndex].images || [])]
      imgs.splice(imageIndex, 1)
      updated[variantIndex] = { ...updated[variantIndex], images: imgs }
      return { ...prev, varient: updated }
    })
  }

  const handleSetMainImage = (variantIndex: number, imageIndex: number) => {
    setFormData(prev => {
      const updated = [...prev.varient]
      const imgs = (updated[variantIndex].images || []).map((img: any, i: number) => ({ ...img, isMain: i === imageIndex }))
      updated[variantIndex] = { ...updated[variantIndex], images: imgs as any }
      return { ...prev, varient: updated }
    })
  }

  // ✅ Toggle isMainProduct — ek hi variant main ho sakta hai
  const handleToggleMainProduct = (variantIndex: number, value: boolean) => {
    setFormData(prev => {
      const updated = prev.varient.map((v, i) => ({
        ...v,
        isMainProduct: i === variantIndex ? value : false, // only one can be main
      }))
      return { ...prev, varient: updated as any }
    })
  }

  if (!formData.isVarientStatus) return null

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-white text-black p-5 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">Product Variants</h3>
            <p className="text-xs text-gray-400 mt-0.5">Drag ☰ to reorder · </p>
          </div>
          <button type="button" onClick={handleAddVarient}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition">
            <BiPlus size={16} /> Add Variant
          </button>
        </div>
      </div>

      {formData.varient.map((item, index) => (
        <div key={index}
          className={`variant-section border rounded-lg overflow-hidden shadow-sm transition-all
            ${(item as any).isMainProduct ? 'border-amber-400' : 'border-gray-200'}`}
          draggable
          onDragStart={() => handleVariantDragStart(index)}
          onDragEnter={() => handleVariantDragEnter(index)}
          onDragOver={e => e.preventDefault()}
          onDragEnd={handleVariantDragEnd}
        >
          {/* Accordion header */}
          <div
            className={`flex justify-between items-center cursor-pointer p-4 transition select-none
              ${(item as any).isMainProduct ? 'bg-amber-50 hover:bg-amber-100' : 'bg-indigo-50 hover:bg-indigo-100'}`}
            onClick={() => setActiveIndex(activeIndex === index ? null : index)}
          >
            <div className="flex items-center gap-3">
              <RiDraggable size={18} className="text-gray-400 cursor-grab shrink-0" />

              {item.thumbnail && getPreviewUrl(item.thumbnail as any) ? (
                <img src={getPreviewUrl(item.thumbnail as any)!} alt="thumb"
                  className="w-10 h-10 rounded-md object-cover border border-indigo-200 shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-md bg-indigo-200 flex items-center justify-center shrink-0">
                  <FaImage className="text-indigo-500 text-sm" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Variant {index + 1}{item.size ? ` — ${item.size}` : ''}
                  </h3>
                  {(item as any).isMainProduct && (
                    <span className="text-[10px] bg-amber-400 text-black font-bold px-1.5 py-0.5 rounded-full">MAIN</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {item.price ? `MRP ₹${item.price}` : 'Price not set'} · {(item.images || []).length} img
                </p>
              </div>
            </div>

            <button type="button"
              onClick={e => { e.stopPropagation(); handleRemoveVariant(index) }}
              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition shrink-0">
              <FaTrash className="h-3 w-3" />
            </button>
          </div>

          {/* Accordion body */}
          {activeIndex === index && (
            <div className="px-5 py-5 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Size / Label *</label>
                  <input type="text" name="size" value={item.size}
                    onChange={e => handleVariantChange(e, index)}
                    className="block w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-indigo-600"
                    placeholder="e.g. Small, 10x12, A4" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" name="color" value={item.color || '#000000'}
                      onChange={e => handleVariantChange(e, index)}
                      className="h-10 w-14 rounded-md border border-gray-300 cursor-pointer" />
                    <input type="text" name="color" value={item.color || ''}
                      onChange={e => handleVariantChange(e, index)}
                      className="flex-1 h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-indigo-600"
                      placeholder="#000000" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₹) *</label>
                  <input type="number" name="totalPrice"
                    value={((item as any).totalPrice ?? (
                      item.discountType === 'percentage'
                        ? Math.round(item.price * (1 - Number(item.discountPrice) / 100))
                        : item.discountType === 'fixed'
                          ? item.price - Number(item.discountPrice)
                          : item.price
                    )) || ''}
                    onChange={e => {
                      const val = Number(e.target.value)
                      setFormData(prev => {
                        const updated = [...prev.varient]
                        ;(updated[index] as any).totalPrice = val
                        updated[index].price = calcMRP(val, updated[index].discountType || '', Number(updated[index].discountPrice || 0))
                        return { ...prev, varient: updated }
                      })
                    }}
                    className="block w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-indigo-600"
                    placeholder="e.g. 999" min={0} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                  <input type="number" name="stock" value={item.stock}
                    onChange={e => handleVariantChange(e, index)}
                    className="block w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-indigo-600"
                    placeholder="e.g. 50" min={0} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                  <select name="discountType" value={item.discountType || ''}
                    onChange={e => {
                      const val = e.target.value
                      setFormData(prev => {
                        const updated = [...prev.varient]
                        updated[index].discountType = val
                        const sp = Number((updated[index] as any).totalPrice || 0)
                        updated[index].price = calcMRP(sp, val, Number(updated[index].discountPrice || 0))
                        return { ...prev, varient: updated }
                      })
                    }}
                    className="block w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-indigo-600">
                    <option value="">No Discount</option>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount {item.discountType === 'percentage' ? '(%)' : '(₹)'}
                  </label>
                  <input type="number" name="discountPrice" value={item.discountPrice || 0}
                    onChange={e => {
                      const val = Number(e.target.value)
                      setFormData(prev => {
                        const updated = [...prev.varient]
                        updated[index].discountPrice = val
                        const sp = Number((updated[index] as any).totalPrice || 0)
                        updated[index].price = calcMRP(sp, updated[index].discountType || '', val)
                        return { ...prev, varient: updated }
                      })
                    }}
                    className="block w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-indigo-600"
                    min={0} />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product MRP (auto)</label>
                  <input type="number" value={item.price || ''} readOnly
                    className="block w-full h-10 rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 cursor-not-allowed" />
                </div>
              </div>

              <VariantImageUploader
                variantIndex={index}
                variant={item}
                onThumbnailChange={handleThumbnailChange}
                onImagesAdd={handleImagesAdd}
                onImageRemove={handleImageRemove}
                onSetMainImage={handleSetMainImage}
                onToggleMainProduct={handleToggleMainProduct}
              />
            </div>
          )}
        </div>
      ))}

      {formData.varient.length === 0 && (
        <div className="bg-white rounded-lg p-8 text-center text-gray-400 border-2 border-dashed">
          <FaImage className="text-4xl mx-auto mb-3 opacity-30" />
          <p className="text-sm">No variants yet. Click &quot;Add Variant&quot;.</p>
        </div>
      )}
    </div>
  )
}

export default VariantSection