'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { pageService, PageData } from '@/_services/admin/page';
import { toast } from 'react-toastify';
import { RiLoader2Line, RiSaveLine, RiArrowLeftLine } from 'react-icons/ri';
import Link from 'next/link';
import 'quill/dist/quill.snow.css';

export default function EditPage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();

  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const editorRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<any>(null);

  // Load page
  useEffect(() => {
    (async () => {
      try {
        const res: any = await pageService.getBySlug(slug);
        setPage(res?.page);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load page');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  // Init Quill (client-only)
  useEffect(() => {
    if (loading || !page || !editorRef.current || quillRef.current) return;

    (async () => {
      const Quill = (await import('quill')).default;
      quillRef.current = new Quill(editorRef.current!, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link'],
            [{ align: [] }],
            ['clean'],
          ],
        },
      });
      quillRef.current.root.innerHTML = page.content || '';
    })();
  }, [loading, page]);

  const handleSave = async () => {
    if (!page || !quillRef.current) return;
    try {
      setSaving(true);
      const content = quillRef.current.root.innerHTML;
      await pageService.update(slug, {
        title: page.title,
        content,
        metaTitle: page.metaTitle,
        metaDescription: page.metaDescription,
        metaKeywords: page.metaKeywords,
      });
      toast.success('Page updated');
    } catch (e) {
      console.error(e);
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <RiLoader2Line className="h-10 w-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!page) {
    return <div className="text-center py-20 text-gray-500">Page not found</div>;
  }

  return (
    <div className="max-w-8xl mx-auto px-4 lg:px-10 py-16">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-5 flex justify-between items-start">
        <div>
          <Link
            href="/admin/pages"
            className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1 mb-2"
          >
            <RiArrowLeftLine /> Back to pages
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">Edit: {page.title}</h2>
          <p className="text-xs text-gray-500 mt-1">/{page.slug}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 disabled:opacity-60"
        >
          <RiSaveLine /> {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Form */}
      <div className="bg-white p-6 rounded-lg shadow space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={page.title}
            onChange={(e) => setPage({ ...page, title: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
          <div ref={editorRef} className="bg-white min-h-[400px]" />
        </div>

        {/* SEO */}
        <details className="bg-gray-50 rounded-lg p-4">
          <summary className="cursor-pointer font-medium text-gray-700">SEO Meta</summary>
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Meta Title</label>
              <input
                type="text"
                value={page.metaTitle || ''}
                onChange={(e) => setPage({ ...page, metaTitle: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Meta Description</label>
              <textarea
                value={page.metaDescription || ''}
                onChange={(e) => setPage({ ...page, metaDescription: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Meta Keywords</label>
              <input
                type="text"
                value={page.metaKeywords || ''}
                onChange={(e) => setPage({ ...page, metaKeywords: e.target.value })}
                placeholder="comma, separated, keywords"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}