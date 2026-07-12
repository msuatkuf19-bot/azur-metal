'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { globalSearch, type SearchResults } from '@/app/actions/global';

const CATEGORY_LABELS: { key: keyof SearchResults; label: string }[] = [
  { key: 'jobs', label: 'İş Emirleri' },
  { key: 'workers', label: 'Personel' },
  { key: 'suppliers', label: 'Toptancılar' },
  { key: 'materials', label: 'Malzemeler' },
];

export function GlobalSearch({ className = '' }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const r = await globalSearch(query);
      setResults(r);
      setLoading(false);
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const hasResults = results && CATEGORY_LABELS.some((c) => results[c.key].length > 0);

  const goTo = (href: string) => {
    setOpen(false);
    setQuery('');
    setResults(null);
    router.push(href);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          type="text"
          placeholder="İş emri, proje, personel, toptancı ara..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute mt-1 left-0 right-0 bg-white rounded-xl border border-slate-200 shadow-lg max-h-96 overflow-y-auto z-40">
          {loading && <div className="p-4 text-sm text-slate-400 text-center">Aranıyor...</div>}
          {!loading && !hasResults && <div className="p-4 text-sm text-slate-400 text-center">Sonuç bulunamadı</div>}
          {!loading &&
            results &&
            CATEGORY_LABELS.map(
              (cat) =>
                results[cat.key].length > 0 && (
                  <div key={cat.key} className="py-1.5">
                    <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{cat.label}</p>
                    {results[cat.key].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => goTo(item.href)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between gap-2"
                      >
                        <span className="text-sm font-medium text-slate-800 truncate">{item.label}</span>
                        {item.sublabel && <span className="text-xs text-slate-400 shrink-0">{item.sublabel}</span>}
                      </button>
                    ))}
                  </div>
                )
            )}
        </div>
      )}
    </div>
  );
}
