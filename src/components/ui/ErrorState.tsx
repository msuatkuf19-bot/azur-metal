'use client';

import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Bir şeyler ters gitti', description = 'Veriler yüklenirken bir hata oluştu.', onRetry }: ErrorStateProps) {
  return (
    <div className="text-center py-12 px-4">
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-danger-100 flex items-center justify-center text-danger-600">
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">{description}</p>
      {onRetry && (
        <Button size="sm" variant="secondary" className="mt-4" onClick={onRetry}>
          Tekrar Dene
        </Button>
      )}
    </div>
  );
}
