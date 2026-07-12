'use client';

interface DetailTab {
  id: string;
  label: string;
  badge?: string | number;
}

interface DetailTabsProps {
  tabs: DetailTab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function DetailTabs({ tabs, activeTab, onChange, className = '' }: DetailTabsProps) {
  return (
    <div className={`border-b border-slate-200 overflow-x-auto ${className}`}>
      <nav className="flex space-x-1 min-w-max">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            type="button"
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
            {t.badge !== undefined && t.badge !== '' && Number(t.badge) > 0 && (
              <span className="text-xs bg-slate-100 text-slate-600 rounded-full px-1.5 py-0.5">{t.badge}</span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
