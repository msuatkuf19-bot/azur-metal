'use client';

export default function ProjectCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm aspect-square flex flex-col animate-pulse">
      <div className="p-5 flex flex-col flex-1">
        {/* Header Skeleton */}
        <div className="mb-4">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="flex items-center gap-2">
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-5 bg-gray-200 rounded w-16" />
          </div>
        </div>

        {/* Metrics Skeleton */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center p-2 bg-gray-100 rounded-lg">
              <div className="h-3 bg-gray-200 rounded w-12 mx-auto mb-2" />
              <div className="h-4 bg-gray-200 rounded w-16 mx-auto" />
            </div>
          ))}
        </div>

        {/* Progress Skeleton */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="h-3 bg-gray-200 rounded w-12" />
            <div className="h-3 bg-gray-200 rounded w-8" />
          </div>
          <div className="h-2 bg-gray-200 rounded-full" />
        </div>

        {/* Footer Skeleton */}
        <div className="mt-auto pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="h-3 bg-gray-200 rounded w-20" />
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
