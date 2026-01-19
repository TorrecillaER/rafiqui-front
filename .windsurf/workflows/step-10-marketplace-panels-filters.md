---
description: Implementar marketplace de paneles reacondicionados con sidebar de filtros transparente
---

# Step 10: Marketplace de Paneles Reacondicionados con Filtros

Este workflow implementa el nuevo endpoint de marketplace para paneles reacondicionados (`/marketplace/groups`) con una sidebar de filtros estilo glassmorphism que se puede ocultar.

## Prerrequisitos

- [ ] Backend con endpoint `/marketplace/groups` funcionando
- [ ] Proyecto Next.js con Tailwind configurado
- [ ] Framer Motion instalado

---

## Paso 1: Agregar Tipos para Marketplace

Crear archivo `src/types/marketplace.ts`:

```typescript
// Grados de salud del panel
export type HealthGrade = 'A' | 'B' | 'C';

// Rangos de potencia predefinidos
export type PowerRange = 'LOW' | 'MEDIUM' | 'HIGH';

// Grupo de paneles similares (para cards del marketplace)
export interface MarketplaceGroup {
  groupId: string;
  brand: string;
  model: string;
  powerRange: string;
  avgPower: number;
  avgVoltage: number;
  healthGrade: HealthGrade;
  avgHealthPercentage: number;
  dimensions: string;
  availableCount: number;
  panelIds: string[];
  suggestedPrice?: number;
  imageUrl?: string;
}

// Filtros disponibles
export interface MarketplaceFilters {
  brands?: string;
  minPower?: number;
  maxPower?: number;
  powerRange?: PowerRange;
  minVoltage?: number;
  maxVoltage?: number;
  healthGrade?: HealthGrade;
  minLength?: number;
  maxLength?: number;
  minWidth?: number;
  maxWidth?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Respuesta del endpoint de grupos
export interface MarketplaceResponse {
  groups: MarketplaceGroup[];
  totalPanels: number;
  totalGroups: number;
  page: number;
  limit: number;
  totalPages: number;
  availableFilters: {
    brands: string[];
    powerRanges: { min: number; max: number };
    voltageRanges: { min: number; max: number };
    healthGrades: HealthGrade[];
  };
}

// Panel individual
export interface MarketplacePanel {
  id: string;
  qrCode: string;
  brand: string;
  model: string;
  measuredPowerWatts: number;
  measuredVoltage: number;
  healthPercentage: number;
  healthGrade: HealthGrade;
  dimensionLength: number;
  dimensionWidth: number;
  dimensionHeight: number;
  refurbishedAt: string;
  refurbishmentNotes?: string;
}
```

---

## Paso 2: Agregar API de Marketplace

Modificar `src/lib/api.ts`, agregar al final:

```typescript
// Marketplace API Types
export interface MarketplaceGroup {
  groupId: string;
  brand: string;
  model: string;
  powerRange: string;
  avgPower: number;
  avgVoltage: number;
  healthGrade: 'A' | 'B' | 'C';
  avgHealthPercentage: number;
  dimensions: string;
  availableCount: number;
  panelIds: string[];
  suggestedPrice?: number;
  imageUrl?: string;
}

export interface MarketplaceFiltersParams {
  brands?: string;
  minPower?: number;
  maxPower?: number;
  powerRange?: 'LOW' | 'MEDIUM' | 'HIGH';
  healthGrade?: 'A' | 'B' | 'C';
  page?: number;
  limit?: number;
}

export interface MarketplaceResponse {
  groups: MarketplaceGroup[];
  totalPanels: number;
  totalGroups: number;
  page: number;
  limit: number;
  totalPages: number;
  availableFilters: {
    brands: string[];
    powerRanges: { min: number; max: number };
    voltageRanges: { min: number; max: number };
    healthGrades: ('A' | 'B' | 'C')[];
  };
}

// Marketplace API
export const marketplaceApi = {
  getGroups: (filters?: MarketplaceFiltersParams) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    return apiRequest<MarketplaceResponse>(`/marketplace/groups${queryString ? `?${queryString}` : ''}`);
  },

  getFilters: () =>
    apiRequest<MarketplaceResponse['availableFilters']>('/marketplace/filters'),

  getStats: () =>
    apiRequest<{
      totalPanels: number;
      totalPower: number;
      avgHealthPercentage: number;
      byGrade: { grade: string; count: number }[];
      byBrand: { brand: string; count: number }[];
    }>('/marketplace/stats'),
};
```

---

## Paso 3: Crear Componente de Sidebar de Filtros

Crear archivo `src/components/market/PanelFilters.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Zap,
  Battery,
  Ruler,
  Award,
  RotateCcw,
} from 'lucide-react';

interface FilterState {
  brands: string[];
  healthGrade: string | null;
  powerRange: { min: number; max: number } | null;
  voltageRange: { min: number; max: number } | null;
}

interface AvailableFilters {
  brands: string[];
  powerRanges: { min: number; max: number };
  voltageRanges: { min: number; max: number };
  healthGrades: ('A' | 'B' | 'C')[];
}

interface PanelFiltersProps {
  availableFilters: AvailableFilters;
  onFiltersChange: (filters: FilterState) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const healthGradeInfo = {
  A: { label: 'Grado A', description: '>85% salud', color: 'text-green-400', bg: 'bg-green-500/20' },
  B: { label: 'Grado B', description: '75-85% salud', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  C: { label: 'Grado C', description: '<75% salud', color: 'text-orange-400', bg: 'bg-orange-500/20' },
};

export function PanelFilters({ availableFilters, onFiltersChange, isOpen, onToggle }: PanelFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    brands: [],
    healthGrade: null,
    powerRange: null,
    voltageRange: null,
  });

  const [expandedSections, setExpandedSections] = useState({
    brands: true,
    health: true,
    power: false,
    voltage: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFiltersChange(updated);
  };

  const toggleBrand = (brand: string) => {
    const newBrands = filters.brands.includes(brand)
      ? filters.brands.filter(b => b !== brand)
      : [...filters.brands, brand];
    updateFilters({ brands: newBrands });
  };

  const resetFilters = () => {
    const reset: FilterState = {
      brands: [],
      healthGrade: null,
      powerRange: null,
      voltageRange: null,
    };
    setFilters(reset);
    onFiltersChange(reset);
  };

  const hasActiveFilters = filters.brands.length > 0 || filters.healthGrade || filters.powerRange || filters.voltageRange;

  return (
    <>
      {/* Toggle Button (visible when sidebar is closed) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={onToggle}
            className="fixed right-4 top-32 z-40 p-3 bg-dark-800/90 backdrop-blur-md border border-dark-700 rounded-xl shadow-lg hover:bg-dark-700 transition-colors"
          >
            <Filter size={20} className="text-primary-400" />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-80 z-50 overflow-hidden"
          >
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-dark-900/80 backdrop-blur-xl border-l border-white/10" />
            
            {/* Content */}
            <div className="relative h-full flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-500/20 rounded-lg">
                      <Filter size={20} className="text-primary-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">Filtros</h2>
                      <p className="text-xs text-dark-400">Refina tu búsqueda</p>
                    </div>
                  </div>
                  <button
                    onClick={onToggle}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X size={20} className="text-dark-400" />
                  </button>
                </div>

                {/* Reset Button */}
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-dark-300 transition-colors"
                  >
                    <RotateCcw size={14} />
                    Limpiar filtros
                  </button>
                )}
              </div>

              {/* Filters Scroll Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Health Grade Filter */}
                <div className="space-y-3">
                  <button
                    onClick={() => toggleSection('health')}
                    className="w-full flex items-center justify-between text-white font-medium"
                  >
                    <span className="flex items-center gap-2">
                      <Award size={16} className="text-accent-400" />
                      Grado de Salud
                    </span>
                    {expandedSections.health ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  
                  <AnimatePresence>
                    {expandedSections.health && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-2 overflow-hidden"
                      >
                        {availableFilters.healthGrades.map((grade) => (
                          <button
                            key={grade}
                            onClick={() => updateFilters({ healthGrade: filters.healthGrade === grade ? null : grade })}
                            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                              filters.healthGrade === grade
                                ? `${healthGradeInfo[grade].bg} border-${healthGradeInfo[grade].color.replace('text-', '')}/50`
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`text-lg font-bold ${healthGradeInfo[grade].color}`}>
                                {grade}
                              </span>
                              <div className="text-left">
                                <p className="text-sm text-white">{healthGradeInfo[grade].label}</p>
                                <p className="text-xs text-dark-400">{healthGradeInfo[grade].description}</p>
                              </div>
                            </div>
                            {filters.healthGrade === grade && (
                              <div className="w-2 h-2 bg-primary-500 rounded-full" />
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Brands Filter */}
                <div className="space-y-3">
                  <button
                    onClick={() => toggleSection('brands')}
                    className="w-full flex items-center justify-between text-white font-medium"
                  >
                    <span className="flex items-center gap-2">
                      <Battery size={16} className="text-cyan-400" />
                      Marca
                    </span>
                    {expandedSections.brands ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  
                  <AnimatePresence>
                    {expandedSections.brands && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-2 overflow-hidden"
                      >
                        {availableFilters.brands.map((brand) => (
                          <button
                            key={brand}
                            onClick={() => toggleBrand(brand)}
                            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                              filters.brands.includes(brand)
                                ? 'bg-primary-500/20 border-primary-500/50'
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            <span className="text-sm text-white">{brand}</span>
                            {filters.brands.includes(brand) && (
                              <div className="w-2 h-2 bg-primary-500 rounded-full" />
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Power Range Filter */}
                <div className="space-y-3">
                  <button
                    onClick={() => toggleSection('power')}
                    className="w-full flex items-center justify-between text-white font-medium"
                  >
                    <span className="flex items-center gap-2">
                      <Zap size={16} className="text-amber-400" />
                      Potencia (W)
                    </span>
                    {expandedSections.power ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  
                  <AnimatePresence>
                    {expandedSections.power && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-3 overflow-hidden"
                      >
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="text-xs text-dark-400 mb-1 block">Mín</label>
                            <input
                              type="number"
                              placeholder={String(availableFilters.powerRanges.min)}
                              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-primary-500 focus:outline-none"
                              onChange={(e) => {
                                const min = e.target.value ? Number(e.target.value) : availableFilters.powerRanges.min;
                                updateFilters({
                                  powerRange: { min, max: filters.powerRange?.max || availableFilters.powerRanges.max }
                                });
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-dark-400 mb-1 block">Máx</label>
                            <input
                              type="number"
                              placeholder={String(availableFilters.powerRanges.max)}
                              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-primary-500 focus:outline-none"
                              onChange={(e) => {
                                const max = e.target.value ? Number(e.target.value) : availableFilters.powerRanges.max;
                                updateFilters({
                                  powerRange: { min: filters.powerRange?.min || availableFilters.powerRanges.min, max }
                                });
                              }}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-dark-500">
                          Rango disponible: {availableFilters.powerRanges.min}W - {availableFilters.powerRanges.max}W
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Voltage Range Filter */}
                <div className="space-y-3">
                  <button
                    onClick={() => toggleSection('voltage')}
                    className="w-full flex items-center justify-between text-white font-medium"
                  >
                    <span className="flex items-center gap-2">
                      <Ruler size={16} className="text-purple-400" />
                      Voltaje (V)
                    </span>
                    {expandedSections.voltage ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  
                  <AnimatePresence>
                    {expandedSections.voltage && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-3 overflow-hidden"
                      >
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="text-xs text-dark-400 mb-1 block">Mín</label>
                            <input
                              type="number"
                              placeholder={String(availableFilters.voltageRanges.min)}
                              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-primary-500 focus:outline-none"
                              onChange={(e) => {
                                const min = e.target.value ? Number(e.target.value) : availableFilters.voltageRanges.min;
                                updateFilters({
                                  voltageRange: { min, max: filters.voltageRange?.max || availableFilters.voltageRanges.max }
                                });
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-dark-400 mb-1 block">Máx</label>
                            <input
                              type="number"
                              placeholder={String(availableFilters.voltageRanges.max)}
                              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-primary-500 focus:outline-none"
                              onChange={(e) => {
                                const max = e.target.value ? Number(e.target.value) : availableFilters.voltageRanges.max;
                                updateFilters({
                                  voltageRange: { min: filters.voltageRange?.min || availableFilters.voltageRanges.min, max }
                                });
                              }}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-dark-500">
                          Rango disponible: {availableFilters.voltageRanges.min}V - {availableFilters.voltageRanges.max}V
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-white/10">
                <button
                  onClick={onToggle}
                  className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors"
                >
                  Aplicar Filtros
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>
    </>
  );
}
```

---

## Paso 4: Crear Componente de Card de Panel Reacondicionado

Crear archivo `src/components/market/RefurbishedPanelCard.tsx`:

```tsx
'use client';

import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Zap,
  Gauge,
  ShoppingCart,
  Lock,
  Award,
  Maximize2,
  Package,
} from 'lucide-react';
import type { MarketplaceGroup } from '@/lib/api';
import Image from 'next/image';

interface RefurbishedPanelCardProps {
  group: MarketplaceGroup;
  onBuy?: (group: MarketplaceGroup) => void;
}

const gradeColors = {
  A: {
    bg: 'bg-green-500/20',
    border: 'border-green-500/30',
    text: 'text-green-400',
    gradient: 'from-green-600 to-green-800',
  },
  B: {
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    gradient: 'from-amber-600 to-amber-800',
  },
  C: {
    bg: 'bg-orange-500/20',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    gradient: 'from-orange-600 to-orange-800',
  },
};

export function RefurbishedPanelCard({ group, onBuy }: RefurbishedPanelCardProps) {
  const { userRole } = useAuthStore();
  const canBuy = userRole === 'PARTNER' || userRole === 'DONOR';
  const gradeStyle = gradeColors[group.healthGrade] || gradeColors.C;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="card group overflow-hidden"
    >
      {/* Header con imagen */}
      <div className={`h-40 -mx-6 -mt-6 mb-4 bg-gradient-to-br ${gradeStyle.gradient} relative overflow-hidden`}>
        {group.imageUrl ? (
          <Image
            src={group.imageUrl}
            alt={`Panel ${group.brand}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="text-white/30" size={64} />
          </div>
        )}
        
        {/* Badge de grado */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1.5 rounded-full text-sm font-bold border ${gradeStyle.bg} ${gradeStyle.border} ${gradeStyle.text} backdrop-blur-sm`}>
            <Award size={14} className="inline mr-1" />
            Grado {group.healthGrade}
          </span>
        </div>

        {/* Cantidad disponible */}
        <div className="absolute top-3 right-3 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-xs text-white font-medium flex items-center gap-1">
          <Package size={12} />
          {group.availableCount} disponibles
        </div>

        {/* Porcentaje de salud */}
        <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs text-white font-mono">
          {group.avgHealthPercentage}% salud
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-bold text-white group-hover:text-primary-400 transition-colors">
            {group.brand}
          </h3>
          <p className="text-dark-400 text-sm">{group.model}</p>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-dark-700/50 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-dark-400 mb-1">
              <Zap size={12} className="text-amber-400" />
              Potencia
            </div>
            <p className="text-white font-semibold">{group.powerRange}</p>
          </div>
          <div className="p-3 bg-dark-700/50 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-dark-400 mb-1">
              <Gauge size={12} className="text-cyan-400" />
              Voltaje
            </div>
            <p className="text-white font-semibold">{group.avgVoltage}V</p>
          </div>
        </div>

        {/* Dimensiones */}
        <div className="flex items-center gap-2 text-sm text-dark-400">
          <Maximize2 size={14} />
          <span>Dimensiones: {group.dimensions}</span>
        </div>

        {/* Precio */}
        <div className="pt-4 border-t border-dark-700">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-dark-400 text-xs block">Precio desde</span>
              <span className="text-primary-400 font-bold text-2xl">
                ${group.suggestedPrice?.toFixed(2) || '---'}
              </span>
              <span className="text-dark-400 text-sm ml-1">USD</span>
            </div>
            <div className="text-right">
              <span className="text-dark-500 text-xs">por panel</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {canBuy ? (
          <button
            onClick={() => onBuy?.(group)}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3"
          >
            <ShoppingCart size={18} />
            Ver Paneles
          </button>
        ) : (
          <button
            disabled
            className="w-full py-3 px-4 bg-dark-700 text-dark-400 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
          >
            <Lock size={18} />
            Inicia sesión para comprar
          </button>
        )}
      </div>
    </motion.div>
  );
}
```

---

## Paso 5: Crear Hook para Marketplace

Crear archivo `src/hooks/useMarketplace.ts`:

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { marketplaceApi, type MarketplaceGroup, type MarketplaceFiltersParams, type MarketplaceResponse } from '@/lib/api';

interface FilterState {
  brands: string[];
  healthGrade: string | null;
  powerRange: { min: number; max: number } | null;
  voltageRange: { min: number; max: number } | null;
}

export function useMarketplace() {
  const [groups, setGroups] = useState<MarketplaceGroup[]>([]);
  const [availableFilters, setAvailableFilters] = useState<MarketplaceResponse['availableFilters'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPanels, setTotalPanels] = useState(0);
  const [totalGroups, setTotalGroups] = useState(0);

  const fetchGroups = useCallback(async (filters?: FilterState) => {
    setIsLoading(true);
    setError(null);

    try {
      // Convertir FilterState a MarketplaceFiltersParams
      const params: MarketplaceFiltersParams = {};
      
      if (filters?.brands && filters.brands.length > 0) {
        params.brands = filters.brands.join(',');
      }
      if (filters?.healthGrade) {
        params.healthGrade = filters.healthGrade as 'A' | 'B' | 'C';
      }
      if (filters?.powerRange) {
        params.minPower = filters.powerRange.min;
        params.maxPower = filters.powerRange.max;
      }

      const response = await marketplaceApi.getGroups(params);

      if (response.error) {
        setError(response.error);
        // Usar datos de demostración si hay error
        setGroups(getDemoGroups());
        setAvailableFilters(getDemoFilters());
      } else if (response.data) {
        setGroups(response.data.groups);
        setAvailableFilters(response.data.availableFilters);
        setTotalPanels(response.data.totalPanels);
        setTotalGroups(response.data.totalGroups);
      }
    } catch (err) {
      setError('Error al cargar paneles');
      setGroups(getDemoGroups());
      setAvailableFilters(getDemoFilters());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return {
    groups,
    availableFilters,
    isLoading,
    error,
    totalPanels,
    totalGroups,
    refetch: fetchGroups,
  };
}

// Datos de demostración
function getDemoGroups(): MarketplaceGroup[] {
  return [
    {
      groupId: 'trina-275-325w-a-170x100',
      brand: 'Trina Solar',
      model: 'TSM-DE09.08',
      powerRange: '275-325W',
      avgPower: 300,
      avgVoltage: 38.5,
      healthGrade: 'A',
      avgHealthPercentage: 92,
      dimensions: '170x100 cm',
      availableCount: 12,
      panelIds: ['1', '2', '3'],
      suggestedPrice: 45.00,
      imageUrl: '',
    },
    {
      groupId: 'canadian-250-300w-b-165x99',
      brand: 'Canadian Solar',
      model: 'CS3W-400MS',
      powerRange: '250-300W',
      avgPower: 275,
      avgVoltage: 36.2,
      healthGrade: 'B',
      avgHealthPercentage: 80,
      dimensions: '165x99 cm',
      availableCount: 8,
      panelIds: ['4', '5'],
      suggestedPrice: 33.00,
      imageUrl: '',
    },
    {
      groupId: 'sunpower-300-350w-a-175x104',
      brand: 'SunPower',
      model: 'SPR-X21-345',
      powerRange: '300-350W',
      avgPower: 325,
      avgVoltage: 40.1,
      healthGrade: 'A',
      avgHealthPercentage: 95,
      dimensions: '175x104 cm',
      availableCount: 5,
      panelIds: ['6', '7', '8'],
      suggestedPrice: 52.00,
      imageUrl: '',
    },
  ];
}

function getDemoFilters(): MarketplaceResponse['availableFilters'] {
  return {
    brands: ['Trina Solar', 'Canadian Solar', 'SunPower'],
    powerRanges: { min: 200, max: 400 },
    voltageRanges: { min: 30, max: 50 },
    healthGrades: ['A', 'B', 'C'],
  };
}
```

---

## Paso 6: Crear Página de Marketplace de Paneles

Crear archivo `src/app/market/panels/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { useMarketplace } from '@/hooks/useMarketplace';
import { RefurbishedPanelCard } from '@/components/market/RefurbishedPanelCard';
import { PanelFilters } from '@/components/market/PanelFilters';
import {
  SunMedium,
  Search,
  Loader2,
  RefreshCw,
  Filter,
  Sparkles,
  Package,
  Zap,
  Award,
} from 'lucide-react';
import type { MarketplaceGroup } from '@/lib/api';

export default function PanelsMarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any>(null);
  const { userRole } = useAuthStore();
  
  const { groups, availableFilters, isLoading, error, totalPanels, totalGroups, refetch } = useMarketplace();

  const handleFiltersChange = (filters: any) => {
    setActiveFilters(filters);
    refetch(filters);
  };

  const handleBuyGroup = (group: MarketplaceGroup) => {
    // TODO: Navegar a detalle del grupo o abrir modal
    console.log('Ver grupo:', group);
  };

  // Filtrar por búsqueda local
  const filteredGroups = groups.filter((g) =>
    g.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Contar filtros activos
  const activeFilterCount = activeFilters
    ? (activeFilters.brands?.length || 0) +
      (activeFilters.healthGrade ? 1 : 0) +
      (activeFilters.powerRange ? 1 : 0) +
      (activeFilters.voltageRange ? 1 : 0)
    : 0;

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-dark-900 via-dark-900 to-dark-800" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-sm font-medium mb-6">
              <SunMedium size={16} />
              Paneles Reacondicionados
            </span>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              Segunda Vida para <span className="text-gradient-primary">Paneles Solares</span>
            </h1>
            <p className="text-dark-400 max-w-2xl mx-auto">
              Paneles solares inspeccionados, reacondicionados y listos para una nueva vida útil.
              Certificados con trazabilidad blockchain.
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto mb-8">
            <div className="text-center p-4 bg-dark-800/50 rounded-xl border border-dark-700">
              <Package className="mx-auto text-amber-400 mb-2" size={24} />
              <p className="text-2xl font-bold text-white">{totalPanels}</p>
              <p className="text-xs text-dark-400">Paneles</p>
            </div>
            <div className="text-center p-4 bg-dark-800/50 rounded-xl border border-dark-700">
              <Zap className="mx-auto text-cyan-400 mb-2" size={24} />
              <p className="text-2xl font-bold text-white">{totalGroups}</p>
              <p className="text-xs text-dark-400">Grupos</p>
            </div>
            <div className="text-center p-4 bg-dark-800/50 rounded-xl border border-dark-700">
              <Award className="mx-auto text-green-400 mb-2" size={24} />
              <p className="text-2xl font-bold text-white">{availableFilters?.healthGrades.length || 3}</p>
              <p className="text-xs text-dark-400">Grados</p>
            </div>
          </div>

          {/* Search & Filter Toggle */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por marca o modelo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-12"
              />
            </div>

            <button
              onClick={() => refetch(activeFilters)}
              disabled={isLoading}
              className="px-4 py-2 bg-dark-700 text-dark-300 hover:text-white rounded-xl transition-colors flex items-center gap-2"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
              Actualizar
            </button>

            <button
              onClick={() => setFiltersOpen(true)}
              className="px-4 py-2 bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 rounded-xl transition-colors flex items-center gap-2 relative"
            >
              <Filter size={18} />
              Filtros
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Guest Banner */}
          {userRole === 'GUEST' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 bg-dark-800 border border-dark-700 rounded-xl flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="text-accent-400" size={20} />
                <span className="text-dark-300">
                  <span className="text-white font-medium">Inicia sesión</span> para comprar paneles reacondicionados.
                </span>
              </div>
              <button className="btn-primary text-sm py-2">
                Iniciar Sesión
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-primary-400" size={32} />
              <span className="ml-3 text-dark-400">Cargando paneles...</span>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="text-center py-8 mb-8 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <p className="text-amber-400">{error}</p>
              <p className="text-dark-400 text-sm mt-1">Mostrando datos de demostración</p>
            </div>
          )}

          {/* Grid de Paneles */}
          <AnimatePresence mode="wait">
            {!isLoading && (
              <motion.div
                key="panels-grid"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {filteredGroups.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredGroups.map((group) => (
                      <RefurbishedPanelCard
                        key={group.groupId}
                        group={group}
                        onBuy={handleBuyGroup}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-dark-800/50 rounded-xl">
                    <SunMedium className="mx-auto text-dark-500 mb-4" size={48} />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No hay paneles disponibles
                    </h3>
                    <p className="text-dark-400 max-w-md mx-auto">
                      {searchQuery
                        ? 'No se encontraron paneles con tu búsqueda.'
                        : 'Los paneles aparecerán aquí una vez que sean reacondicionados.'}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Sidebar de Filtros */}
      {availableFilters && (
        <PanelFilters
          availableFilters={availableFilters}
          onFiltersChange={handleFiltersChange}
          isOpen={filtersOpen}
          onToggle={() => setFiltersOpen(!filtersOpen)}
        />
      )}
    </div>
  );
}
```

---

## Paso 7: Agregar Link en Navegación (Opcional)

Si quieres agregar un link directo en la navegación, modificar el componente de navegación para incluir:

```tsx
<Link href="/market/panels" className="nav-link">
  Paneles Reacondicionados
</Link>
```

---

## Verificación

### Probar la página

1. Ejecutar el frontend: `npm run dev`
2. Navegar a `http://localhost:3000/market/panels`
3. Verificar que:
   - Se muestran las cards de paneles agrupados
   - El botón de filtros abre la sidebar
   - La sidebar tiene efecto glassmorphism (transparente con blur)
   - Los filtros funcionan correctamente
   - Se puede cerrar la sidebar con el botón X o haciendo clic fuera

### Verificar estilos

- **Sidebar:** Fondo `bg-dark-900/80` con `backdrop-blur-xl`
- **Overlay:** `bg-black/50` cuando la sidebar está abierta
- **Cards:** Gradiente según grado de salud (A=verde, B=ámbar, C=naranja)
- **Animaciones:** Framer Motion para transiciones suaves

---

## Resumen de Archivos

| Archivo | Descripción |
|---------|-------------|
| `src/types/marketplace.ts` | Tipos TypeScript para marketplace |
| `src/lib/api.ts` | Agregar `marketplaceApi` |
| `src/components/market/PanelFilters.tsx` | Sidebar de filtros glassmorphism |
| `src/components/market/RefurbishedPanelCard.tsx` | Card de grupo de paneles |
| `src/hooks/useMarketplace.ts` | Hook para consumir API |
| `src/app/market/panels/page.tsx` | Página del marketplace |
