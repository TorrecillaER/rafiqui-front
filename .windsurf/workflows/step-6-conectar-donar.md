---
description: Conectar formulario /donar con API Backend
---

# Conectar Página Donar con Backend

Este workflow conecta el formulario de solicitud de recolección con el endpoint `POST /collection-requests` del backend.

## Contexto

- **Frontend**: Next.js en `rafiqui-front`
- **Backend**: NestJS en `rafiqui-back` (puerto 4000)
- **Endpoint**: `POST /collection-requests`

## Pasos

### 1. Crear configuración de API

Crear `src/lib/api.ts`:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  statusCode: number;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.message || 'Error en la solicitud',
        statusCode: response.status,
      };
    }

    return {
      data,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      error: 'Error de conexión con el servidor',
      statusCode: 500,
    };
  }
}

// Collection Requests API
export interface CreateCollectionRequestDto {
  donorId?: string;
  pickupAddress: string;
  city: string;
  postalCode: string;
  estimatedCount: number;
  panelType: 'residential' | 'industrial';
  contactName: string;
  contactPhone: string;
  notes?: string;
}

export interface CollectionRequest {
  id: string;
  pickupAddress: string;
  estimatedCount: number;
  status: string;
  createdAt: string;
  donor?: {
    id: string;
    name: string;
    email: string;
  };
}

export const collectionRequestsApi = {
  create: (data: CreateCollectionRequestDto) =>
    apiRequest<CollectionRequest>('/collection-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getById: (id: string) =>
    apiRequest<CollectionRequest>(`/collection-requests/${id}`),

  getAll: () =>
    apiRequest<CollectionRequest[]>('/collection-requests'),
};
```

### 2. Crear archivo de variables de entorno

Crear `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Actualizar el formulario de recolección

Modificar `src/components/forms/CollectionRequestForm.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Hash,
  Building2,
  Home,
  Send,
  CheckCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { collectionRequestsApi, CreateCollectionRequestDto } from '@/lib/api';

type PanelType = 'residential' | 'industrial';

interface FormData {
  address: string;
  city: string;
  postalCode: string;
  panelCount: number;
  type: PanelType;
  contactName: string;
  contactPhone: string;
  notes: string;
}

const initialFormData: FormData = {
  address: '',
  city: '',
  postalCode: '',
  panelCount: 1,
  type: 'residential',
  contactName: '',
  contactPhone: '',
  notes: '',
};

export function CollectionRequestForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [requestId, setRequestId] = useState<string>('');
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.address.trim()) {
      newErrors.address = 'La dirección es requerida';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'La ciudad es requerida';
    }
    if (!formData.postalCode.trim()) {
      newErrors.postalCode = 'El código postal es requerido';
    }
    if (formData.panelCount < 1) {
      newErrors.panelCount = 'Debe ser al menos 1 panel';
    }
    if (!formData.contactName.trim()) {
      newErrors.contactName = 'El nombre de contacto es requerido';
    }
    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = 'El teléfono es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    const requestData: CreateCollectionRequestDto = {
      pickupAddress: `${formData.address}, ${formData.city}, ${formData.postalCode}`,
      city: formData.city,
      postalCode: formData.postalCode,
      estimatedCount: formData.panelCount,
      panelType: formData.type,
      contactName: formData.contactName,
      contactPhone: formData.contactPhone,
      notes: formData.notes || undefined,
    };

    const response = await collectionRequestsApi.create(requestData);

    if (response.error) {
      setSubmitStatus('error');
      setErrorMessage(response.error);
    } else if (response.data) {
      setSubmitStatus('success');
      setRequestId(response.data.id);
      setFormData(initialFormData);
    }

    setIsSubmitting(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'panelCount' ? parseInt(value) || 0 : value,
    }));
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  if (submitStatus === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card text-center py-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-500/20 mb-6"
        >
          <CheckCircle className="text-primary-400" size={40} />
        </motion.div>
        <h3 className="text-2xl font-bold text-white mb-2">¡Solicitud Enviada!</h3>
        <p className="text-dark-400 mb-6 max-w-md mx-auto">
          Hemos recibido tu solicitud de recolección. Nuestro equipo se pondrá en contacto
          contigo en las próximas 24-48 horas.
        </p>
        <p className="text-sm text-dark-500 mb-6">
          Número de referencia: <span className="text-primary-400 font-mono">{requestId.slice(0, 8).toUpperCase()}</span>
        </p>
        <button
          onClick={() => setSubmitStatus('idle')}
          className="btn-outline"
        >
          Enviar otra solicitud
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Type Selection */}
      <div>
        <label className="block text-sm font-medium text-dark-300 mb-3">
          Tipo de Instalación
        </label>
        <div className="grid grid-cols-2 gap-4">
          {[
            { value: 'residential', label: 'Residencial', icon: <Home size={24} /> },
            { value: 'industrial', label: 'Industrial', icon: <Building2 size={24} /> },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, type: option.value as PanelType }))}
              className={`p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
                formData.type === option.value
                  ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                  : 'border-dark-600 text-dark-400 hover:border-dark-500'
              }`}
            >
              {option.icon}
              <span className="font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Address Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-dark-300 flex items-center gap-2">
          <MapPin size={16} />
          Dirección de Recolección
        </h4>
        
        <div>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Calle y número"
            className={`input-field ${errors.address ? 'border-red-500' : ''}`}
          />
          {errors.address && (
            <p className="text-red-400 text-sm mt-1">{errors.address}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Ciudad"
              className={`input-field ${errors.city ? 'border-red-500' : ''}`}
            />
            {errors.city && (
              <p className="text-red-400 text-sm mt-1">{errors.city}</p>
            )}
          </div>
          <div>
            <input
              type="text"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleChange}
              placeholder="Código Postal"
              className={`input-field ${errors.postalCode ? 'border-red-500' : ''}`}
            />
            {errors.postalCode && (
              <p className="text-red-400 text-sm mt-1">{errors.postalCode}</p>
            )}
          </div>
        </div>
      </div>

      {/* Panel Count */}
      <div>
        <label className="block text-sm font-medium text-dark-300 mb-2 flex items-center gap-2">
          <Hash size={16} />
          Cantidad de Paneles
        </label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setFormData((prev) => ({ ...prev, panelCount: Math.max(1, prev.panelCount - 1) }))}
            className="w-12 h-12 rounded-xl bg-dark-700 text-white hover:bg-dark-600 transition-colors text-xl font-bold"
          >
            -
          </button>
          <input
            type="number"
            name="panelCount"
            value={formData.panelCount}
            onChange={handleChange}
            min="1"
            className="input-field w-24 text-center text-xl font-bold"
          />
          <button
            type="button"
            onClick={() => setFormData((prev) => ({ ...prev, panelCount: prev.panelCount + 1 }))}
            className="w-12 h-12 rounded-xl bg-dark-700 text-white hover:bg-dark-600 transition-colors text-xl font-bold"
          >
            +
          </button>
          <span className="text-dark-400 text-sm">
            {formData.type === 'industrial' && formData.panelCount >= 50
              ? '🚛 Recolección con camión'
              : '🚐 Recolección estándar'}
          </span>
        </div>
        {errors.panelCount && (
          <p className="text-red-400 text-sm mt-1">{errors.panelCount}</p>
        )}
      </div>

      {/* Contact Info */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-dark-300">Información de Contacto</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              name="contactName"
              value={formData.contactName}
              onChange={handleChange}
              placeholder="Nombre completo"
              className={`input-field ${errors.contactName ? 'border-red-500' : ''}`}
            />
            {errors.contactName && (
              <p className="text-red-400 text-sm mt-1">{errors.contactName}</p>
            )}
          </div>
          <div>
            <input
              type="tel"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              placeholder="Teléfono"
              className={`input-field ${errors.contactPhone ? 'border-red-500' : ''}`}
            />
            {errors.contactPhone && (
              <p className="text-red-400 text-sm mt-1">{errors.contactPhone}</p>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-dark-300 mb-2">
          Notas adicionales (opcional)
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Instrucciones especiales, horarios preferidos, etc."
          rows={3}
          className="input-field resize-none"
        />
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {submitStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400"
          >
            <AlertCircle size={20} />
            <span>{errorMessage || 'Hubo un error al enviar la solicitud. Por favor intenta de nuevo.'}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Enviando solicitud...
          </>
        ) : (
          <>
            <Send size={20} />
            Enviar Solicitud
          </>
        )}
      </button>

      <p className="text-center text-dark-500 text-sm">
        Al enviar, aceptas nuestros términos de servicio y política de privacidad.
      </p>
    </form>
  );
}
```

### 4. Actualizar DTO en Backend

Modificar `src/collection-requests/dto/create-collection-request.dto.ts` en **rafiqui-back**:

```typescript
import { IsString, IsInt, IsOptional, IsEnum, Min } from 'class-validator';

export enum PanelType {
  RESIDENTIAL = 'residential',
  INDUSTRIAL = 'industrial',
}

export class CreateCollectionRequestDto {
  @IsOptional()
  @IsString()
  donorId?: string;

  @IsString()
  pickupAddress: string;

  @IsString()
  city: string;

  @IsString()
  postalCode: string;

  @IsInt()
  @Min(1)
  estimatedCount: number;

  @IsEnum(PanelType)
  panelType: PanelType;

  @IsString()
  contactName: string;

  @IsString()
  contactPhone: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
```

### 5. Habilitar CORS en Backend

Modificar `src/main.ts` en **rafiqui-back**:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:4000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  await app.listen(4000);
  console.log('🚀 Backend running on http://localhost:4000');
}
bootstrap();
```

// turbo
### 6. Verificar conexión

```bash
# Terminal 1: Backend
cd rafiqui-back && npm run start:dev

# Terminal 2: Frontend
cd rafiqui-front && npm run dev
```

## Verificación Final

- [ ] `src/lib/api.ts` creado con funciones de API
- [ ] `.env.local` creado con URL del backend
- [ ] `CollectionRequestForm.tsx` actualizado para usar API real
- [ ] DTO del backend actualizado con nuevos campos
- [ ] CORS habilitado en backend
- [ ] Formulario envía datos al backend
- [ ] Backend guarda en PostgreSQL
- [ ] Mensaje de éxito muestra ID real de la solicitud

## Siguiente Paso

Continúa con `/step-7-conectar-market` para conectar el marketplace con los Assets reales.
