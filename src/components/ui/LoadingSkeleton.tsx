interface LoadingSkeletonProps {
  variant?: 'table' | 'card' | 'text' | 'stat-grid';
  rows?: number;
  className?: string;
}

export function LoadingSkeleton({ variant = 'card', rows = 5, className = '' }: LoadingSkeletonProps) {
  if (variant === 'table') {
    return (
      <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse ${className}`}>
        <div className="h-11 bg-slate-100 border-b border-slate-200" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-14 border-b border-slate-100 last:border-0" />
        ))}
      </div>
    );
  }

  if (variant === 'stat-grid') {
    return (
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200 animate-pulse" />
        ))}
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={`space-y-2 animate-pulse ${className}`}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-4 bg-slate-100 rounded" style={{ width: `${90 - i * 8}%` }} />
        ))}
      </div>
    );
  }

  return <div className={`h-40 bg-white rounded-2xl border border-slate-200 animate-pulse ${className}`} />;
}
