'use client';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { RiSaveLine, RiUploadCloud2Line, RiGiftLine, RiStore2Line, RiGlobalLine, RiSearchEyeLine, RiShieldCheckLine, RiCodeSSlashLine, RiRobot2Line } from 'react-icons/ri';
import { settingsService, type Setting } from '@/_services/admin/settings';
import { get_product_by_id } from '@/_services/admin/product';
import { AdminPageHeader, Toggle, btn } from '@/components/admin/ui';

type FieldType = 'string' | 'html' | 'image' | 'boolean' | 'number' | 'product';
type Field = { key: string; label: string; type: FieldType; placeholder?: string; rows?: number; help?: string };
type TabKey = 'store' | 'gift' | 'identity' | 'seo' | 'verification' | 'scripts' | 'robots';

const TABS: { key: TabKey; label: string; icon: React.ElementType; desc: string }[] = [
  { key: 'store', label: 'Storefront', icon: RiStore2Line, desc: 'Announcement, countdown, COD, trust widgets' },
  { key: 'gift', label: 'Free Gift', icon: RiGiftLine, desc: 'Automatic free gift based on cart value' },
  { key: 'identity', label: 'Site Identity', icon: RiGlobalLine, desc: 'Name, logo, favicon, theme' },
  { key: 'seo', label: 'SEO Defaults', icon: RiSearchEyeLine, desc: 'Default title / description' },
  { key: 'verification', label: 'Verification', icon: RiShieldCheckLine, desc: 'Google / Bing' },
  { key: 'scripts', label: 'Custom Scripts', icon: RiCodeSSlashLine, desc: 'Meta Pixel, GA, Clarity' },
  { key: 'robots', label: 'Robots.txt', icon: RiRobot2Line, desc: 'Crawler rules' },
];

const FIELDS: Record<TabKey, Field[]> = {
  store: [
    { key: 'announcementText', label: 'Announcement bar text', type: 'string', placeholder: 'Free shipping on all orders 🚚', help: 'Leave empty to hide the bar' },
    { key: 'announcementLink', label: 'Announcement link (optional)', type: 'string', placeholder: '/offer' },
    { key: 'codEnabled', label: 'Allow Cash on Delivery', type: 'boolean', help: 'Turning this OFF hides the COD option at checkout, and the server also rejects it' },
    { key: 'showDealCountdown', label: 'Show "Sale ends in" countdown on product page', type: 'boolean' },
    { key: 'dealCountdownMinutes', label: 'Countdown minutes', type: 'number', placeholder: '59' },
    { key: 'showVisitorCounter', label: 'Show "people viewing now" in footer', type: 'boolean' },
    { key: 'whatsappNumber', label: 'WhatsApp support number', type: 'string', placeholder: '91XXXXXXXXXX' },
  ],
  gift: [
    { key: 'giftEnabled', label: 'Free gift ON', type: 'boolean', help: 'Gift is auto-added as soon as the cart total crosses the threshold' },
    { key: 'giftProductId', label: 'Gift product', type: 'product', help: 'Paste the product ID (found in the Products list → Edit URL)' },
    { key: 'giftThreshold', label: 'Minimum cart value (₹)', type: 'number', placeholder: '1000' },
    { key: 'giftTitle', label: 'Gift name shown in cart', type: 'string', placeholder: 'Free Acrylic Photo Keychain' },
    { key: 'giftImage', label: 'Gift image (optional — otherwise product thumbnail)', type: 'image' },
  ],
  identity: [
    { key: 'siteName', label: 'Site Name', type: 'string', placeholder: 'PrintHutt' },
    { key: 'siteUrl', label: 'Site URL', type: 'string', placeholder: 'https://printhutt.com' },
    { key: 'themeColor', label: 'Theme Color (hex)', type: 'string', placeholder: '#3d4750' },
    { key: 'favicon', label: 'Favicon', type: 'image' },
    { key: 'logo', label: 'Logo', type: 'image' },
    { key: 'ogImage', label: 'Default OG Image', type: 'image' },
  ],
  seo: [
    { key: 'defaultTitle', label: 'Default Page Title', type: 'string' },
    { key: 'defaultDescription', label: 'Default Description', type: 'html', rows: 3 },
    { key: 'defaultKeywords', label: 'Default Keywords (comma-separated)', type: 'string' },
  ],
  verification: [
    { key: 'googleSiteVerification', label: 'Google Site Verification', type: 'string' },
    { key: 'bingVerification', label: 'Bing Verification', type: 'string' },
  ],
  scripts: [
    { key: 'headScripts', label: 'Custom <head> scripts', type: 'html', rows: 10, help: 'You can paste the full <script>…</script> — it loads correctly' },
    { key: 'bodyScripts', label: 'Custom <body> scripts', type: 'html', rows: 10 },
  ],
  robots: [{ key: 'robotsTxt', label: 'robots.txt content', type: 'html', rows: 12 }],
};

const DEFAULTS: Record<string, any> = { codEnabled: true, showDealCountdown: true, showVisitorCounter: true, giftEnabled: true, dealCountdownMinutes: 59, giftThreshold: 1000 };
const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none';

function ProductPreview({ id }: { id?: string }) {
  const [p, setP] = useState<any>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    setP(null); setErr(false);
    if (!id || !/^[a-f0-9]{24}$/i.test(id)) return;
    get_product_by_id(id).then((r: any) => setP(r?.product || r)).catch(() => setErr(true));
  }, [id]);
  if (!id) return null;
  if (err || (id && !/^[a-f0-9]{24}$/i.test(id))) return <p className="text-xs text-rose-600 mt-1">Product not found — check the ID</p>;
  if (!p) return <p className="text-xs text-gray-400 mt-1">Checking…</p>;
  return (
    <div className="mt-2 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-2">
      {p.thumbnail?.url && <Image src={p.thumbnail.url} alt={p.title} width={40} height={40} className="rounded-lg object-cover" />}
      <p className="text-sm text-emerald-800 font-medium">{p.title}</p>
    </div>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState<TabKey>('store');
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await settingsService.adminAll();
        const map: Record<string, any> = {};
        (res?.data || []).forEach((s: Setting) => { map[s.key] = s; });
        setData(map);
      } catch { toast.error('Failed to load settings'); } finally { setLoading(false); }
    })();
  }, []);

  const valueOf = (f: Field) => {
    const v = data[f.key]?.value;
    if (v === undefined || v === null || v === '') return DEFAULTS[f.key] ?? (f.type === 'boolean' ? false : '');
    if (f.type === 'boolean') return v === true || v === 'true';
    return v;
  };
  const setVal = (key: string, value: any, type: string) => {
    setDirty(true);
    setData((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), key, value, type, group: tab } }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload: Setting[] = FIELDS[tab]
        .filter((f) => f.type !== 'image')
        .map((f) => {
          const raw = valueOf(f);
          const value = f.type === 'number' ? Number(raw) || 0 : f.type === 'boolean' ? !!raw : String(raw ?? '').trim();
          const type = f.type === 'html' ? 'html' : f.type === 'number' ? 'number' : f.type === 'boolean' ? 'boolean' : 'string';
          return { key: f.key, value, type, group: tab, label: f.label } as Setting;
        });
      await settingsService.bulkUpsert(payload);
      setDirty(false);
      toast.success('Saved — live on storefront instantly');
    } catch (e: any) { toast.error(e?.message || 'Save failed'); } finally { setSaving(false); }
  };

  const handleImageUpload = async (key: string, file: File) => {
    try {
      const fd = new FormData();
      fd.append('key', key); fd.append('group', tab); fd.append('image', file);
      const res: any = await settingsService.uploadImage(key, fd);
      setData((prev) => ({ ...prev, [key]: res?.data }));
      toast.success('Image uploaded');
    } catch (e: any) { toast.error(e?.message || 'Upload failed'); }
  };

  const current = useMemo(() => TABS.find((t) => t.key === tab)!, [tab]);

  if (loading) return <div className="p-10 text-gray-400">Loading…</div>;

  return (
    <div>
      <AdminPageHeader
        title="Settings"
        subtitle="Storefront settings, SEO defaults, verification & scripts"
        actions={<button onClick={handleSave} disabled={saving} className={btn.primary}><RiSaveLine />{saving ? 'Saving…' : dirty ? 'Save changes' : 'Save'}</button>}
      />
      <div className="grid lg:grid-cols-[260px_1fr] gap-5">
        <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 h-fit lg:sticky lg:top-4 flex lg:flex-col gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm whitespace-nowrap transition ${tab === t.key ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
              <t.icon className="text-lg shrink-0" />{t.label}
            </button>
          ))}
        </nav>

        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2"><current.icon className="text-indigo-600" />{current.label}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{current.desc}</p>
          </div>
          <div className="p-6 space-y-6">
            {FIELDS[tab].map((f) => (
              <div key={f.key} className={f.type === 'boolean' ? 'flex items-start justify-between gap-6' : ''}>
                <div className={f.type === 'boolean' ? '' : 'mb-1.5'}>
                  <label className="block text-sm font-medium text-gray-800">{f.label}</label>
                  {f.help && <p className="text-xs text-gray-500 mt-0.5">{f.help}</p>}
                </div>
                {f.type === 'boolean' && <Toggle checked={!!valueOf(f)} onChange={() => setVal(f.key, !valueOf(f), 'boolean')} />}
                {(f.type === 'string' || f.type === 'product') && (
                  <>
                    <input type="text" value={valueOf(f)} onChange={(e) => setVal(f.key, e.target.value, 'string')} placeholder={f.placeholder} className={inputCls} />
                    {f.type === 'product' && <ProductPreview id={String(valueOf(f) || '').trim()} />}
                  </>
                )}
                {f.type === 'number' && (
                  <input type="number" min={0} value={valueOf(f)} onChange={(e) => setVal(f.key, e.target.value, 'number')} placeholder={f.placeholder} className={`${inputCls} max-w-[220px]`} />
                )}
                {f.type === 'html' && (
                  <textarea value={valueOf(f)} onChange={(e) => setVal(f.key, e.target.value, 'html')} rows={f.rows || 5} className={`${inputCls} font-mono`} />
                )}
                {f.type === 'image' && (
                  <div className="flex items-center gap-4">
                    {data[f.key]?.value?.url && (
                      <Image src={data[f.key].value.url} alt={f.label} width={72} height={72} className="rounded-xl border object-cover" />
                    )}
                    <label className={`${btn.ghost} cursor-pointer`}>
                      <RiUploadCloud2Line className="h-5 w-5" /> Upload
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(f.key, e.target.files[0])} />
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}