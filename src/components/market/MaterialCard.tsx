'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { Scale, DollarSign, ShoppingCart, Lock } from 'lucide-react';
import type { Material } from '@/types';

interface MaterialCardProps {
  material: Material;
  onBuy?: (material: Material) => void;
}

const typeColors = {
  aluminum: 'from-slate-400 to-slate-600',
  glass: 'from-cyan-400 to-cyan-600',
  silicon: 'from-purple-400 to-purple-600',
  copper: 'from-orange-400 to-orange-600',
};

const typeLabels = {
  aluminum: 'Aluminio',
  glass: 'Vidrio',
  silicon: 'Silicio',
  copper: 'Cobre',
};

export function MaterialCard({ material, onBuy }: MaterialCardProps) {
  const { userRole } = useAuthStore();
  const canBuy = userRole === 'PARTNER';

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="card group overflow-hidden"
    >
      {/* Image/Gradient Header */}
      <div className={`h-32 -mx-6 -mt-6 mb-4 bg-gradient-to-br ${typeColors[material.type]} relative overflow-hidden`}>
        {material.image && (
          <Image
            src={material.image}
            alt={material.name}
            fill
            className="object-cover"
            unoptimized
          />
        )}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-4 left-4">
          <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium">
            {typeLabels[material.type]}
          </span>
        </div>
        {!material.available && (
          <div className="absolute top-4 right-4 px-3 py-1 bg-red-500/80 rounded-full text-white text-xs font-medium">
            Agotado
          </div>
        )}
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors">
        {material.name}
      </h3>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-dark-400">
            <Scale size={16} />
            Disponible
          </span>
          <span className="text-white font-medium">
            {material.quantity.toFixed(1)} kg
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-dark-400">
            <DollarSign size={16} />
            Precio/kg
          </span>
          <span className="text-primary-400 font-bold">
            ${material.pricePerTon.toLocaleString()} USD
          </span>
        </div>
      </div>

      {/* Action Button */}
      {canBuy ? (
        <button
          onClick={() => onBuy?.(material)}
          disabled={!material.available}
          className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCart size={18} />
          {material.available ? 'Comprar' : 'No Disponible'}
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
    </motion.div>
  );
}
