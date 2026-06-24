'use client';
import { useEffect, useState } from 'react';
import { settingsService, type Setting } from '@/_services/admin/settings';
import { toast } from 'react-toastify';
import Image from 'next/image';
import { RiSaveLine, RiUploadCloud2Line } from 'react-icons/ri';

type TabKey = 'identity' | 'seo' | 'verification' | 'scripts' | 'robots';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'identity', label: 'Site Identity' },
  { key: 'seo', label: 'SEO Defaults' },
  { key: 'verification', label: 'Verification' },
  { key: 'scripts', label: 'Custom Scripts' },
  { key: 'robots', label: 'Robots.txt' },
];

// Field definitions per tab — easy to extend
const FIELDS: Record<TabKey, Array<{
  key: string;
  label: string;
  type: 'string' | 'html' | 'image' | 'boolean';
  placeholder?: string;
  rows?: number;
}>> = {
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
  // analytics group removed — Meta Pixel / GA / Clarity ab "Custom Scripts" tab se paste karein
  verification: [
    { key: 'googleSiteVerification', label: 'Google Site Verification', type: 'string' },
    { key: 'bingVerification', label: 'Bing Verification', type: 'string' },
  ],
  scripts: [
    { key: 'headScripts', label: 'Custom <head> scripts (HTML — XSS RISK)', type: 'html', rows: 10 },
    { key: 'bodyScripts', label: 'Custom <body> scripts (HTML — XSS RISK)', type: 'html', rows: 10 },
  ],
  robots: [
    { key: 'robotsTxt', label: 'robots.txt content', type: 'html', rows: 12 },
  ],
};

export default function SettingsPage() {
  const [tab, setTab] = useState<TabKey>('identity');
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await settingsService.adminAll();
        const map: Record<string, any> = {};
        (res?.data || []).forEach((s: Setting) => { map[s.key] = s; });
        setData(map);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setVal = (key: string, value: any, type: string) => {
    setData((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), key, value, type, group: tab },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const fields = FIELDS[tab];
      const payload: Setting[] = fields
        .filter((f) => f.type !== 'image') // image alag flow
        .map((f) => ({
          key: f.key,
          value: data[f.key]?.value ?? '',
          type: f.type === 'html' ? 'html' : 'string',
          group: tab,
          label: f.label,
        }));
      await settingsService.bulkUpsert(payload);
      toast.success('Settings saved');
    } catch (e: any) {
      toast.error(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (key: string, file: File) => {
    try {
      const fd = new FormData();
      fd.append('key', key);
      fd.append('group', tab);
      fd.append('image', file);
      const res: any = await settingsService.uploadImage(key, fd);
      // refresh
      setData((prev) => ({ ...prev, [key]: res?.data }));
      toast.success('Image uploaded');
    } catch (e: any) {
      toast.error(e?.message || 'Upload failed');
    }
  };

  if (loading) return <div className="p-10">Loading...</div>;

  return (
    <div className="max-w-8xl mx-auto p-6 lg:p-10">
      <h1 className="text-2xl font-bold mb-2">Site Settings</h1>
      <p className="text-gray-500 mb-6">Manage SEO, analytics, scripts and robots — changes go live after save.</p>

      <div className="bg-white rounded-lg shadow-md">
        {/* Tabs */}
        <div className="flex flex-wrap border-b">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.label}
            </button>
          ))}
          <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="ml-auto px-5 py-3 text-sm text-blue-500 hover:text-gray-800">
            Sitemap Automatically Generated
          </a>
        </div>

        {/* Fields */}
        <div className="p-6 space-y-5">
          {FIELDS[tab].map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>

              {f.type === 'string' && (
                <input
                  type="text"
                  value={data[f.key]?.value || ''}
                  onChange={(e) => setVal(f.key, e.target.value, 'string')}
                  placeholder={f.placeholder}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              )}

              {f.type === 'html' && (
                <textarea
                  value={data[f.key]?.value || ''}
                  onChange={(e) => setVal(f.key, e.target.value, 'html')}
                  rows={f.rows || 5}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              )}

              {f.type === 'image' && (
                <div className="flex items-center gap-4">
                  {data[f.key]?.value?.url && (
                    <Image
                      src={data[f.key].value.url}
                      alt={f.label}
                      width={80}
                      height={80}
                      className="rounded border object-cover"
                    />
                  )}
                  <label className="flex items-center gap-2 cursor-pointer bg-blue-50 border border-blue-200 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100">
                    <RiUploadCloud2Line className="h-5 w-5" />
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(f.key, file);
                      }}
                    />
                  </label>
                </div>
              )}
            </div>
          ))}

          {FIELDS[tab].some((f) => f.type !== 'image') && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              <RiSaveLine className="h-5 w-5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}