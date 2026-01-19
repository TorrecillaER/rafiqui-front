'use client';

import { useState } from 'react';
import { certificateApi } from '@/lib/api';

interface UseDownloadCertificateReturn {
  downloadCertificate: (userId?: string) => Promise<void>;
  downloadFullReport: () => Promise<void>;
  isDownloading: boolean;
  isDownloadingReport: boolean;
  error: string | null;
}

export function useDownloadCertificate(): UseDownloadCertificateReturn {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadCertificate = async (userId?: string) => {
    setIsDownloading(true);
    setError(null);

    try {
      await certificateApi.downloadESGCertificate(userId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al descargar el certificado';
      setError(errorMessage);
      throw err;
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadFullReport = async () => {
    setIsDownloadingReport(true);
    setError(null);

    try {
      await certificateApi.downloadFullReport();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al descargar el reporte';
      setError(errorMessage);
      throw err;
    } finally {
      setIsDownloadingReport(false);
    }
  };

  return {
    downloadCertificate,
    downloadFullReport,
    isDownloading,
    isDownloadingReport,
    error,
  };
}
