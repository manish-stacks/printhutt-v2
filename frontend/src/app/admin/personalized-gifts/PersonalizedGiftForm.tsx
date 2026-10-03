"use client";
import { useState, useEffect, useRef } from "react";
import { RiCloseLine, RiUploadCloud2Line, RiImageLine, RiVideoLine, RiYoutubeLine } from "react-icons/ri";
import { personalizedGiftService } from "@/_services/common/personalizedGiftService";
import { toast } from "react-toastify";

interface Props {
  editData?: any;
  defaultSection?: "Customized" | "Personalized";
  onClose: () => void;
}

type Source = "image" | "video" | "youtube";

const SOURCES: { value: Source; label: string; icon: any }[] = [
  { value: "image", label: "Image upload", icon: RiImageLine },
  { value: "video", label: "Video link", icon: RiVideoLine },
  { value: "youtube", label: "YouTube link", icon: RiYoutubeLine },
];

const input = "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10";
const label = "mb-1.5 block text-sm font-medium text-gray-700";

const ytId = (u: string) => u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i)?.[1];

export default function PersonalizedGiftForm({ editData, defaultSection = "Customized", onClose }: Props) {
  const [form, setForm] = useState({
    name: "", badge: "", type: "image" as Source, sectionType: defaultSection,
    link: "", sortOrder: 0, isActive: true, videoUrl: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editData) return;
    setForm({
      name: editData.name || "", badge: editData.badge || "", type: editData.type || "image",
      sectionType: editData.sectionType || "Customized", link: editData.link || "",
      sortOrder: editData.sortOrder || 0, isActive: editData.isActive ?? true,
      videoUrl: editData.type === "youtube" || editData.type === "video" ? editData.videoUrl || "" : "",
    });
    setPreview(editData.type === "image" ? editData.media?.url || "" : "");
  }, [editData]);

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const changeSource = (t: Source) => {
    if (t === form.type) return;
    setFile(null); setPreview(""); setForm((p) => ({ ...p, type: t, videoUrl: "" }));
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) return toast.error("Image is too large (max 10 MB)");
    setFile(f); setPreview(URL.createObjectURL(f));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.type === "youtube" && !ytId(form.videoUrl)) return toast.error("Please enter a valid YouTube link");
    if (form.type === "video" && !/^https?:\/\/\S+$/i.test(form.videoUrl.trim())) return toast.error("Please enter a valid video link");
    if (form.type === "image" && !file && !preview) return toast.error("Please upload an image");
    setLoading(true);
    try {
      const fd = new FormData();
      (["name", "badge", "type", "sectionType", "link"] as const).forEach((k) => fd.append(k, String(form[k])));
      fd.append("sortOrder", String(form.sortOrder));
      fd.append("isActive", String(form.isActive));
      if (form.type !== "image") fd.append("videoUrl", form.videoUrl.trim());
      else if (file) fd.append("media", file);
      if (editData?._id) await personalizedGiftService.update(editData._id, fd);
      else await personalizedGiftService.create(fd);
      toast.success("Saved successfully");
      onClose();
    } catch (err: any) {
      toast.error(err?.message || err?.response?.data?.message || "Could not save item");
    } finally {
      setLoading(false);
    }
  };

  const yid = ytId(form.videoUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{editData ? "Edit item" : "Add new item"}</h3>
            <p className="text-xs text-gray-500">Shown in the “{form.sectionType}” section on the home page</p>
          </div>
          <button onClick={onClose} type="button" className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200"><RiCloseLine size={18} /></button>
        </div>

        <form onSubmit={submit} className="space-y-5 p-6">
          {/* Media source */}
          <div>
            <span className={label}>Media source</span>
            <div className="grid grid-cols-3 gap-2">
              {SOURCES.map(({ value, label: l, icon: Icon }) => (
                <button key={value} type="button" onClick={() => changeSource(value)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-semibold transition ${form.type === value ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  <Icon size={20} />{l}
                </button>
              ))}
            </div>
          </div>

          {/* Media input */}
          {form.type === "youtube" ? (
            <div>
              <label className={label}>YouTube link <span className="text-red-500">*</span></label>
              <input className={input} value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://www.youtube.com/watch?v=... or /shorts/..." />
              {yid && (
                <div className="mt-3 overflow-hidden rounded-xl border bg-black">
                  <img src={`https://i.ytimg.com/vi/${yid}/hqdefault.jpg`} alt="YouTube preview" className="h-40 w-full object-cover" />
                </div>
              )}
            </div>
          ) : form.type === "video" ? (
            <div>
              <label className={label}>Video link <span className="text-red-500">*</span></label>
              <input className={input} value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://example.com/video.mp4" />
              <p className="mt-1 text-xs text-gray-400">Direct link to an MP4 or WEBM file. Vertical 9:16 works best.</p>
              {/^https?:\/\/\S+$/i.test(form.videoUrl.trim()) && (
                <video key={form.videoUrl} src={form.videoUrl.trim()} className="mt-3 h-40 rounded-xl bg-black" muted controls preload="metadata" />
              )}
            </div>
          ) : (
            <div>
              <label className={label}>Image <span className="text-red-500">*</span></label>
              <div onClick={() => fileRef.current?.click()}
                className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 p-4 transition hover:border-gray-400">
                {preview ? (
                  <img src={preview} alt="Preview" className="h-36 rounded-lg object-cover" />
                ) : (
                  <>
                    <RiUploadCloud2Line size={30} className="text-gray-400" />
                    <p className="text-sm text-gray-600">Click to upload an image</p>
                    <p className="text-xs text-gray-400">PNG, JPG or WEBP, vertical 9:16 works best</p>
                  </>
                )}
              </div>
              {preview && <button type="button" onClick={() => fileRef.current?.click()} className="mt-2 text-xs font-medium text-indigo-600 hover:underline">Replace file</button>}
              <input ref={fileRef} type="file" hidden onChange={onFile} accept="image/*" />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={label}>Name <span className="text-red-500">*</span></label>
              <input className={input} required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Custom LED Photo Lamp" />
            </div>
            <div>
              <label className={label}>Badge</label>
              <input className={input} value={form.badge} onChange={(e) => set("badge", e.target.value)} placeholder="e.g. New, Bestseller" />
            </div>
            <div>
              <label className={label}>Home page section</label>
              <select className={input} value={form.sectionType} onChange={(e) => set("sectionType", e.target.value)}>
                <option value="Customized">Gifts That Glow With Emotion</option>
                <option value="Personalized">Personalized Gifts Crafted With Love</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={label}>Link <span className="text-red-500">*</span></label>
              <input className={input} required value={form.link} onChange={(e) => set("link", e.target.value)} placeholder="/category/personalized" />
            </div>
            <div>
              <label className={label}>Sort order</label>
              <input type="number" min={0} className={input} value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} />
              <p className="mt-1 text-xs text-gray-400">Lower numbers appear first</p>
            </div>
            <div className="flex items-end pb-6">
              <label className="flex cursor-pointer items-center gap-3">
                <input type="checkbox" className="peer sr-only" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} />
                <span className="relative h-6 w-11 rounded-full bg-gray-300 transition peer-checked:bg-emerald-500 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 border-t pt-4">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-60">
              {loading ? "Saving…" : editData ? "Update item" : "Create item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
