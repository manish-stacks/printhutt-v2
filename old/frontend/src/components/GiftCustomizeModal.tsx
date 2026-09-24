"use client";

import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import {
  RiUploadCloud2Line,
  RiCloseLine,
  RiRefreshLine,
  RiGift2Line,
  RiImageLine,
  RiCheckLine,
} from "react-icons/ri";
import { useCartStore } from "@/store/useCartStore";
import { toast } from "react-toastify";
import { compressImage } from "@/utils/image-compress";

const FREE_GIFT_ID = "67b4756b5e05b7be01d85ea2";
const MAX_SIZE_MB = 10;

export default function GiftCustomizeModal({ onClose }: { onClose: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const [previewImage, setPreviewImage] = useState<string>("");
  const [fileObj, setFileObj] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);

  const { updateItem } = useCartStore();

  /* ── ESC + body scroll lock ── */
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  
  /* ─── File validator + compressor ─── */
  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large (max 5MB). Please use a smaller image.");
      return;
    }
    try {
      const result = await compressImage(file, { maxWidth: 1600, quality: 0.85, maxRawMB: 5 });
      setFileObj(result.file);
      setPreviewImage(result.dataUrl);

      // Optional log — see compression result
      console.log(
        `[compress] ${(file.size / 1024).toFixed(0)}KB → ${(result.compressedSize / 1024).toFixed(0)}KB`
      );
    } catch (e) {
      console.error("Compression failed:", e);
      toast.error("Image processing failed");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  /* ── Drag-and-drop ── */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleReset = () => {
    setPreviewImage("");
    setFileObj(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = () => {
    if (!previewImage || !fileObj) {
      toast.error("Please upload an image first");
      return;
    }

    setSaving(true);
    try {
      updateItem(FREE_GIFT_ID, {
        thumbnail: { url: previewImage },
        custom_data: {
          previewImage,
          fileName: fileObj.name,
          fileType: fileObj.type,
        },
      });
      toast.success("Gift image saved!");
      onClose();
    } catch (e) {
      toast.error("Failed to save");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  /* Format file size */
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[480px] max-h-[90vh] overflow-y-auto animate-pop-in">

        {/* ─── HEADER ─── */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
              <RiGift2Line className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg leading-tight">Customize Your Free Gift</h3>
              <p className="text-xs text-gray-500 mt-0.5">Upload a photo for personalization</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 flex items-center justify-center transition flex-shrink-0"
          >
            <RiCloseLine className="w-5 h-5" />
          </button>
        </div>

        {/* ─── BODY ─── */}
        <div className="p-5 sm:p-6">

          {/* Dropzone / Preview */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !previewImage && fileInputRef.current?.click()}
            className={`relative w-full aspect-[4/3] rounded-2xl border-2 border-dashed transition-all overflow-hidden ${isDragging
              ? "border-purple-500 bg-purple-50/50 scale-[0.99]"
              : previewImage
                ? "border-transparent bg-gray-50"
                : "border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-purple-50/30 cursor-pointer"
              }`}
          >
            {previewImage ? (
              <>
                <Image
                  src={previewImage}
                  alt="Preview"
                  fill
                  className="object-contain p-2"
                />
                {/* Floating reset button on hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReset();
                  }}
                  className="absolute top-2 right-2 w-8 h-8 bg-white/90 hover:bg-white shadow-md rounded-full flex items-center justify-center text-gray-700 hover:text-red-500 transition"
                  aria-label="Remove image"
                >
                  <RiCloseLine className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mb-3">
                  <RiUploadCloud2Line className="w-7 h-7 text-[#3C2A6D]" />
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  {isDragging ? "Drop your image here" : "Drag & drop your photo"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  or <span className="text-[#3C2A6D] font-medium">browse files</span>
                </p>
                <p className="text-[11px] text-gray-400 mt-2">
                  PNG, JPG · Max {MAX_SIZE_MB}MB
                </p>
              </div>
            )}
          </div>

          {/* File info (when uploaded) */}
          {fileObj && previewImage && (
            <div className="mt-3 flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                <RiImageLine className="w-4 h-4 text-[#3C2A6D]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">{fileObj.name}</p>
                <p className="text-[11px] text-gray-500">{formatSize(fileObj.size)}</p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-[#3C2A6D] hover:text-[#3C2A6D] font-semibold flex items-center gap-1 flex-shrink-0"
              >
                <RiRefreshLine className="w-3.5 h-3.5" /> Change
              </button>
            </div>
          )}

          {/* Info tip */}
          {!previewImage && (
            <p className="text-xs text-gray-500 text-center mt-3 px-2">
              💡 Use a clear, high-resolution photo for the best printing quality
            </p>
          )}

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            hidden
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleFileChange}
          />
        </div>

        {/* ─── FOOTER ─── */}
        <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 sm:flex-none sm:px-6 py-2.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!previewImage || saving}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#3C2A6D] to-pink-600 hover:from-[#3C2A6D] hover:to-pink-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-purple-200 transition active:scale-[0.99]"
          >
            <RiCheckLine className="w-4 h-4" />
            {saving ? "Saving..." : "Save Photo"}
          </button>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes pop-in {
          from { opacity: 0; transform: scale(0.94); }
          to   { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        .animate-pop-in  { animation: pop-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>
    </div>
  );
}