'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import {
  JOB_STATUS_LABELS,
  JOB_STATUS_COLORS,
  PROFITABILITY_COLORS,
} from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ProjectCardProps {
  project: any;
  onMenuOpen: (id: string) => void;
  isMenuOpen: boolean;
}

export default function ProjectCard({ project, onMenuOpen, isMenuOpen }: ProjectCardProps) {
  const router = useRouter();

  const getRelativeTime = (date: Date | string) => {
    const now = new Date();
    const target = new Date(date);
    const diffMs = now.getTime() - target.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 60) return `${diffMinutes} dk önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    return formatDate(target);
  };

  const getWorkerInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const workerColors = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
  ];

  return (
    <div
      className="group relative bg-white rounded-xl border border-gray-200 shadow-sm 
                 hover:shadow-xl hover:border-primary-300 hover:-translate-y-1
                 transition-all duration-300 cursor-pointer overflow-hidden
                 aspect-square flex flex-col"
      onClick={() => router.push(`/admin/projeler/${project.id}`)}
    >
      {/* Gradient top border on hover */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-400 to-primary-600 
                      opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Quick Actions Menu */}
      <div className="absolute top-3 right-3 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMenuOpen(project.id);
          }}
          className="p-1.5 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200
                     opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <div
            className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <Link
              href={`/admin/projeler/${project.id}`}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Projeyi Aç
            </Link>
            <Link
              href={`/admin/projeler/${project.id}/duzenle`}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Düzenle
            </Link>
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Kopyala
            </button>
            <hr className="my-1" />
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              Arşivle
            </button>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="mb-4">
          <h3 className="font-bold text-lg text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
            {project.projeAdi}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-gray-500">{project.musteriAdi}</span>
            <Badge className={`${JOB_STATUS_COLORS[project.durum as keyof typeof JOB_STATUS_COLORS]} text-xs`}>
              {JOB_STATUS_LABELS[project.durum as keyof typeof JOB_STATUS_LABELS]}
            </Badge>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Tahsilat</p>
            <p className="text-sm font-semibold text-emerald-600">
              {formatCurrency(project.metrics.totalCollection)}
            </p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Maliyet</p>
            <p className="text-sm font-semibold text-orange-600">
              {formatCurrency(project.metrics.totalCost)}
            </p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Kâr</p>
            <p className={`text-sm font-semibold ${PROFITABILITY_COLORS[project.metrics.profitability as keyof typeof PROFITABILITY_COLORS]}`}>
              {formatCurrency(project.metrics.profit)}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>İlerleme</span>
            <span>%{project.progress}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            {/* Last Activity */}
            <div className="flex-1 min-w-0">
              {project.lastActivity ? (
                <p className="text-xs text-gray-500 truncate">
                  {getRelativeTime(project.lastActivity.date)}
                </p>
              ) : (
                <p className="text-xs text-gray-400">Aktivite yok</p>
              )}
            </div>

            {/* Worker Avatars */}
            {project.workers.length > 0 && (
              <div className="flex -space-x-2">
                {project.workers.map((worker: any, index: number) => (
                  <div
                    key={worker.id}
                    className={`w-7 h-7 rounded-full ${workerColors[index % workerColors.length]} 
                               flex items-center justify-center text-white text-xs font-medium
                               border-2 border-white shadow-sm`}
                    title={worker.fullName}
                  >
                    {getWorkerInitials(worker.fullName)}
                  </div>
                ))}
                {project.workers.length > 3 && (
                  <div className="w-7 h-7 rounded-full bg-gray-400 flex items-center justify-center 
                                 text-white text-xs font-medium border-2 border-white shadow-sm">
                    +{project.workers.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
