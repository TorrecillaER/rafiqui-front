---
description: Conectar botón de Ver Reporte Completo con el endpoint del backend
---

# Step 30: Full Report Frontend - Descarga de Reporte Completo PDF

Este workflow conecta el botón "Ver Reporte Completo" del dashboard con el endpoint del backend para descargar el PDF del reporte ESG completo.

## Prerequisitos

- Haber completado el workflow `step-29-full-report-backend` en el backend
- El endpoint `GET /dashboard/full-report` debe estar funcionando

---

## Paso 1: Agregar tipos y función de descarga en el API client

Modificar `src/lib/api.ts` para agregar la función de descarga del reporte completo:

```typescript
// Agregar después de CertificateResponse interface

// Full Report API Response Type
interface FullReportResponse {
  reportId: string;
  generatedAt: string;
  pdfBase64: string;
  fileSizeBytes: number;
  pageCount: number;
}

// Actualizar certificateApi para incluir el reporte completo
export const certificateApi = {
  downloadESGCertificate: async (userId?: string): Promise<void> => {
    // ... código existente ...
  },

  downloadFullReport: async (): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/full-report`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al generar el reporte');
      }

      const data: FullReportResponse = await response.json();
      
      // Convert base64 to blob
      const byteCharacters = atob(data.pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte-esg-completo-rafiqui-${new Date().toISOString().split('T')[0]}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading full report:', error);
      throw error;
    }
  },
};
```

---

## Paso 2: Actualizar el hook useDownloadCertificate

Modificar `src/hooks/useDownloadCertificate.ts` para incluir la descarga del reporte:

```typescript
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
```

---

## Paso 3: Actualizar el componente del Dashboard

Modificar `src/app/dashboard/page.tsx` para conectar el botón de reporte completo:

### 3.1 Actualizar la desestructuración del hook

```typescript
const { 
  downloadCertificate, 
  downloadFullReport,  // Agregar
  isDownloading, 
  isDownloadingReport,  // Agregar
  error: downloadError 
} = useDownloadCertificate();
```

### 3.2 Agregar función para manejar la descarga del reporte

```typescript
const handleDownloadFullReport = async () => {
  try {
    await downloadFullReport();
  } catch (err) {
    console.error('Failed to download full report');
  }
};
```

### 3.3 Actualizar el botón de "Ver Reporte Completo"

Buscar el botón actual (aproximadamente línea 238-241):

```tsx
<button className="btn-outline flex items-center justify-center gap-2">
  <FileText size={18} />
  Ver Reporte Completo
</button>
```

Reemplazar con:

```tsx
<button 
  onClick={handleDownloadFullReport}
  disabled={isDownloadingReport}
  className="btn-outline flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isDownloadingReport ? (
    <>
      <Loader2 size={18} className="animate-spin" />
      Generando Reporte...
    </>
  ) : (
    <>
      <FileText size={18} />
      Ver Reporte Completo
    </>
  )}
</button>
```

---

## Paso 4: Código completo de la sección de botones actualizada

```tsx
<div className="mt-6 pt-6 border-t border-dark-600 flex flex-col sm:flex-row gap-4">
  <button 
    onClick={handleDownloadCertificate}
    disabled={isDownloading}
    className="btn-accent flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {isDownloading ? (
      <>
        <Loader2 size={18} className="animate-spin" />
        Generando...
      </>
    ) : (
      <>
        <Download size={18} />
        Descargar Certificado ESG
      </>
    )}
  </button>
  <button 
    onClick={handleDownloadFullReport}
    disabled={isDownloadingReport}
    className="btn-outline flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {isDownloadingReport ? (
      <>
        <Loader2 size={18} className="animate-spin" />
        Generando Reporte...
      </>
    ) : (
      <>
        <FileText size={18} />
        Ver Reporte Completo
      </>
    )}
  </button>
</div>

{downloadError && (
  <p className="mt-2 text-sm text-red-400">{downloadError}</p>
)}
```

---

## Flujo de la Descarga

```
┌─────────────────────────────────────────────────────────────┐
│  Usuario hace click en "Ver Reporte Completo"               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Se activa estado isDownloadingReport = true             │
│  2. Botón muestra "Generando Reporte..." con spinner        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend hace GET /dashboard/full-report                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend:                                                   │
│  1. Recopila datos de todas las tablas                      │
│  2. Genera PDF de 6 páginas con PDFKit                      │
│  3. Retorna JSON con pdfBase64                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend:                                                  │
│  1. Recibe JSON con pdfBase64                               │
│  2. Convierte base64 a blob                                 │
│  3. Crea elemento <a> con download attribute                │
│  4. Simula click para descargar                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Navegador descarga:                                        │
│  reporte-esg-completo-rafiqui-2025-01-15.pdf (6 páginas)    │
└─────────────────────────────────────────────────────────────┘
```

---

## Diferencia entre Certificado y Reporte

| Aspecto | Certificado ESG | Reporte Completo |
|---------|-----------------|------------------|
| Endpoint | `/dashboard/esg-certificate` | `/dashboard/full-report` |
| Páginas | 1 | 6 |
| Tiempo generación | ~1 segundo | ~3-5 segundos |
| Nombre archivo | `certificado-esg-rafiqui-*.pdf` | `reporte-esg-completo-rafiqui-*.pdf` |
| Contenido | Métricas resumen | Datos detallados + tablas |

---

## Verificación

1. Iniciar el backend: `cd rafiqui-back && npm run start:dev`
2. Iniciar el frontend: `cd rafiqui-front && npm run dev`
3. Navegar a `/dashboard` como usuario PARTNER
4. Hacer click en "Ver Reporte Completo"
5. Verificar que se descarga el PDF de 6 páginas

---

## Archivos Modificados/Creados

| Archivo | Acción |
|---------|--------|
| `src/lib/api.ts` | Agregar `FullReportResponse` y `downloadFullReport` |
| `src/hooks/useDownloadCertificate.ts` | Agregar `downloadFullReport` y `isDownloadingReport` |
| `src/app/dashboard/page.tsx` | Modificar botón de reporte completo |
