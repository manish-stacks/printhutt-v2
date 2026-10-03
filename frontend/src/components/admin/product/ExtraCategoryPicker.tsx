'use client';
import { useEffect, useState } from 'react';
import Select from 'react-select';
import { get_parent_sub_categories } from '@/_services/admin/sub-category';

type Opt = { value: string; label: string };
interface Props {
  categories: { _id: string; name: string }[];
  mainCategory?: string;
  mainSubcategory?: string;
  extraCategories?: string[];
  extraSubcategories?: string[];
  onChange: (v: { extraCategories: string[]; extraSubcategories: string[] }) => void;
}

/** Product ko main category ke alawa aur categories/subcategories me bhi dikhane ke liye */
export default function ExtraCategoryPicker({ categories, mainCategory, mainSubcategory, extraCategories = [], extraSubcategories = [], onChange }: Props) {
  const [subOpts, setSubOpts] = useState<Opt[]>([]);
  const catOpts: Opt[] = categories.filter((c) => c._id !== mainCategory).map((c) => ({ value: c._id, label: c.name.toUpperCase() }));

  // selected extra categories ki subcategories load karo
  useEffect(() => {
    let alive = true;
    Promise.all(extraCategories.map((id) => get_parent_sub_categories(id).then((r: any) => r?.category || []).catch(() => [])))
      .then((lists) => {
        if (!alive) return;
        const seen = new Set<string>();
        setSubOpts(lists.flat().filter((s: any) => s._id !== mainSubcategory && !seen.has(s._id) && seen.add(s._id)).map((s: any) => ({ value: s._id, label: s.name.toUpperCase() })));
      });
    return () => { alive = false; };
  }, [extraCategories.join(','), mainSubcategory]);

  return (
    <div className="ph-section ph-section-row">
      <h3>Also show in other categories</h3>
      <p className="text-xs text-gray-500">
        The product keeps its main category above and will also appear on these category / sub category pages.
      </p>
      <label className="ph-label">Extra categories</label>
      <Select isMulti options={catOpts} placeholder="Select extra categories (optional)" classNamePrefix="ph-select"
        value={catOpts.filter((o) => extraCategories.includes(o.value))}
        onChange={(v) => onChange({ extraCategories: (v as Opt[]).map((o) => o.value), extraSubcategories })} />
      <label className="ph-label">Extra sub categories</label>
      <Select isMulti options={subOpts} classNamePrefix="ph-select" isDisabled={!extraCategories.length}
        placeholder={extraCategories.length ? 'Select extra sub categories (optional)' : 'Select an extra category first'}
        value={subOpts.filter((o) => extraSubcategories.includes(o.value))}
        onChange={(v) => onChange({ extraCategories, extraSubcategories: (v as Opt[]).map((o) => o.value) })} />
    </div>
  );
}
