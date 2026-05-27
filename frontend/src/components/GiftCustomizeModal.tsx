"use client";
import Image from "next/image";
import { BiUpload, BiRefresh } from "react-icons/bi";
import { BsUpload } from "react-icons/bs";
import { useRef, useState } from "react";
import { useCartStore } from "@/store/useCartStore";
import { toast } from "react-toastify";

export default function GiftCustomizeModal({ onClose }: { onClose: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState("");
  const [fileObj, setFileObj] = useState<File | null>(null);

  const { updateItem } = useCartStore();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileObj(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const saveCustomization = () => {
    if (!previewImage || !fileObj) {
      toast.error("Please upload an image");
      return;
    }

    const FREE_ID = "67b4756b5e05b7be01d85ea2";

    updateItem(FREE_ID, {
      thumbnail: { url: previewImage }, // cart preview
      custom_data: {
        previewImage,     // base64 (for preview / order)
        fileName: fileObj.name,
        fileType: fileObj.type,
      },
    });

    toast.success("Gift image updated");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 w-[420px]">
        <h3 className="font-bold mb-4 text-lg">Customize Free Gift</h3>

        {/* Preview box */}
        <div className="relative w-full h-[220px] border-2 border-dashed rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
          {previewImage ? (
            <Image
              src={previewImage}
              alt="Preview"
              fill
              className="object-contain"
            />
          ) : (
            <BiUpload size={40} className="text-gray-400" />
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-md"
          >
            <BsUpload /> Choose Photo
          </button>

          {previewImage && (
            <button
              onClick={() => {
                setPreviewImage("");
                setFileObj(null);
              }}
              className="flex items-center gap-2 px-4 py-2 border rounded-md"
            >
              <BiRefresh /> Reset
            </button>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          hidden
          accept="image/*"
          onChange={handleImageUpload}
        />

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose}>Cancel</button>
          <button
            onClick={saveCustomization}
            className="bg-black text-white px-4 py-2 rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
