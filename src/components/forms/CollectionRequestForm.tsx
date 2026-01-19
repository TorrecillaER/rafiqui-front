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

      {/* Location */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Dirección de Recolección
          </label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" size={20} />
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Calle, Número, Colonia"
              className={`input-field pl-12 ${errors.address ? 'border-red-500 focus:border-red-500' : ''}`}
            />
          </div>
          {errors.address && (
            <p className="text-red-500 text-xs mt-1 ml-1">{errors.address}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Ciudad
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="Ciudad"
            className={`input-field ${errors.city ? 'border-red-500 focus:border-red-500' : ''}`}
          />
          {errors.city && (
            <p className="text-red-500 text-xs mt-1 ml-1">{errors.city}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Código Postal
          </label>
          <input
            type="text"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            placeholder="00000"
            className={`input-field ${errors.postalCode ? 'border-red-500 focus:border-red-500' : ''}`}
          />
          {errors.postalCode && (
            <p className="text-red-500 text-xs mt-1 ml-1">{errors.postalCode}</p>
          )}
        </div>
      </div>

      {/* Details */}
      <div>
        <label className="block text-sm font-medium text-dark-300 mb-2">
          Cantidad Estimada de Paneles
        </label>
        <div className="relative">
          <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" size={20} />
          <input
            type="number"
            name="panelCount"
            value={formData.panelCount}
            onChange={handleChange}
            min="1"
            className={`input-field pl-12 ${errors.panelCount ? 'border-red-500 focus:border-red-500' : ''}`}
          />
        </div>
        {errors.panelCount && (
          <p className="text-red-500 text-xs mt-1 ml-1">{errors.panelCount}</p>
        )}
      </div>

      {/* Contact */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Nombre de Contacto
          </label>
          <input
            type="text"
            name="contactName"
            value={formData.contactName}
            onChange={handleChange}
            placeholder="Nombre completo"
            className={`input-field ${errors.contactName ? 'border-red-500 focus:border-red-500' : ''}`}
          />
          {errors.contactName && (
            <p className="text-red-500 text-xs mt-1 ml-1">{errors.contactName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Teléfono
          </label>
          <input
            type="tel"
            name="contactPhone"
            value={formData.contactPhone}
            onChange={handleChange}
            placeholder="(00) 0000 0000"
            className={`input-field ${errors.contactPhone ? 'border-red-500 focus:border-red-500' : ''}`}
          />
          {errors.contactPhone && (
            <p className="text-red-500 text-xs mt-1 ml-1">{errors.contactPhone}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-dark-300 mb-2">
          Notas Adicionales (Opcional)
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="input-field resize-none"
          placeholder="Instrucciones de acceso, horarios preferidos, etc."
        />
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {submitStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400"
          >
            <AlertCircle size={20} />
            <p className="text-sm">{errorMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-lg disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" size={24} />
            Enviando Solicitud...
          </>
        ) : (
          <>
            <Send size={24} />
            Solicitar Recolección
          </>
        )}
      </button>
    </form>
  );
}
