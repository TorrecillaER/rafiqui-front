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

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-80 z-50 overflow-hidden"
          >
            <div className="absolute inset-0 bg-dark-900/80 backdrop-blur-xl border-l border-white/10" />
            
            <div className="relative h-full flex flex-col">
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

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
