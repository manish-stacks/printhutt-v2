"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { RiCloseLine, RiUploadCloud2Line } from "react-icons/ri";
import { personalizedGiftService } from "@/_services/common/personalizedGiftService";
import { toast } from "react-toastify";

interface Props {
    editData?: any;
    onClose: () => void;
}

const defaultForm = {
    name: "",
    badge: "",
    type: "image",
    sectionType: "Customized",
    link: "",
    sortOrder: 0,
    isActive: true,
    videoUrl: "",
};

const PersonalizedGiftForm = ({ editData, onClose }: Props) => {
    const [form, setForm] = useState({ ...defaultForm });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    // console.log("    editData", editData);
    useEffect(() => {
        if (editData) {
            setForm({
                name: editData.name || "",
                badge: editData.badge || "",
                type: editData.type || "image",
                sectionType: editData.sectionType || "Customized",
                link: editData.link || "",
                sortOrder: editData.sortOrder || 0,
                isActive: editData.isActive ?? true,
                videoUrl: editData.videoUrl || "",
            });
            if (editData.type === "image" && editData.media?.url) {
                setImagePreview(editData.media.url);
            }
        }
    }, [editData]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]:
                type === "checkbox"
                    ? (e.target as HTMLInputElement).checked
                    : value,
        }));

        // Jab type change ho to reset media fields
        if (name === "type") {
            setImageFile(null);
            setImagePreview("");
            setForm((prev) => ({ ...prev, type: value, videoUrl: "" }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("name", form.name);
            formData.append("badge", form.badge);
            formData.append("type", form.type);
            formData.append("sectionType", form.sectionType);
            formData.append("link", form.link);
            formData.append("sortOrder", String(form.sortOrder));
            formData.append("isActive", String(form.isActive));

            if (form.type === "video") {
                formData.append("videoUrl", form.videoUrl);
            } else {
                if (imageFile) {
                    formData.append("media", imageFile);
                }
            }

            if (editData?._id) {
                await personalizedGiftService.update(editData._id, formData);
            } else {
                await personalizedGiftService.create(formData);
            }

            onClose();
            toast.success("Item saved successfully");
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h3 className="text-lg font-bold text-gray-900">
                        {editData ? "Edit Item" : "Add New Item"}
                    </h3>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
                    >
                        <RiCloseLine size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            placeholder="Enter name"
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                        />
                    </div>

                    {/* Badge */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Badge
                        </label>
                        <input
                            type="text"
                            name="badge"
                            value={form.badge}
                            onChange={handleChange}
                            placeholder="e.g. New, Hot"
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                        />
                    </div>

                    {/* Type + SectionType */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type
                            </label>
                            <select
                                name="type"
                                value={form.type}
                                onChange={handleChange}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                            >
                                <option value="image">Image</option>
                                <option value="video">Video</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Section Type
                            </label>
                            <select
                                name="sectionType"
                                value={form.sectionType}
                                onChange={handleChange}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                            >
                                <option value="Customized">Customized</option>
                                <option value="Personalized">Personalized</option>
                            </select>
                        </div>
                    </div>

                    {/* Media: Image Upload OR Video URL */}
                    {form.type === "video" ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Video URL <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="url"
                                name="videoUrl"
                                value={form.videoUrl}
                                onChange={handleChange}
                                required={form.type === "video" && !editData}
                                placeholder="https://youtube.com/... or direct video URL"
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                YouTube, Vimeo ya direct video link paste karo
                            </p>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Image {!editData && <span className="text-red-500">*</span>}
                            </label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-gray-400 transition min-h-[120px]"
                            >
                                {imagePreview ? (
                                    <div className="relative w-24 h-28">
                                        <Image
                                            src={imagePreview}
                                            alt="Preview"
                                            fill
                                            className="object-cover rounded-lg"
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <RiUploadCloud2Line size={28} className="text-gray-400" />
                                        <p className="text-sm text-gray-500">
                                            Click to upload image
                                        </p>
                                        <p className="text-xs text-gray-400">PNG, JPG, WEBP</p>
                                    </>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>
                    )}

                    {/* Link */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Link <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="link"
                            value={form.link}
                            onChange={handleChange}
                            required
                            placeholder="/category/personalized"
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                        />
                    </div>

                    {/* Sort Order + isActive */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Sort Order
                            </label>
                            <input
                                type="number"
                                name="sortOrder"
                                value={form.sortOrder}
                                onChange={handleChange}
                                min={0}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                            />
                        </div>
                        <div className="flex flex-col justify-end">
                            <label className="flex items-center gap-2 cursor-pointer pb-2.5">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={form.isActive}
                                        onChange={handleChange}
                                        className="sr-only peer"
                                    />
                                    <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-black transition-colors" />
                                    <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">
                                    Active
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-black text-white rounded-xl py-2.5 text-sm font-medium hover:bg-gray-900 transition disabled:opacity-60"
                        >
                            {loading ? "Saving..." : editData ? "Update" : "Create"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PersonalizedGiftForm;