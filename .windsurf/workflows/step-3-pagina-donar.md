---
description: Crear formulario de solicitud de recolección de paneles
---

# Crear Página de Donación

Este workflow implementa el formulario para solicitar recolección de paneles solares.

## Contexto

La página `/donar` permite a cualquier usuario (GUEST, DONOR, PARTNER) solicitar la recolección de paneles solares en desuso.

## Elementos

- Formulario moderno con validación
- Campos: Dirección, Cantidad de Paneles, Tipo (Residencial/Industrial)
- Simulación de envío a API
- Feedback de éxito/error
- Animaciones suaves

## Pasos

### 1. Crear componente de formulario

Crear `src/components/forms/CollectionRequestForm.tsx`:

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

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate success (90% chance)
      if (Math.random() > 0.1) {
        setSubmitStatus('success');
        setFormData(initialFormData);
      } else {
        throw new Error('Error de conexión');
      }
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'panelCount' ? parseInt(value) || 0 : value,
    }));
    // Clear error when user types
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
          Número de referencia: <span className="text-primary-400 font-mono">REQ-{Date.now().toString(36).toUpperCase()}</span>
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
            <span>Hubo un error al enviar la solicitud. Por favor intenta de nuevo.</span>
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

### 2. Crear página de donación

Crear `src/app/donar/page.tsx`:

```typescript
'use client';

import { motion } from 'framer-motion';
import { CollectionRequestForm } from '@/components/forms/CollectionRequestForm';
import { Recycle, Truck, CheckCircle, Leaf, Clock, Shield } from 'lucide-react';

export default function DonarPage() {
  const benefits = [
    {
      icon: <Truck className="text-primary-400" size={24} />,
      title: 'Recolección Gratuita',
      description: 'Recogemos tus paneles sin costo alguno.',
    },
    {
      icon: <Recycle className="text-primary-400" size={24} />,
      title: 'Reciclaje Certificado',
      description: 'Procesamos con estándares internacionales.',
    },
    {
      icon: <Leaf className="text-primary-400" size={24} />,
      title: 'Certificado de Impacto',
      description: 'Recibe un reporte de tu contribución ambiental.',
    },
  ];

  const steps = [
    { number: '01', title: 'Solicita', description: 'Llena el formulario con tus datos' },
    { number: '02', title: 'Confirmamos', description: 'Te contactamos en 24-48 hrs' },
    { number: '03', title: 'Recolectamos', description: 'Pasamos por tus paneles' },
    { number: '04', title: 'Reciclamos', description: 'Transformamos los materiales' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-eco-gradient" />
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/30 rounded-full text-primary-400 text-sm font-medium mb-6">
                <Recycle size={16} />
                Solicitar Recolección
              </span>
              
              <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
                Dona tus Paneles,{' '}
                <span className="text-gradient">Transforma el Futuro</span>
              </h1>
              
              <p className="text-lg text-dark-300 mb-8">
                Cada panel solar en desuso contiene materiales valiosos que pueden tener 
                una segunda vida. Solicita la recolección gratuita y sé parte del cambio.
              </p>

              {/* Benefits */}
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="p-2 bg-primary-500/10 rounded-lg">
                      {benefit.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{benefit.title}</h3>
                      <p className="text-dark-400 text-sm">{benefit.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right: Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="card">
                <h2 className="text-xl font-bold text-white mb-6">
                  Solicitar Recolección
                </h2>
                <CollectionRequestForm />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-20 px-4 border-t border-dark-700">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-display font-bold text-white mb-4">
              ¿Cómo Funciona?
            </h2>
            <p className="text-dark-400">
              Un proceso simple y transparente de principio a fin.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-dark-700" />
                )}
                <div className="relative z-10 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500/10 border border-primary-500/30 mb-4">
                    <span className="text-2xl font-display font-bold text-primary-400">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-dark-400 text-sm">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 px-4 bg-dark-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <Clock className="text-primary-400 mb-3" size={32} />
              <p className="text-2xl font-bold text-white">24-48 hrs</p>
              <p className="text-dark-400 text-sm">Tiempo de respuesta</p>
            </div>
            <div className="flex flex-col items-center">
              <Shield className="text-primary-400 mb-3" size={32} />
              <p className="text-2xl font-bold text-white">100%</p>
              <p className="text-dark-400 text-sm">Proceso certificado</p>
            </div>
            <div className="flex flex-col items-center">
              <CheckCircle className="text-primary-400 mb-3" size={32} />
              <p className="text-2xl font-bold text-white">2,500+</p>
              <p className="text-dark-400 text-sm">Paneles procesados</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
```

// turbo
### 3. Verificar compilación

```bash
npm run dev
```

## Verificación Final

- [ ] `CollectionRequestForm.tsx` creado con validación
- [ ] `page.tsx` en `/donar` creado
- [ ] Formulario tiene campos: dirección, ciudad, CP, cantidad, tipo, contacto
- [ ] Selector de tipo (Residencial/Industrial) funciona
- [ ] Contador de paneles funciona (+/-)
- [ ] Validación muestra errores
- [ ] Simulación de envío funciona
- [ ] Pantalla de éxito se muestra
- [ ] Animaciones funcionan correctamente
- [ ] App compila sin errores

## Siguiente Paso

Continúa con `/step-4-pagina-market` para crear el marketplace de materiales y galería de arte.
