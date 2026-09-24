'use client';
import { youtubeId, youtubeThumb } from '@/lib/pricing';

/** Product YouTube video — gallery me play hota hai, optional card thumbnail */
export default function VideoField({ value, asThumb, onChange, onToggleThumb }: {
  value?: string; asThumb?: boolean;
  onChange: (v: string) => void; onToggleThumb: (v: boolean) => void;
}) {
  const id = youtubeId(value);
  return (
    <div className="rounded-xl border border-gray-200 p-4 space-y-3 bg-gray-50/50">
      <label className="block font-medium text-gray-800">YouTube Video</label>
      <input
        type="url"
        value={value || ''}
        onChange={(e) => onChange(e.target.value.trim())}
        placeholder="https://youtu.be/xxxxxxxxxxx ya youtube.com/watch?v=… / shorts/…"
        className="block w-full h-10 rounded-lg bg-white px-3 text-sm border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
      />
      {value && !id && <p className="text-xs text-rose-600">Valid YouTube link nahi hai</p>}
      {id && (
        <div className="flex items-center gap-4">
          <div className="relative w-40 aspect-video rounded-lg overflow-hidden bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={youtubeThumb(id)} alt="video" className="w-full h-full object-cover" />
            <span className="absolute inset-0 flex items-center justify-center text-white text-2xl">▶</span>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={!!asThumb} onChange={(e) => onToggleThumb(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
            Is video ko product card / listing thumbnail bana do
          </label>
        </div>
      )}
      <p className="text-xs text-gray-500">The video will play on the second slide of the product page gallery.</p>
    </div>
  );
}
