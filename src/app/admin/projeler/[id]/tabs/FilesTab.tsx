'use client';

import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatFileSize, formatDate } from '@/lib/utils';
import { FILE_CATEGORY_LABELS } from '@/lib/constants';

interface FilesTabProps {
  project: any;
}

export default function FilesTab({ project }: FilesTabProps) {
  const files = project.files || [];

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return (
        <svg className="w-8 h-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    if (mimeType === 'application/pdf') {
      return (
        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  // Group by category
  const filesByCategory = files.reduce((acc: any, file: any) => {
    const category = file.kategori || 'Diger';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(file);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Upload Button */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Dosya Yükle</h3>
              <p className="text-sm text-gray-500 mt-1">Fotoğraf, keşif görseli, çizim veya evrak yükleyebilirsiniz</p>
            </div>
            <Button disabled>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Dosya Yükle (Yakında)
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Files Grid */}
      {files.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300">
          <CardBody className="text-center py-16">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz dosya yok</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              Projeye ait fotoğraflar, belgeler ve diğer dosyalar burada görünecek
            </p>
          </CardBody>
        </Card>
      ) : (
        Object.entries(filesByCategory).map(([category, categoryFiles]: [string, any]) => (
          <Card key={category}>
            <CardHeader>
              <h3 className="text-lg font-semibold">
                {FILE_CATEGORY_LABELS[category as keyof typeof FILE_CATEGORY_LABELS] || category}
                <span className="text-sm font-normal text-gray-500 ml-2">({categoryFiles.length})</span>
              </h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {categoryFiles.map((file: any) => (
                  <div
                    key={file.id}
                    className="group relative bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex flex-col items-center">
                      {getFileIcon(file.mimeType)}
                      <p className="text-sm font-medium text-gray-900 mt-2 text-center line-clamp-2">
                        {file.dosyaAdi}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatFileSize(file.dosyaBoyutu)}
                      </p>
                    </div>
                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex space-x-2">
                        <button className="p-2 bg-white rounded-full hover:bg-gray-100">
                          <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button className="p-2 bg-white rounded-full hover:bg-gray-100">
                          <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        ))
      )}
    </div>
  );
}
