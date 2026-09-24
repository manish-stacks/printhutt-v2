'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RiEditBoxLine, RiLoader2Line } from 'react-icons/ri';
import { pageService, PageData } from '@/_services/admin/page';
import { toast } from 'react-toastify';

export default function AdminPagesList() {
  const [pages, setPages] = useState<PageData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await pageService.list();
        setPages(res?.pages || []);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load pages');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="max-w-8xl mx-auto px-4 lg:px-10 py-16">
      <div className="bg-white p-6 rounded-lg shadow-md mb-5">
        <h2 className="text-2xl font-bold text-gray-900">Static Pages</h2>
        <p className="text-gray-600">Edit content for legal & info pages</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <RiLoader2Line className="h-10 w-10 text-blue-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pages.map((p) => (
            <div
              key={p.slug}
              className="bg-white rounded-lg shadow p-5 flex justify-between items-start"
            >
              <div>
                <h3 className="font-bold text-lg text-gray-900">{p.title}</h3>
                <p className="text-xs text-gray-500 mt-1">/{p.slug}</p>
                {p.updatedAt && (
                  <p className="text-xs text-gray-400 mt-2">
                    Last updated: {new Date(p.updatedAt).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
              <Link
                href={`/admin/pages/${p.slug}`}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600"
              >
                <RiEditBoxLine /> Edit
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}