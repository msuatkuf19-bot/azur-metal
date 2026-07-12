'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { Button } from './Button';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badges?: ReactNode;
  backHref?: string;
  avatar?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: Breadcrumb[];
}

export function PageHeader({ title, subtitle, badges, backHref, avatar, actions, breadcrumb }: PageHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
      <div className="flex items-center space-x-3 min-w-0">
        {backHref && (
          <Link href={backHref}>
            <Button variant="ghost" size="sm">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Geri
            </Button>
          </Link>
        )}
        {avatar}
        <div className="min-w-0">
          {breadcrumb && breadcrumb.length > 0 && (
            <nav className="text-xs text-slate-400 mb-0.5 flex items-center gap-1 flex-wrap">
              {breadcrumb.map((b, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <span>/</span>}
                  {b.href ? (
                    <Link href={b.href} className="hover:text-slate-600">
                      {b.label}
                    </Link>
                  ) : (
                    <span>{b.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
          <h1 className="text-2xl font-bold text-slate-900 truncate">{title}</h1>
          <div className="flex items-center flex-wrap gap-2 mt-1">
            {subtitle && <span className="text-sm text-slate-500">{subtitle}</span>}
            {badges}
          </div>
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
