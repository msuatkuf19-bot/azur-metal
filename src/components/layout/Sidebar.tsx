'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface NavItem {
  name: string;
  href: string;
  icon: JSX.Element;
}

interface NavGroup {
  name: string;
  items: NavItem[];
}

const icon = (d: string) => (
  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
  </svg>
);

const NAV_GROUPS: NavGroup[] = [
  {
    name: 'Genel Bakış',
    items: [{ name: 'Dashboard', href: '/admin', icon: icon('M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6') }],
  },
  {
    name: 'Operasyon',
    items: [
      { name: 'İş Emirleri', href: '/admin/is-emirleri', icon: icon('M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z') },
      { name: 'Projeler', href: '/admin/projeler', icon: icon('M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10') },
    ],
  },
  {
    name: 'Personel',
    items: [
      { name: 'Usta ve İşçiler', href: '/admin/tanimlamalar/ustalar', icon: icon('M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z') },
      { name: 'Yoklama', href: '/admin/yoklama', icon: icon('M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z') },
      { name: 'Personel Ödemeleri', href: '/admin/personel-odemeleri', icon: icon('M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z') },
      { name: 'Hesap Dönemleri', href: '/admin/hesap-donemleri', icon: icon('M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z') },
    ],
  },
  {
    name: 'Tedarik',
    items: [
      { name: 'Toptancılar', href: '/admin/tanimlamalar/toptancilar', icon: icon('M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4') },
      { name: 'Malzeme Alımları', href: '/admin/malzeme-alimlari', icon: icon('M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4') },
      { name: 'Tedarikçi Ödemeleri', href: '/admin/tedarikci-odemeleri', icon: icon('M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z') },
    ],
  },
  {
    name: 'Tanımlamalar',
    items: [{ name: 'Malzemeler', href: '/admin/tanimlamalar/malzemeler', icon: icon('M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z') }],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');
  const toggleGroup = (name: string) => setCollapsedGroups((s) => ({ ...s, [name]: !s[name] }));

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const content = (
    <>
      <div className={`flex items-center h-16 bg-slate-900 shrink-0 ${collapsed ? 'justify-center px-2' : 'justify-start px-4'}`}>
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          {!collapsed && <span className="text-lg font-bold text-white truncate">Azur Metal</span>}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.name}>
            {!collapsed && (
              <button
                onClick={() => toggleGroup(group.name)}
                className="w-full flex items-center justify-between px-2 mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors"
              >
                {group.name}
                <svg className={`w-3.5 h-3.5 transition-transform ${collapsedGroups[group.name] ? '-rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
            {!collapsedGroups[group.name] && (
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.name : undefined}
                      onClick={onCloseMobile}
                      className={`flex items-center px-2.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                        active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      } ${collapsed ? 'justify-center' : ''}`}
                    >
                      {item.icon}
                      {!collapsed && <span className="ml-3 truncate">{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className={`shrink-0 border-t border-slate-800 p-3 ${collapsed ? 'px-2' : ''}`}>
        <div className={`flex items-center mb-2 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
            <span className="text-white font-semibold text-sm">{session?.user?.name?.charAt(0) || 'A'}</span>
          </div>
          {!collapsed && (
            <div className="ml-2.5 min-w-0">
              <p className="text-sm font-medium text-white truncate">{session?.user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{(session?.user as any)?.username}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          title={collapsed ? 'Çıkış Yap' : undefined}
          className={`w-full flex items-center text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg px-2.5 py-2 transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && <span className="ml-2">Çıkış Yap</span>}
        </button>
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex w-full items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg px-2.5 py-2 mt-1 transition-colors"
          aria-label={collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
        >
          <svg className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className={`hidden lg:flex flex-col fixed inset-y-0 left-0 bg-slate-950 transition-all duration-200 z-30 ${collapsed ? 'w-[72px]' : 'w-64'}`}>
        {content}
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={onCloseMobile} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-slate-950 flex flex-col">{content}</div>
        </div>
      )}
    </>
  );
}

export { NAV_GROUPS };
