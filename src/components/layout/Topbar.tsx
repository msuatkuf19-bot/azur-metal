'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { GlobalSearch } from './GlobalSearch';
import { getRecentActivity } from '@/app/actions/global';
import { formatDateTime } from '@/lib/utils';

const SEGMENT_LABELS: Record<string, string> = {
  admin: 'Anasayfa',
  'is-emirleri': 'İş Emirleri',
  projeler: 'Projeler',
  tanimlamalar: 'Tanımlamalar',
  ustalar: 'Ustalar / İşçiler',
  toptancilar: 'Toptancılar',
  malzemeler: 'Malzemeler',
  yeni: 'Yeni',
  duzenle: 'Düzenle',
  yoklama: 'Yoklama',
  'personel-odemeleri': 'Personel Ödemeleri',
  'hesap-donemleri': 'Hesap Dönemleri',
  'malzeme-alimlari': 'Malzeme Alımları',
  'tedarikci-odemeleri': 'Tedarikçi Ödemeleri',
};

const ID_LIKE = /^[0-9a-f]{6,}-?/i;

function buildBreadcrumb(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  let acc = '';
  for (const seg of segments) {
    acc += `/${seg}`;
    if (ID_LIKE.test(seg) && seg.length > 20) continue; // skip raw ids
    crumbs.push({ label: SEGMENT_LABELS[seg] || seg, href: acc });
  }
  return crumbs;
}

const QUICK_ADD = [
  { label: 'Yeni İş Emri', href: '/admin/is-emirleri/yeni' },
  { label: 'Yeni Proje', href: '/admin/projeler/yeni' },
];

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'oluşturdu',
  UPDATE: 'güncelledi',
  DELETE: 'sildi',
  ACTIVATE: 'aktifleştirdi',
  CLOSE_PERIOD: 'dönem kapattı',
};

export function Topbar({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  const pathname = usePathname() || '/admin';
  const router = useRouter();
  const { data: session } = useSession();
  const crumbs = buildBreadcrumb(pathname);
  const pageTitle = crumbs[crumbs.length - 1]?.label || 'Dashboard';

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activity, setActivity] = useState<Awaited<ReturnType<typeof getRecentActivity>>>([]);
  const [activityLoaded, setActivityLoaded] = useState(false);

  const quickAddRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (quickAddRef.current && !quickAddRef.current.contains(e.target as Node)) setQuickAddOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openNotifications = async () => {
    setNotifOpen((v) => !v);
    if (!activityLoaded) {
      const data = await getRecentActivity(8);
      setActivity(data);
      setActivityLoaded(true);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200 h-16 flex items-center gap-3 px-4 lg:px-6">
      <button onClick={onOpenMobileMenu} className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg" aria-label="Menüyü aç">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="min-w-0 shrink-0 hidden sm:block">
        <h1 className="text-base font-semibold text-slate-900 truncate">{pageTitle}</h1>
        <nav className="hidden md:flex items-center gap-1 text-xs text-slate-400">
          {crumbs.map((c, i) => (
            <span key={c.href} className="flex items-center gap-1">
              {i > 0 && <span>/</span>}
              <Link href={c.href} className="hover:text-slate-600">
                {c.label}
              </Link>
            </span>
          ))}
        </nav>
      </div>

      <div className="flex-1 min-w-0 sm:max-w-md">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <div className="relative" ref={quickAddRef}>
          <button
            onClick={() => setQuickAddOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Hızlı Ekle</span>
          </button>
          {quickAddOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-30">
              {QUICK_ADD.map((item) => (
                <button
                  key={item.href}
                  onClick={() => {
                    setQuickAddOpen(false);
                    router.push(item.href);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative" ref={notifRef}>
          <button onClick={openNotifications} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg relative" aria-label="Bildirimler">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-1 w-80 bg-white rounded-xl border border-slate-200 shadow-lg max-h-96 overflow-y-auto z-30">
              <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100">Son Aktiviteler</p>
              {activity.length === 0 ? (
                <p className="p-4 text-sm text-slate-400 text-center">Henüz aktivite yok</p>
              ) : (
                activity.map((a) => (
                  <div key={a.id} className="px-3 py-2.5 border-b border-slate-50 last:border-0">
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">{a.user.adSoyad}</span> {ACTION_LABELS[a.action] || a.action.toLowerCase()}
                      {a.details && <span className="text-slate-500"> — {a.details}</span>}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(a.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="relative" ref={userRef}>
          <button onClick={() => setUserMenuOpen((v) => !v)} className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-700 font-semibold text-sm">{session?.user?.name?.charAt(0) || 'A'}</span>
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-30">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-800 truncate">{session?.user?.name}</p>
              </div>
              <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">
                Çıkış Yap
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
