---
description: Conectar botón de descarga de certificado ESG con el endpoint del backend
---

# Step 28: ESG Certificate Frontend - Descarga de Certificado PDF

Este workflow conecta el botón "Descargar Certificado ESG" del dashboard con el endpoint del backend para descargar el PDF generado.

## Prerequisitos

- Haber completado el workflow `step-27-esg-certificate-backend` en el backend
- El endpoint `GET /dashboard/certificate` debe estar funcionando

---

## Paso 1: Agregar función de descarga en el API client

Modificar `src/lib/api.ts` para agregar la función de descarga:

```typescript
// Agregar al final del archivo, después de dashboardApi

export const certificateApi = {
  downloadESGCertificate: async (userId?: string): Promise<void> => {
    try {
      const params = userId ? `?userId=${userId}` : '';
      const response = await fetch(`${API_BASE_URL}/dashboard/certificate${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
        },
      });

      if (!response.ok) {
        throw new Error('Error al generar el certificado');
      }

      // Obtener el blob del PDF
      const blob = await response.blob();
      
      // Crear URL temporal para descarga
      const url = window.URL.createObjectURL(blob);
      
      // Crear elemento <a> temporal para descargar
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificado-esg-rafiqui-${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Simular click para descargar
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading certificate:', error);
      throw error;
    }
  },
};
```

---

## Paso 2: Crear hook para manejar la descarga

Crear archivo `src/hooks/useDownloadCertificate.ts`:

```typescript
'use client';

import { useState } from 'react';
import { certificateApi } from '@/lib/api';

interface UseDownloadCertificateReturn {
  downloadCertificate: (userId?: string) => Promise<void>;
  isDownloading: boolean;
  error: string | null;
}

export function useDownloadCertificate(): UseDownloadCertificateReturn {
  const [isDownloading, setIsDownloading] = useState(false);
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

  return {
    downloadCertificate,
    isDownloading,
    error,
  };
}
```

---

## Paso 3: Actualizar el componente del Dashboard

Modificar `src/app/dashboard/page.tsx` para conectar el botón:

### 3.1 Importar el hook

```typescript
// Agregar a los imports existentes
import { useDownloadCertificate } from '@/hooks/useDownloadCertificate';
```

### 3.2 Usar el hook en el componente

```typescript
export default function DashboardPage() {
  const router = useRouter();
  const { userRole, user } = useAuthStore();
  const { 
    esgMetrics, 
    monthlyData, 
    materialDistribution, 
    isLoading, 
    error, 
    isUsingMockData,
    refetch 
  } = useDashboardData();
  
  // Agregar el hook de descarga
  const { downloadCertificate, isDownloading, error: downloadError } = useDownloadCertificate();

  // Función para manejar la descarga
  const handleDownloadCertificate = async () => {
    try {
      await downloadCertificate(user?.id);
    } catch (err) {
      // El error ya se maneja en el hook
      console.error('Failed to download certificate');
    }
  };

  // ... resto del componente
}
```

### 3.3 Actualizar el botón de descarga

Buscar el botón actual (líneas 210-213):

```tsx
<button className="btn-accent flex items-center justify-center gap-2">
  <Download size={18} />
  Descargar Certificado ESG
</button>
```

Reemplazar con:

```tsx
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
```

---

## Paso 4: Agregar notificación de éxito/error (opcional)

Si el proyecto usa toast notifications (react-hot-toast, sonner, etc.):

```typescript
import { toast } from 'react-hot-toast'; // o la librería que uses

const handleDownloadCertificate = async () => {
  try {
    await downloadCertificate(user?.id);
    toast.success('Certificado descargado exitosamente');
  } catch (err) {
    toast.error('Error al descargar el certificado. Intenta de nuevo.');
  }
};
```

---

## Paso 5: Código completo del botón actualizado

```tsx
{/* Partner Benefits (only for PARTNER) */}
{userRole === 'PARTNER' && !isLoading && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4 }}
  >
    <div className="card bg-gradient-to-br from-dark-800 to-dark-900 border-accent-500/30">
      {/* ... contenido existente ... */}

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
        <button className="btn-outline flex items-center justify-center gap-2">
          <FileText size={18} />
          Ver Reporte Completo
        </button>
      </div>

      {/* Mostrar error si existe */}
      {downloadError && (
        <p className="mt-2 text-sm text-red-400">{downloadError}</p>
      )}
    </div>
  </motion.div>
)}
```

---

## Flujo de la Descarga

```
┌─────────────────────────────────────────────────────────────┐
│  Usuario hace click en "Descargar Certificado ESG"         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Se activa estado isDownloading = true                   │
│  2. Botón muestra "Generando..." con spinner                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend hace GET /dashboard/certificate?userId=xxx        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend:                                                   │
│  1. Calcula métricas ESG desde la BD                        │
│  2. Genera PDF con PDFKit                                   │
│  3. Retorna Buffer del PDF                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend:                                                  │
│  1. Recibe blob del PDF                                     │
│  2. Crea URL temporal con createObjectURL                   │
│  3. Crea elemento <a> con download attribute                │
│  4. Simula click para descargar                             │
│  5. Limpia recursos                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Navegador descarga: certificado-esg-rafiqui-2025-01-15.pdf │
└─────────────────────────────────────────────────────────────┘
```

---

## Verificación

1. Iniciar el backend: `cd rafiqui-back && npm run start:dev`
2. Iniciar el frontend: `cd rafiqui-front && npm run dev`
3. Navegar a `/dashboard` como usuario PARTNER
4. Hacer click en "Descargar Certificado ESG"
5. Verificar que se descarga el PDF con las métricas reales

---

## Archivos Modificados/Creados

| Archivo | Acción |
|---------|--------|
| `src/lib/api.ts` | Agregar `certificateApi` |
| `src/hooks/useDownloadCertificate.ts` | Crear nuevo |
| `src/app/dashboard/page.tsx` | Modificar botón de descarga |
