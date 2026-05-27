"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { RiAddLine, RiDeleteBin6Line, RiEdit2Line } from "react-icons/ri";
import { personalizedGiftService } from "@/_services/common/personalizedGiftService";
import PersonalizedGiftForm from "./PersonalizedGiftForm";
import { toast } from "react-toastify";

const PersonalizedGiftPage = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editData, setEditData] = useState<any>(null);

    const fetchData = async () => {
        try {
            const response = await personalizedGiftService.all();
            setItems(response?.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this item?")) return;
        try {
            await personalizedGiftService.delete(id);
            fetchData();
            toast.success("Item deleted successfully");
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="p-6 py-12">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Personalized Gifts</h2>
                <button
                    onClick={() => {
                        setEditData(null);
                        setOpen(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-black text-white px-5 py-3"
                >
                    <RiAddLine />
                    Add New
                </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border bg-white">
                <table className="w-full">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-4 text-left">Media</th>
                            <th className="p-4 text-left">Name</th>
                            <th className="p-4 text-left">Badge</th>
                            <th className="p-4 text-left">Type</th>
                            <th className="p-4 text-left">Section</th>
                            <th className="p-4 text-left">Status</th>
                            <th className="p-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-gray-400">
                                    Loading...
                                </td>
                            </tr>
                        ) : items.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-gray-400">
                                    No items found
                                </td>
                            </tr>
                        ) : (
                            items.map((item: any) => (
                                <tr key={item._id} className="border-t hover:bg-gray-50 transition">
                                    {/* Media Preview */}
                                    <td className="p-4">
                                        {item.type === "video" ? (
                                            // Video ke liye videoUrl use karo
                                            item.videoUrl ? (
                                                <video
                                                    src={item.videoUrl}
                                                    className="w-16 h-20 rounded-lg object-cover bg-black"
                                                    muted
                                                    preload="metadata"
                                                />
                                            ) : (
                                                <div className="w-16 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">
                                                    No URL
                                                </div>
                                            )
                                        ) : (
                                            // Image ke liye media.url use karo
                                            item.media?.url ? (
                                                <Image
                                                    src={item.media.url}
                                                    alt={item.name}
                                                    width={64}
                                                    height={80}
                                                    className="rounded-lg object-cover w-16 h-20"
                                                />
                                            ) : (
                                                <div className="w-16 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">
                                                    No Image
                                                </div>
                                            )
                                        )}
                                    </td>

                                    <td className="p-4 font-medium">{item.name}</td>
                                    <td className="p-4 text-gray-500">{item.badge || "—"}</td>
                                    <td className="p-4 capitalize">{item.type}</td>
                                    <td className="p-4 text-gray-500">{item.sectionType}</td>

                                    {/* Status Badge */}
                                    <td className="p-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${item.isActive
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-red-100 text-red-700"
                                                }`}
                                        >
                                            {item.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>

                                    {/* Actions */}
                                    <td className="p-4">
                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                onClick={() => {
                                                    setEditData(item);
                                                    setOpen(true);
                                                }}
                                                className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200 transition"
                                            >
                                                <RiEdit2Line />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item._id)}
                                                className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition"
                                            >
                                                <RiDeleteBin6Line />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Form Modal */}
            {open && (
                <PersonalizedGiftForm
                    editData={editData}
                    onClose={() => {
                        setOpen(false);
                        fetchData();
                    }}
                />
            )}
        </div>
    );
};

export default PersonalizedGiftPage;