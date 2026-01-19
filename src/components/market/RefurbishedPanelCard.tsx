'use client';

import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { useHydration } from '@/hooks/useHydration';
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
  const hydrated = useHydration();
  const { userRole } = useAuthStore();
  const currentUserRole = hydrated ? userRole : 'GUEST';
  const canBuy = currentUserRole === 'PARTNER' || currentUserRole === 'DONOR';
  const gradeStyle = gradeColors[group.healthGrade] || gradeColors.C;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="card group overflow-hidden"
    >
      <div className={`h-40 -mx-6 -mt-6 mb-4 bg-gradient-to-br ${gradeStyle.gradient} relative overflow-hidden`}>
        {/* Imagen de fondo */}
        {group.imageUrl && (
          <img
            src={group.imageUrl}
            alt={`Panel ${group.brand}`}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 z-0"
            onError={(e) => {
              console.error('Error loading image:', group.imageUrl);
              e.currentTarget.style.display = 'none';
            }}
            onLoad={() => console.log('Image loaded successfully:', group.imageUrl)}
          />
        )}
        
        {/* Fallback icon si no hay imagen */}
        {!group.imageUrl && (
          <div className="absolute inset-0 flex items-center justify-center z-0">
            <Zap className="text-white/30" size={64} />
          </div>
        )}
        
        {/* Badges con z-index superior */}
        <div className="absolute top-3 left-3 z-10">
          <span className={`px-3 py-1.5 rounded-full text-sm font-bold border ${gradeStyle.bg} ${gradeStyle.border} ${gradeStyle.text} backdrop-blur-sm`}>
            <Award size={14} className="inline mr-1" />
            Grado {group.healthGrade}
          </span>
        </div>

        <div className="absolute top-3 right-3 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-xs text-white font-medium flex items-center gap-1 z-10">
          <Package size={12} />
          {group.availableCount} disponibles
        </div>

        <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs text-white font-mono z-10">
          {group.avgHealthPercentage}% salud
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-bold text-white group-hover:text-primary-400 transition-colors">
            {group.brand}
          </h3>
          <p className="text-dark-400 text-sm">{group.model}</p>
        </div>

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

        <div className="flex items-center gap-2 text-sm text-dark-400">
          <Maximize2 size={14} />
          <span>Dimensiones: {group.dimensions}</span>
        </div>

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
