'use client';

import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { Zap, Gauge, ShoppingCart, Lock, CheckCircle, Recycle } from 'lucide-react';
import type { MarketAsset } from '@/lib/api';

interface AssetCardProps {
  asset: MarketAsset;
  onBuy?: (asset: MarketAsset) => void;
}

const statusColors = {
  REUSE: 'bg-green-500/20 text-green-400 border-green-500/30',
  RECYCLE: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  PENDING: 'bg-dark-600 text-dark-400 border-dark-500',
};

const statusLabels = {
  REUSE: 'Listo para Reuso',
  RECYCLE: 'Para Reciclaje',
  PENDING: 'Pendiente',
};

export function AssetCard({ asset, onBuy }: AssetCardProps) {
  const { userRole } = useAuthStore();
  const canBuy = userRole === 'PARTNER' || userRole === 'DONOR';
  const isReusable = asset.inspectionResult === 'REUSE';

  // Calcular precio estimado basado en voltaje
  const estimatedPrice = Math.round(asset.measuredVoltage * 15 + 100);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="card group overflow-hidden"
    >
      {/* Header con foto o gradiente */}
      <div className="h-32 -mx-6 -mt-6 mb-4 bg-gradient-to-br from-primary-600 to-primary-800 relative overflow-hidden">
        {asset.photoUrl ? (
          <img
            src={asset.photoUrl}
            alt={`Panel ${asset.brand}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="text-white/30" size={48} />
          </div>
        )}
        
        {/* Badge de estado */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
            statusColors[asset.inspectionResult as keyof typeof statusColors] || statusColors.PENDING
          }`}>
            {statusLabels[asset.inspectionResult as keyof typeof statusLabels] || 'Pendiente'}
          </span>
        </div>

        {/* NFC Tag ID */}
        {asset.nfcTagId && (
          <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-xs text-white font-mono">
            #{asset.nfcTagId.slice(-6)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-white group-hover:text-primary-400 transition-colors">
            {asset.brand || 'Panel Solar'}
          </h3>
          <p className="text-dark-400 text-sm">{asset.model || 'Modelo Genérico'}</p>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Zap size={14} className="text-amber-400" />
            <span className="text-dark-400">Voltaje:</span>
            <span className="text-white font-medium">{asset.measuredVoltage.toFixed(1)}V</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Gauge size={14} className="text-cyan-400" />
            <span className="text-dark-400">Amps:</span>
            <span className="text-white font-medium">{asset.measuredAmps.toFixed(1)}A</span>
          </div>
        </div>

        {/* Precio */}
        {isReusable && (
          <div className="pt-3 border-t border-dark-700">
            <div className="flex items-center justify-between">
              <span className="text-dark-400 text-sm">Precio estimado</span>
              <span className="text-primary-400 font-bold text-lg">
                ${estimatedPrice} USD
              </span>
            </div>
          </div>
        )}

        {/* Action Button */}
        {isReusable ? (
          canBuy ? (
            <button
              onClick={() => onBuy?.(asset)}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <ShoppingCart size={18} />
              Comprar Panel
            </button>
          ) : (
            <button
              disabled
              className="w-full py-3 px-4 bg-dark-700 text-dark-400 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <Lock size={18} />
              Inicia sesión para comprar
            </button>
          )
        ) : (
          <div className="w-full py-3 px-4 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center gap-2">
            <Recycle size={18} />
            Destinado a reciclaje
          </div>
        )}
      </div>
    </motion.div>
  );
}
