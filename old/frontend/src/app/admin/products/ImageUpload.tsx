import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { FaTrash, FaStar } from 'react-icons/fa';
import { RiImageAddFill, RiLoader2Line, RiDraggable } from 'react-icons/ri';
import { toast } from 'react-toastify';
import { removeProductImage } from '@/_services/admin/product';

interface ImageType {
  url: string;
  public_id: string;
  fileType: string;
  file?: File;
  isMain?: boolean;
}

interface ImageUploadProps {
  onImagesChange: (images: ImageType[]) => void;
  images: ImageType[];
  productId: string;
}

export function ImageUpload({ onImagesChange, images, productId }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const validateFile = (file: File): boolean => {
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      toast.error('Only JPG, PNG, GIF allowed'); return false;
    }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return false; }
    return true;
  };

  const processFiles = (files: File[]) => {
    if (images.length + files.length > 10) { toast.error('Max 10 images'); return; }
    const valid = files.filter(validateFile);
    const newImgs: ImageType[] = valid.map(file => ({
      url: URL.createObjectURL(file),
      public_id: `new_${Math.random().toString(36).substring(7)}`,
      fileType: file.type,
      file,
      isMain: false,
    }));
    const merged = [...images, ...newImgs];
    if (!merged.some(img => img.isMain) && merged.length > 0) merged[0].isMain = true;
    onImagesChange(merged);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) processFiles(files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) processFiles(files);
  };

  // ✅ BUG FIX: blob URL (not yet uploaded) → sirf state se hata do, API call nahi
  const removeImage = async (public_id: string) => {
    const img = images.find(i => i.public_id === public_id);
    if (!img) return;

    const isUploaded = img.url.startsWith('http') && productId;

    if (isUploaded) {
      try {
        setDeletingId(public_id);
        const data = await removeProductImage(productId, img) as { success: boolean; message: string };
        if (data.success) toast.success(data.message || 'Removed');
      } catch { toast.error('Delete failed'); }
      finally { setDeletingId(null); }
    }

    // ✅ Always remove from state
    const remaining = images.filter(i => i.public_id !== public_id);
    if (img.isMain && remaining.length > 0) remaining[0].isMain = true;
    onImagesChange(remaining);
  };

  const setMain = (public_id: string) => {
    onImagesChange(images.map(img => ({ ...img, isMain: img.public_id === public_id })));
  };

  // ✅ Drag reorder
  const handleDragStartCard = (index: number) => { dragItem.current = index; };
  const handleDragEnterCard = (index: number) => { dragOver.current = index; };
  const handleDragEndCard = () => {
    if (dragItem.current === null || dragOver.current === null || dragItem.current === dragOver.current) {
      dragItem.current = null; dragOver.current = null; return;
    }
    const reordered = [...images];
    const [moved] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOver.current, 0, moved);
    dragItem.current = null; dragOver.current = null;
    onImagesChange(reordered);
  };

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
      >
        <div className="mx-auto flex flex-col items-center">
          <RiImageAddFill className="h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <label htmlFor="image-upload" className="cursor-pointer">
              <span className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">
                Upload Images
              </span>
              <input id="image-upload" type="file" multiple accept="image/jpeg,image/png,image/gif" className="hidden" onChange={handleChange} />
            </label>
          </div>
          <p className="mt-2 text-sm text-gray-500">Drop here or click · Drag cards to reorder · ⭐ set main</p>
        </div>
      </div>

      {/* ✅ Always render grid — no loading blocker */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={image.public_id}
              className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing
                ${image.isMain ? 'border-yellow-400 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
              draggable
              onDragStart={() => handleDragStartCard(index)}
              onDragEnter={() => handleDragEnterCard(index)}
              onDragEnd={handleDragEndCard}
              onDragOver={e => e.preventDefault()}
            >
              <div className="aspect-square relative">
                <Image src={image.url} alt="Product image" fill
                  sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />

                {image.isMain && (
                  <div className="absolute top-1 left-1 bg-yellow-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <FaStar size={8} /> Main
                  </div>
                )}

                <div className="absolute bottom-1 right-1 bg-black/40 text-white p-0.5 rounded opacity-0 group-hover:opacity-100 transition">
                  <RiDraggable size={12} />
                </div>
              </div>

              <div className="flex gap-1 p-1.5 bg-white">
                {!image.isMain && (
                  <button type="button" onClick={() => setMain(image.public_id)}
                    className="flex-1 text-[10px] font-semibold text-yellow-600 hover:bg-yellow-50 border border-yellow-300 rounded py-1 transition">
                    Set Main
                  </button>
                )}
                <button type="button" onClick={() => removeImage(image.public_id)}
                  disabled={deletingId === image.public_id}
                  className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white p-1.5 rounded transition disabled:opacity-50">
                  {deletingId === image.public_id
                    ? <RiLoader2Line size={12} className="animate-spin" />
                    : <FaTrash size={10} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}