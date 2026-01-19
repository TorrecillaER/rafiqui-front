'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { useHydration } from '@/hooks/useHydration';
import { Palette, User, ShoppingCart, Lock, Sparkles, ExternalLink, ImageOff } from 'lucide-react';
import type { ArtPiece } from '@/types';

interface ArtCardProps {
  piece: ArtPiece;
  onBuy?: (piece: ArtPiece) => void;
}

const categoryColors = {
  nft: 'border-accent-500/50 hover:border-accent-500',
  sculpture: 'border-primary-500/50 hover:border-primary-500',
  installation: 'border-amber-500/50 hover:border-amber-500',
};

const categoryLabels = {
  nft: 'NFT',
  sculpture: 'Escultura',
  installation: 'Instalación',
};

const categoryBadgeColors = {
  nft: 'bg-accent-500/20 text-accent-400',
  sculpture: 'bg-primary-500/20 text-primary-400',
  installation: 'bg-amber-500/20 text-amber-400',
};

const categoryGradients = {
  nft: 'from-accent-600 via-purple-600 to-pink-600',
  sculpture: 'from-primary-600 via-teal-600 to-cyan-600',
  installation: 'from-amber-600 via-orange-600 to-red-600',
};

export function ArtCard({ piece, onBuy }: ArtCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const hydrated = useHydration();
  const { userRole } = useAuthStore();
  const currentUserRole = hydrated ? userRole : 'GUEST';
  const canBuy = currentUserRole === 'PARTNER' || currentUserRole === 'DONOR';

  // Verificar si es una URL de Cloudinary (imagen real) o una ruta local (mock)
  const isCloudinaryImage = piece.image?.includes('cloudinary.com') || piece.image?.includes('res.cloudinary');
  const hasValidImage = piece.image && piece.image.length > 0 && !imageError && isCloudinaryImage;

  const formatPrice = (price: number, category: string) => {
    if (category === 'nft') {
      return `${price} ETH`;
    }
    return `$${price.toLocaleString()} USD`;
  };

  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -8 }}
      className={`card-art overflow-hidden transition-all duration-300 ${categoryColors[piece.category]}`}
    >
      {/* Image Container */}
      <div className="relative h-48 -mx-6 -mt-6 mb-4 bg-dark-700 overflow-hidden">
        {/* Imagen real de Cloudinary */}
        {hasValidImage && (
          <img
            src={piece.image}
            alt={piece.title}
            className="absolute inset-0 w-full h-full object-cover z-0"
            onError={() => {
              console.error('Error loading art image:', piece.image);
              setImageError(true);
            }}
            onLoad={() => console.log('Art image loaded successfully:', piece.image)}
          />
        )}

        {/* Fallback gradient si no hay imagen o hay error */}
        {(!hasValidImage || imageError) && (
          <div className={`absolute inset-0 bg-gradient-to-br ${categoryGradients[piece.category]} z-0`}>
            <motion.div
              animate={{ 
                backgroundPosition: isHovered ? '100% 100%' : '0% 0%' 
              }}
              transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
              className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent"
            />
            {imageError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <ImageOff className="text-white/30" size={48} />
              </div>
            )}
          </div>
        )}

        {/* Overlay on hover */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          className="absolute inset-0 bg-black/60 flex items-center justify-center"
        >
          <motion.button
            initial={{ scale: 0.8 }}
            animate={{ scale: isHovered ? 1 : 0.8 }}
            className="p-4 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
          >
            <ExternalLink size={24} />
          </motion.button>
        </motion.div>

        {/* Category Badge */}
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${categoryBadgeColors[piece.category]}`}>
            {categoryLabels[piece.category]}
          </span>
        </div>

        {/* Availability */}
        {!piece.isAvailable && (
          <div className="absolute top-4 right-4 px-3 py-1 bg-red-500/80 rounded-full text-white text-xs font-medium">
            Vendido
          </div>
        )}

        {/* NFT Sparkle Effect */}
        {piece.category === 'nft' && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            className="absolute bottom-4 right-4"
          >
            <Sparkles className="text-accent-400" size={20} />
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white group-hover:text-accent-400 transition-colors line-clamp-1">
          {piece.title}
        </h3>

        <div className="flex items-center gap-2 text-sm text-dark-400">
          <User size={14} />
          <span>{piece.artist}</span>
        </div>

        <p className="text-dark-400 text-sm line-clamp-2">
          {piece.description}
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-dark-700">
          <span className={`text-lg font-bold ${
            piece.category === 'nft' ? 'text-accent-400' : 'text-primary-400'
          }`}>
            {formatPrice(piece.price, piece.category)}
          </span>

          {canBuy ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onBuy?.(piece)}
              disabled={!piece.isAvailable}
              className={`p-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                piece.category === 'nft'
                  ? 'bg-accent-500 hover:bg-accent-600 text-white'
                  : 'bg-primary-500 hover:bg-primary-600 text-white'
              }`}
            >
              <ShoppingCart size={18} />
            </motion.button>
          ) : (
            <div className="p-2 bg-dark-700 rounded-xl text-dark-500">
              <Lock size={18} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
