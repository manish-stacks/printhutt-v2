'use client';
import React from 'react';
import { RiSearchLine, RiCloseLine, RiFilter3Line, RiRefreshLine } from 'react-icons/ri';

/* ───────── Page header ───────── */
export function AdminPageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="ph-page-head flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-[24px] sm:text-[28px] font-bold text-gray-900 tracking-tight leading-tight">{title}</h1>
        {subtitle && <p className="text-[14px] text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ───────── Stat cards ───────── */
export function StatGrid({ items }: { items: { label: string; value: React.ReactNode; tone?: 'indigo' | 'green' | 'amber' | 'rose' | 'slate' }[] }) {
  const tones: Record<string, string> = {
    indigo: 'from-indigo-50 to-white text-indigo-700', green: 'from-emerald-50 to-white text-emerald-700',
    amber: 'from-amber-50 to-white text-amber-700', rose: 'from-rose-50 to-white text-rose-700', slate: 'from-slate-50 to-white text-slate-700',
  };
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      {items.map((s) => (
        <div key={s.label} className={`rounded-2xl border border-[#e8eaf0] bg-gradient-to-br ${tones[s.tone || 'slate']} p-4`}>
          <p className="text-[13px] font-semibold text-gray-500">{s.label}</p>
          <p className="text-[26px] font-bold mt-1 tabular-nums leading-tight">{s.value}</p>
        </div>
      ))}
    </div>
  );
}

/* ───────── Filter bar ───────── */
export type FilterOption = { value: string; label: string };
export type FilterDef =
  | { key: string; label: string; type: 'select'; options: FilterOption[] }
  | { key: string; label: string; type: 'number' | 'date' | 'text'; placeholder?: string };

export function FilterBar({
  search, onSearch, searchPlaceholder = 'Search…', filters = [], values, onChange, onReset, right,
}: {
  search?: string;
  onSearch?: (v: string) => void;
  searchPlaceholder?: string;
  filters?: FilterDef[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onReset?: () => void;
  right?: React.ReactNode;
}) {
  const active = Object.entries(values).filter(([k, v]) => v && v !== 'all' && k !== 'sort').length + (search ? 1 : 0);
  return (
    <div className="bg-white rounded-2xl border border-[#e8eaf0] p-3 sm:p-4 mb-4">
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
        {onSearch && (
          <div className="relative flex-1 min-w-[220px]">
            
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search || ''}
              onChange={(e) => onSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none text-sm"
            />
            {search && (
              <button onClick={() => onSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700" aria-label="Clear">
                <RiCloseLine />
              </button>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <span className="hidden md:inline-flex items-center gap-1 text-xs text-gray-500 mr-1">
          <RiFilter3Line /> Filters{active > 0 && <b className="ml-1 text-indigo-600">({active})</b>}
        </span>
        {filters.map((f) =>
          f.type === 'select' ? (
            <select
              key={f.key}
              value={values[f.key] ?? 'all'}
              onChange={(e) => onChange(f.key, e.target.value)}
              className="py-2 pl-3 pr-8 rounded-xl border border-gray-200 bg-white text-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none"
              title={f.label}
            >
              {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ) : (
            <input
              key={f.key}
              type={f.type}
              value={values[f.key] ?? ''}
              placeholder={f.placeholder || f.label}
              onChange={(e) => onChange(f.key, e.target.value)}
              className="w-32 py-2 px-3 rounded-xl border border-gray-200 bg-white text-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none"
              title={f.label}
            />
          )
        )}
        {onReset && active > 0 && (
          <button onClick={onReset} className="inline-flex items-center gap-1 py-2 px-3 rounded-xl text-sm text-gray-600 hover:bg-gray-100">
            <RiRefreshLine /> Reset
          </button>
        )}
        {right}
      </div>

    </div>
  );
}

/* ───────── Table shell ───────── */
export function DataTable({ head, children, loading, empty, colSpan }: {
  head: React.ReactNode[]; children: React.ReactNode; loading?: boolean; empty?: boolean; colSpan?: number;
}) {
  const span = colSpan || head.length;
  return (
    <div className="bg-white rounded-2xl border border-[#e8eaf0] overflow-hidden">
      <div className="overflow-x-auto max-h-[70vh]">
        <table className="w-full text-[14px] text-gray-700">
          <thead className="sticky top-0 z-[1] bg-[#f7f8fb] text-gray-500 text-[11.5px] uppercase tracking-wider">
            <tr>{head.map((h, i) => <th key={i} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}><td colSpan={span} className="px-4 py-4"><div className="h-5 bg-gray-100 rounded animate-pulse" /></td></tr>
              ))
            ) : empty ? (
              <tr><td colSpan={span} className="px-4 py-14 text-center text-gray-400">Koi record nahi mila — filters badal ke dekho</td></tr>
            ) : children}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Badge({ tone = 'slate', children }: { tone?: 'green' | 'rose' | 'amber' | 'indigo' | 'slate'; children: React.ReactNode }) {
  const t: Record<string, string> = {
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200', rose: 'bg-rose-50 text-rose-700 ring-rose-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200', indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200', slate: 'bg-slate-50 text-slate-600 ring-slate-200',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-semibold ring-1 ${t[tone]}`}>{children}</span>;
}

export function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onChange} disabled={disabled} aria-pressed={checked}
      className={`relative w-10 h-6 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-gray-300'} disabled:opacity-50`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
    </button>
  );
}

export const btn = {
  primary: 'inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-indigo-600 text-white text-[14px] font-semibold hover:bg-indigo-700 shadow-sm',
  ghost: 'inline-flex items-center justify-center gap-2 h-10 px-3.5 rounded-xl border border-[#e2e5ec] bg-white text-[14px] font-medium text-gray-700 hover:bg-gray-50',
  icon: 'w-9 h-9 inline-flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600',
};

/* ───────── Debounce + client-side filtering hook ───────── */
export function useDebounced<T>(value: T, ms = 350): T {
  const [v, setV] = React.useState(value);
  React.useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

/** Jin pages ka API filter support nahi karta — loaded rows pe client-side search/filter */
export function useClientFilter<T>(rows: T[], opts: {
  search: string;
  searchFields: (row: T) => (string | undefined | null)[];
  filters?: Record<string, (row: T, value: string) => boolean>;
  values?: Record<string, string>;
}) {
  const { search, searchFields, filters = {}, values = {} } = opts;
  return React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !searchFields(r).some((f) => String(f ?? '').toLowerCase().includes(q))) return false;
      for (const [k, fn] of Object.entries(filters)) {
        const v = values[k];
        if (v && v !== 'all' && !fn(r, v)) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, search, JSON.stringify(values)]);
}

/* ───────── Generic list filters (status + sort + extra selects) on loaded rows ───────── */
export function useListFilters<T extends Record<string, any>>(rows: T[], cfg: {
  statusKey?: string;                // 'status' | 'isActive' | 'isBlocked'…
  statusLabels?: [string, string];   // [true label, false label]
  nameKey?: string;                  // sort by name
  dateKey?: string;                  // sort by date (default createdAt)
  extra?: { key: string; label: string; options: FilterOption[]; test: (row: T, v: string) => boolean }[];
}) {
  const { statusKey, statusLabels = ['Active', 'Inactive'], nameKey = 'name', dateKey = 'createdAt', extra = [] } = cfg;
  const init: Record<string, string> = { status: 'all', sort: 'newest', ...Object.fromEntries(extra.map((e) => [e.key, 'all'])) };
  const [values, setValues] = React.useState<Record<string, string>>(init);

  const filtered = React.useMemo(() => {
    let out = [...(rows || [])];
    if (statusKey && values.status !== 'all') {
      const want = values.status === 'yes';
      out = out.filter((r) => {
        const v = r?.[statusKey];
        return (v === true || v === 'true') === want;
      });
    }
    for (const e of extra) {
      const v = values[e.key];
      if (v && v !== 'all') out = out.filter((r) => e.test(r, v));
    }
    const ts = (r: T) => new Date(r?.[dateKey] || 0).getTime();
    const nm = (r: T) => String(r?.[nameKey] ?? r?.title ?? r?.code ?? '').toLowerCase();
    if (values.sort === 'newest') out.sort((a, b) => ts(b) - ts(a));
    if (values.sort === 'oldest') out.sort((a, b) => ts(a) - ts(b));
    if (values.sort === 'az') out.sort((a, b) => nm(a).localeCompare(nm(b)));
    if (values.sort === 'za') out.sort((a, b) => nm(b).localeCompare(nm(a)));
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, JSON.stringify(values)]);

  const filters: FilterDef[] = [
    ...(statusKey ? [{
      key: 'status', label: 'Status', type: 'select' as const, options: [
        { value: 'all', label: 'Any status' }, { value: 'yes', label: statusLabels[0] }, { value: 'no', label: statusLabels[1] },
      ]
    }] : []),
    ...extra.map((e) => ({ key: e.key, label: e.label, type: 'select' as const, options: e.options })),
    {
      key: 'sort', label: 'Sort', type: 'select', options: [
        { value: 'newest', label: 'Newest' }, { value: 'oldest', label: 'Oldest' }, { value: 'az', label: 'A → Z' }, { value: 'za', label: 'Z → A' },
      ]
    },
  ];

  const toolbar = (
    <FilterBar
      filters={filters}
      values={values}
      onChange={(k, v) => setValues((p) => ({ ...p, [k]: v }))}
      onReset={() => setValues(init)}
      right={<span className="text-xs text-gray-500 ml-1">{filtered.length} / {rows?.length || 0} records</span>}
    />
  );
  return { rows: filtered, toolbar };
}
