"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import {
  RiAddLine, RiDeleteBin6Line, RiEdit2Line,
  RiImageLine, RiVideoLine, RiAppsLine, RiLockLine,
} from "react-icons/ri";
import { personalizedGiftService } from "@/_services/common/personalizedGiftService";
import PersonalizedGiftForm from "./PersonalizedGiftForm";
import { toast } from "react-toastify";

const MAX_PER_TYPE = 8;

const PersonalizedGiftPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");

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

  /* ─── Compute counts + limits ─── */
  const imageCount = items.filter((i: any) => i.type === "image").length;
  const videoCount = items.filter((i: any) => i.type === "video").length;
  const imageAtLimit = imageCount >= MAX_PER_TYPE;
  const videoAtLimit = videoCount >= MAX_PER_TYPE;

  /* ─── Filter items ─── */
  const filteredItems =
    filter === "all" ? items : items.filter((i: any) => i.type === filter);

  /* ─── Add New with limit guard ─── */
  const handleAddNew = () => {
    if (filter === "image" && imageAtLimit) {
      toast.error(`Image limit reached (${MAX_PER_TYPE}/${MAX_PER_TYPE}). Delete one first.`);
      return;
    }
    if (filter === "video" && videoAtLimit) {
      toast.error(`Video limit reached (${MAX_PER_TYPE}/${MAX_PER_TYPE}). Delete one first.`);
      return;
    }
    if (imageAtLimit && videoAtLimit) {
      toast.error("Both image and video limits reached. Delete some items first.");
      return;
    }
    setEditData(null);
    setOpen(true);
  };

  /* ─── Filter Tab component ─── */
  const FilterTab = ({
    value, label, count, max, icon: Icon,
  }: {
    value: "all" | "image" | "video";
    label: string;
    count: number;
    max?: number;
    icon: any;
  }) => {
    const isActive = filter === value;
    const atLimit = max !== undefined && count >= max;

    return (
      <button
        onClick={() => setFilter(value)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
          isActive
            ? "bg-black text-white border-black shadow-sm"
            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
        }`}
      >
        <Icon className="w-4 h-4" />
        <span>{label}</span>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            isActive
              ? "bg-white/20 text-white"
              : atLimit
                ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-700"
          }`}
        >
          {count}
          {max !== undefined && `/${max}`}
        </span>
        {atLimit && (
          <RiLockLine className={`w-3.5 h-3.5 ${isActive ? "text-white/80" : "text-red-500"}`} />
        )}
      </button>
    );
  };

  return (
    <div className="p-6 py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Personalized Gifts</h2>

        <button
          onClick={handleAddNew}
          disabled={imageAtLimit && videoAtLimit}
          className="inline-flex items-center gap-2 rounded-xl bg-black text-white px-5 py-3 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <RiAddLine />
          Add New
        </button>
      </div>

      {/* ─── Filter Tabs ─── */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <FilterTab value="all" label="All" count={items.length} icon={RiAppsLine} />
        <FilterTab
          value="image"
          label="Images"
          count={imageCount}
          max={MAX_PER_TYPE}
          icon={RiImageLine}
        />
        <FilterTab
          value="video"
          label="Videos"
          count={videoCount}
          max={MAX_PER_TYPE}
          icon={RiVideoLine}
        />
      </div>

      {/* ─── Limit warning banner ─── */}
      {(imageAtLimit || videoAtLimit) && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-center gap-2">
          <RiLockLine className="w-4 h-4 flex-shrink-0" />
          <span>
            {imageAtLimit && videoAtLimit
              ? "Both image and video limits reached. Delete some items to add new ones."
              : imageAtLimit
                ? `Image limit reached (${MAX_PER_TYPE}/${MAX_PER_TYPE}). Only video uploads allowed.`
                : `Video limit reached (${MAX_PER_TYPE}/${MAX_PER_TYPE}). Only image uploads allowed.`}
          </span>
        </div>
      )}

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
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">
                  {filter === "all"
                    ? "No items found"
                    : `No ${filter} items found`}
                </td>
              </tr>
            ) : (
              filteredItems.map((item: any) => (
                <tr key={item._id} className="border-t hover:bg-gray-50 transition">
                  {/* Media Preview */}
                  <td className="p-4">
                    {item.type === "video" ? (
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
                    ) : item.media?.url ? (
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
                    )}
                  </td>

                  <td className="p-4 font-medium">{item.name}</td>
                  <td className="p-4 text-gray-500">{item.badge || "—"}</td>
                  <td className="p-4 capitalize">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                        item.type === "video"
                          ? "bg-purple-50 text-[#3C2A6D]"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {item.type === "video" ? <RiVideoLine /> : <RiImageLine />}
                      {item.type}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500">{item.sectionType}</td>

                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

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
          availableTypes={{
            image: !imageAtLimit,
            video: !videoAtLimit,
          }}
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