'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { RiAddLine, RiDeleteBin6Line, RiEdit2Line, RiEyeLine, RiFileCopyLine, RiLoader2Line, RiPlayCircleLine } from 'react-icons/ri';
import { delete_a_product, update_product_status, copy_product, get_admin_products } from '@/_services/admin/product';
import { categoryService } from '@/_services/common/categoryService';
import { Pagination } from '@/components/admin/Pagination';
import { formatCurrency } from '@/helpers/helpers';
import { effectivePricing, cardVideoId, youtubeThumb } from '@/lib/pricing';
import { AdminPageHeader, FilterBar, DataTable, Badge, Toggle, btn, useDebounced, type FilterDef } from '@/components/admin/ui';

const DEFAULTS: Record<string, string> = {
  category: 'all', status: 'all', stock: 'all', discount: 'all', type: 'all', minPrice: '', maxPrice: '', sort: 'newest',
};

export default function ProductListPage() {
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>();
  const [loading, setLoading] = useState(true);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);
  const [search, setSearch] = useState('');
  const [values, setValues] = useState<Record<string, string>>(DEFAULTS);
  const [page, setPage] = useState(1);
  const q = useDebounced(search);
  const vals = useDebounced(values, 250);

  useEffect(() => {
    categoryService.getAll('all').then((r: any) => setCategories(r?.categories || [])).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await get_admin_products({ page, limit: 15, search: q, ...vals });
      setRows(res?.products || []);
      setPagination(res?.pagination);
    } catch (e: any) {
      toast.error(e?.message || 'Products load nahi hue');
    } finally {
      setLoading(false);
    }
  }, [page, q, vals]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [q, vals]);

  const filters: FilterDef[] = [
    { key: 'category', label: 'Category', type: 'select', options: [{ value: 'all', label: 'All categories' }, ...categories.map((c) => ({ value: c._id, label: c.name }))] },
    { key: 'status', label: 'Status', type: 'select', options: [{ value: 'all', label: 'Any status' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] },
    { key: 'stock', label: 'Stock', type: 'select', options: [{ value: 'all', label: 'Any stock' }, { value: 'in', label: 'In stock' }, { value: 'low', label: 'Low (≤10)' }, { value: 'out', label: 'Out of stock' }] },
    { key: 'discount', label: 'Discount', type: 'select', options: [{ value: 'all', label: 'Any discount' }, { value: 'yes', label: 'Discounted' }, { value: 'no', label: 'No discount' }] },
    { key: 'type', label: 'Type', type: 'select', options: [{ value: 'all', label: 'All types' }, { value: 'simple', label: 'Simple' }, { value: 'variant', label: 'With variants' }, { value: 'customize', label: 'Customizable' }] },
    { key: 'minPrice', label: 'Min ₹', type: 'number', placeholder: 'Min ₹' },
    { key: 'maxPrice', label: 'Max ₹', type: 'number', placeholder: 'Max ₹' },
    { key: 'sort', label: 'Sort', type: 'select', options: [
      { value: 'newest', label: 'Newest' }, { value: 'oldest', label: 'Oldest' }, { value: 'price_asc', label: 'Price ↑' },
      { value: 'price_desc', label: 'Price ↓' }, { value: 'stock_asc', label: 'Stock ↑' }, { value: 'title', label: 'Name A–Z' },
    ] },
  ];

  const handleDelete = async (id: string) => {
    const r = await Swal.fire({ title: 'Delete product?', text: 'Ye wapas nahi aayega.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#e11d48', confirmButtonText: 'Delete' });
    if (!r.isConfirmed) return;
    try {
      await delete_a_product(id);
      setRows((p) => p.filter((x) => x._id !== id));
      toast.success('Product deleted');
    } catch { toast.error('Delete failed'); }
  };

  const handleStatus = async (id: string, current: boolean) => {
    setRows((p) => p.map((x) => (x._id === id ? { ...x, status: !current } : x)));
    try {
      await update_product_status(id, !current);
    } catch {
      setRows((p) => p.map((x) => (x._id === id ? { ...x, status: current } : x)));
      toast.error('Status update failed');
    }
  };

  const handleCopy = async (id: string) => {
    try {
      setCopyingId(id);
      const res: any = await copy_product(id);
      if (!res?.success) throw new Error(res?.message);
      toast.success(`"${res.data.title}" copy bana — edit page khul raha hai`);
      router.push(`/admin/products/edit/${res.data._id}`);
    } catch (e: any) { toast.error(e?.message || 'Copy failed'); } finally { setCopyingId(null); }
  };

  return (
    <div className="p-4 lg:p-6 max-w-[1500px] mx-auto">
      <AdminPageHeader
        title="Products"
        subtitle={pagination ? `${pagination.total} products` : 'Manage catalogue, pricing & stock'}
        actions={<Link href="/admin/products/new" className={btn.primary}><RiAddLine /> Add Product</Link>}
      />
      <FilterBar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Title, SKU ya slug se search…"
        filters={filters}
        values={values}
        onChange={(k, v) => setValues((p) => ({ ...p, [k]: v }))}
        onReset={() => { setValues(DEFAULTS); setSearch(''); }}
      />
      <DataTable head={['Product', 'Category', 'Price', 'Discount', 'Stock', 'Type', 'Active', '']} loading={loading} empty={!loading && rows.length === 0}>
        {rows.map((p) => {
          const pr = effectivePricing(p);
          const yt = cardVideoId(p);
          const thumb = yt ? youtubeThumb(yt) : p?.thumbnail?.url;
          const variantDiscounts = (p.varient || []).filter((v: any) => Number(v.discountPrice) > 0).length;
          return (
            <tr key={p._id} className="hover:bg-gray-50/60">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3 min-w-[260px]">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    {thumb && <Image src={thumb} alt={p.title} fill sizes="48px" className="object-cover" />}
                    {yt && <RiPlayCircleLine className="absolute inset-0 m-auto text-white text-xl drop-shadow" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate max-w-[320px]">{p.title}</p>
                    <p className="text-xs text-gray-400">{p.sku || '—'}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-600">{p?.category?.name || '—'}</td>
              <td className="px-4 py-3">
                <p className="font-semibold">{formatCurrency(pr.final)}</p>
                {pr.hasDiscount && <p className="text-xs text-gray-400 line-through">{formatCurrency(pr.mrp)}</p>}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-1 items-start">
                  {pr.hasDiscount ? <Badge tone="rose">{pr.discountType === 'percentage' ? `${pr.discountPrice}%` : formatCurrency(pr.discountPrice)} off</Badge> : <Badge>None</Badge>}
                  {variantDiscounts > 0 && <Badge tone="indigo">{variantDiscounts} variant offers</Badge>}
                </div>
              </td>
              <td className="px-4 py-3">
                {p.stock <= 0 ? <Badge tone="rose">Out</Badge> : p.stock <= 10 ? <Badge tone="amber">{p.stock} left</Badge> : <Badge tone="green">{p.stock}</Badge>}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {p.isCustomize && <Badge tone="amber">Custom</Badge>}
                  {p.isVarientStatus && <Badge tone="indigo">{p.varient?.length || 0} variants</Badge>}
                  {!p.isCustomize && !p.isVarientStatus && <Badge>Simple</Badge>}
                </div>
              </td>
              <td className="px-4 py-3"><Toggle checked={!!p.status} onChange={() => handleStatus(p._id, !!p.status)} /></td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Link href={`/product-details/${p.slug}`} target="_blank" className={btn.icon} title="View"><RiEyeLine /></Link>
                  <Link href={`/admin/products/edit/${p._id}`} className={btn.icon} title="Edit"><RiEdit2Line /></Link>
                  <button onClick={() => handleCopy(p._id)} className={btn.icon} title="Duplicate" disabled={copyingId === p._id}>
                    {copyingId === p._id ? <RiLoader2Line className="animate-spin" /> : <RiFileCopyLine />}
                  </button>
                  <button onClick={() => handleDelete(p._id)} className={`${btn.icon} hover:text-rose-600`} title="Delete"><RiDeleteBin6Line /></button>
                </div>
              </td>
            </tr>
          );
        })}
      </DataTable>
      {pagination && pagination.pages > 1 && (
        <div className="mt-4"><Pagination pagination={pagination} onPageChange={(n: number) => setPage(n)} /></div>
      )}
    </div>
  );
}
