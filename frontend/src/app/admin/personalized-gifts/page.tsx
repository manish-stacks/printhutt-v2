"use client";
import { useEffect, useState } from "react";
import { RiAddLine, RiDeleteBin6Line, RiEdit2Line, RiImageLine, RiVideoLine, RiYoutubeLine, RiAppsLine } from "react-icons/ri";
import { personalizedGiftService } from "@/_services/common/personalizedGiftService";
import PersonalizedGiftForm from "./PersonalizedGiftForm";
import { toast } from "react-toastify";

const MAX_PER_SECTION = 10;
type Tab = "all" | "Customized" | "Personalized";

const SECTIONS: { value: Exclude<Tab, "all">; title: string }[] = [
  { value: "Customized", title: "Gifts That Glow With Emotion" },
  { value: "Personalized", title: "Personalized Gifts Crafted With Love" },
];

const ytId = (u = "") => u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i)?.[1];

const TYPE_META: Record<string, { label: string; icon: any; cls: string }> = {
  image: { label: "Image", icon: RiImageLine, cls: "bg-blue-50 text-blue-700" },
  video: { label: "Video link", icon: RiVideoLine, cls: "bg-purple-50 text-purple-700" },
  youtube: { label: "YouTube", icon: RiYoutubeLine, cls: "bg-red-50 text-red-700" },
};

function Thumb({ item }: { item: any }) {
  const box = "h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100 object-cover";
  if (item.type === "youtube") {
    const id = ytId(item.videoUrl);
    return id ? <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" className={box} /> : <div className={box} />;
  }
  if (item.type === "video") return <video src={item.videoUrl || item.media?.url} className={`${box} bg-black`} muted preload="metadata" />;
  return item.media?.url ? <img src={item.media.url} alt={item.name} className={box} /> : <div className={box} />;
}

export default function PersonalizedGiftPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("all");

  const fetchData = async () => {
    try {
      const r: any = await personalizedGiftService.all();
      setItems(r?.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const count = (s: string) => items.filter((i) => i.sectionType === s).length;
  const shown = tab === "all" ? items : items.filter((i) => i.sectionType === tab);
  const allFull = SECTIONS.every((s) => count(s.value) >= MAX_PER_SECTION);
  const defaultSection = (tab !== "all" && count(tab) < MAX_PER_SECTION ? tab : SECTIONS.find((s) => count(s.value) < MAX_PER_SECTION)?.value) || "Customized";

  const remove = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    try { await personalizedGiftService.delete(id); toast.success("Item deleted"); fetchData(); } catch (e) { console.error(e); }
  };

  const tabBtn = (value: Tab, label: string, n: number, max?: number) => {
    const active = tab === value;
    const full = max !== undefined && n >= max;
    return (
      <button key={value} onClick={() => setTab(value)}
        className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${active ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}>
        {value === "all" && <RiAppsLine />}
        <span>{label}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${active ? "bg-white/20" : full ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"}`}>
          {n}{max !== undefined && `/${max}`}
        </span>
      </button>
    );
  };

  return (
    <div className="ph-page">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Personalized Gifts</h2>
          <p className="text-sm text-gray-500">Each home page section shows up to {MAX_PER_SECTION} items. Use an image upload, a direct video link or a YouTube link.</p>
        </div>
        <button onClick={() => { setEditData(null); setOpen(true); }} disabled={allFull}
          className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-300">
          <RiAddLine /> Add item
        </button>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {tabBtn("all", "All", items.length)}
        {SECTIONS.map((s) => tabBtn(s.value, s.title, count(s.value), MAX_PER_SECTION))}
      </div>

      {tab !== "all" && count(tab) >= MAX_PER_SECTION && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          This section is full ({MAX_PER_SECTION}/{MAX_PER_SECTION}). Delete an item to add a new one.
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>{["Media", "Name", "Source", "Section", "Order", "Status", ""].map((h) => <th key={h} className="p-4 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-400">Loading…</td></tr>
            ) : shown.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-400">No items yet</td></tr>
            ) : shown.map((item) => {
              const m = TYPE_META[item.type] || TYPE_META.image;
              const Icon = m.icon;
              return (
                <tr key={item._id} className="border-t transition hover:bg-gray-50">
                  <td className="p-4"><Thumb item={item} /></td>
                  <td className="p-4">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    {item.badge && <p className="text-xs text-gray-500">Badge: {item.badge}</p>}
                  </td>
                  <td className="p-4"><span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${m.cls}`}><Icon />{m.label}</span></td>
                  <td className="p-4 text-gray-600">{item.sectionType === "Customized" ? "Gifts That Glow" : "Crafted With Love"}</td>
                  <td className="p-4 text-gray-600">{item.sortOrder ?? 0}</td>
                  <td className="p-4"><span className={`rounded-full px-3 py-1 text-xs font-medium ${item.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{item.isActive ? "Active" : "Inactive"}</span></td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setEditData(item); setOpen(true); }} aria-label="Edit" className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600 hover:bg-blue-200"><RiEdit2Line /></button>
                      <button onClick={() => remove(item._id)} aria-label="Delete" className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600 hover:bg-red-200"><RiDeleteBin6Line /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {open && (
        <PersonalizedGiftForm editData={editData} defaultSection={defaultSection} onClose={() => { setOpen(false); fetchData(); }} />
      )}
    </div>
  );
}
