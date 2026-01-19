---
description: Integrar galería de arte real en el marketplace web conectada al backend
---

# Step 11: Galería de Arte en Marketplace Web

Este workflow integra las obras de arte publicadas desde la app mobile en el marketplace web, mostrando las imágenes reales de Cloudinary y los datos del backend.

## Prerequisitos

- Backend corriendo con endpoint `/art` y `/statistics/market/art`
- Obras de arte publicadas desde la app mobile (estado `ART_LISTED_FOR_SALE`)
- Imágenes subidas a Cloudinary

---

## Paso 1: Verificar Endpoint de Arte en Backend

El backend ya tiene el endpoint en `src/statistics/statistics.service.ts`:

```typescript
// GET /statistics/market/art
async getArt() {
  const artPieces = await this.prisma.artPiece.findMany({
    where: { isAvailable: true },
    orderBy: { createdAt: 'desc' },
  });

  return artPieces.map((piece) => ({
    id: piece.id,
    title: piece.title,
    artist: piece.artist,
    description: piece.description,
    price: piece.price,
    currency: piece.currency,
    category: piece.category,
    imageUrl: piece.imageUrl || '',
    isAvailable: piece.isAvailable,
    tokenId: piece.tokenId,
    sourceAssetId: piece.sourceAssetId,
    createdAt: piece.createdAt,
  }));
}
```

**Verificar que funciona:**
```bash
curl http://localhost:4000/statistics/market/art
```

---

## Paso 2: Actualizar Tipo BackendArtPiece en API

Verificar que `src/lib/api.ts` tenga el tipo correcto:

```typescript
export interface BackendArtPiece {
  id: string;
  title: string;
  artist: string;
  description: string;
  price: number;
  currency: string;
  category: 'NFT' | 'SCULPTURE' | 'INSTALLATION';
  imageUrl: string | null;
  isAvailable: boolean;
  tokenId: string | null;
  sourceAssetId: string | null;
  createdAt: string;
}
```

---

## Paso 3: Actualizar Hook useMarketData

Modificar `src/hooks/useMarketData.ts` para manejar mejor las imágenes de Cloudinary:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { marketApi, MarketAsset, MaterialStock, BackendArtPiece } from '@/lib/api';
import { materials as mockMaterials, artPieces as mockArtPieces } from '@/data/marketData';
import type { Material, ArtPiece } from '@/types';

interface UseMarketDataReturn {
  materials: Material[];
  assets: MarketAsset[];
  artPieces: ArtPiece[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Transformar categoría del backend al formato del frontend
const categoryMap: Record<string, 'nft' | 'sculpture' | 'installation'> = {
  NFT: 'nft',
  SCULPTURE: 'sculpture',
  INSTALLATION: 'installation',
};

// Imagen por defecto según categoría
const defaultImages: Record<string, string> = {
  nft: '/art/nft-default.jpg',
  sculpture: '/art/sculpture-default.jpg',
  installation: '/art/installation-default.jpg',
};

export function useMarketData(): UseMarketDataReturn {
  const [materials, setMaterials] = useState<Material[]>(mockMaterials);
  const [assets, setAssets] = useState<MarketAsset[]>([]);
  const [artPieces, setArtPieces] = useState<ArtPiece[]>(mockArtPieces);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [materialsRes, assetsRes, artRes] = await Promise.all([
        marketApi.getMaterials(),
        marketApi.getAssets(),
        marketApi.getArt(),
      ]);

      // Transformar materiales del backend al formato del frontend
      if (materialsRes.data) {
        const transformedMaterials: Material[] = materialsRes.data.map((m) => ({
          id: `mat-${m.type}`,
          name: m.name,
          type: m.type as 'aluminum' | 'glass' | 'silicon' | 'copper',
          quantity: m.quantity,
          pricePerTon: m.pricePerTon,
          available: m.available,
          image: `/materials/${m.type}.jpg`,
        }));
        setMaterials(transformedMaterials);
      }

      if (assetsRes.data) {
        setAssets(assetsRes.data);
      }

      // Transformar arte del backend al formato del frontend
      if (artRes.data && artRes.data.length > 0) {
        const transformedArt: ArtPiece[] = artRes.data.map((a) => {
          const category = categoryMap[a.category] || 'sculpture';
          return {
            id: a.id,
            title: a.title,
            artist: a.artist,
            description: a.description,
            price: a.price,
            // Usar imageUrl de Cloudinary si existe, sino imagen por defecto
            image: a.imageUrl && a.imageUrl.length > 0 
              ? a.imageUrl 
              : defaultImages[category],
            category,
            isAvailable: a.isAvailable,
          };
        });
        setArtPieces(transformedArt);
      } else if (!artRes.error) {
        // Si no hay error pero tampoco datos, usar mock
        setArtPieces(mockArtPieces);
      }

      if (materialsRes.error || assetsRes.error) {
        console.warn('Using mock data due to API error');
        setMaterials(mockMaterials);
      }

      if (artRes.error) {
        console.warn('Using mock art data due to API error');
        setArtPieces(mockArtPieces);
      }
    } catch (err) {
      setError('Error al cargar datos del marketplace');
      // Usar datos mock como fallback
      setMaterials(mockMaterials);
      setArtPieces(mockArtPieces);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    materials,
    assets,
    artPieces,
    isLoading,
    error,
    refetch: fetchData,
  };
}
```

---

## Paso 4: Actualizar Componente ArtCard para Imágenes Reales

Modificar `src/components/market/ArtCard.tsx` para mostrar imágenes de Cloudinary:

```typescript
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
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

// Gradientes de fallback por categoría
const categoryGradients = {
  nft: 'from-accent-600 via-purple-600 to-pink-600',
  sculpture: 'from-primary-600 via-teal-600 to-cyan-600',
  installation: 'from-amber-600 via-orange-600 to-red-600',
};

export function ArtCard({ piece, onBuy }: ArtCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { userRole } = useAuthStore();
  const canBuy = userRole === 'PARTNER' || userRole === 'DONOR';

  // Verificar si la imagen es de Cloudinary
  const isCloudinaryImage = piece.image?.includes('cloudinary.com') || piece.image?.includes('res.cloudinary');
  const hasValidImage = piece.image && piece.image.length > 0 && !imageError;

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
        {hasValidImage ? (
          <>
            {/* Imagen real de Cloudinary o local */}
            <Image
              src={piece.image}
              alt={piece.title}
              fill
              className="object-cover transition-transform duration-500"
              style={{ transform: isHovered ? 'scale(1.1)' : 'scale(1)' }}
              onError={() => setImageError(true)}
              unoptimized={isCloudinaryImage} // Cloudinary ya optimiza
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-dark-900/60 to-transparent" />
          </>
        ) : (
          /* Fallback: Gradiente animado */
          <div className={`absolute inset-0 bg-gradient-to-br ${categoryGradients[piece.category]}`}>
            <motion.div
              animate={{ 
                backgroundPosition: isHovered ? '100% 100%' : '0% 0%' 
              }}
              transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
              className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent"
            />
            {/* Icono de imagen no disponible */}
            <div className="absolute inset-0 flex items-center justify-center">
              <ImageOff className="text-white/30" size={48} />
            </div>
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
```

---

## Paso 5: Configurar Next.js para Imágenes de Cloudinary

Actualizar `next.config.ts` para permitir imágenes de Cloudinary:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
```

---

## Paso 6: Agregar Estado Vacío Mejorado para Arte

En `src/app/market/page.tsx`, agregar un estado vacío específico para cuando no hay obras de arte:

Buscar la sección de arte y agregar después del grid:

```typescript
{activeTab === 'art' && !isLoading && (
  <motion.div
    key="art"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
  >
    {filteredArt.length > 0 ? (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArt.map((piece) => (
          <ArtCard
            key={piece.id}
            piece={piece}
            onBuy={handleBuyArt}
          />
        ))}
      </div>
    ) : (
      <div className="text-center py-16 bg-dark-800/50 rounded-xl">
        <Palette className="mx-auto text-dark-500 mb-4" size={48} />
        <h3 className="text-xl font-semibold text-white mb-2">
          No hay obras de arte disponibles
        </h3>
        <p className="text-dark-400 max-w-md mx-auto">
          {searchQuery
            ? 'No se encontraron obras con tu búsqueda.'
            : 'Las obras de arte aparecerán aquí una vez que los artistas las publiquen desde la app.'}
        </p>
      </div>
    )}
  </motion.div>
)}
```

---

## Paso 7: Agregar Modal de Detalle de Obra (Opcional)

Crear `src/components/market/ArtDetailModal.tsx`:

```typescript
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, User, Palette, ShoppingCart, ExternalLink, Sparkles } from 'lucide-react';
import type { ArtPiece } from '@/types';

interface ArtDetailModalProps {
  piece: ArtPiece | null;
  isOpen: boolean;
  onClose: () => void;
  onBuy?: (piece: ArtPiece) => void;
  canBuy?: boolean;
}

const categoryLabels = {
  nft: 'NFT Digital',
  sculpture: 'Escultura',
  installation: 'Instalación Artística',
};

export function ArtDetailModal({ piece, isOpen, onClose, onBuy, canBuy }: ArtDetailModalProps) {
  if (!piece) return null;

  const isCloudinaryImage = piece.image?.includes('cloudinary.com');

  const formatPrice = (price: number, category: string) => {
    if (category === 'nft') {
      return `${price} ETH`;
    }
    return `$${price.toLocaleString()} USD`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-dark-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-dark-700">
              <div className="flex items-center gap-2">
                <Palette className="text-accent-400" size={20} />
                <span className="text-dark-400 text-sm">{categoryLabels[piece.category]}</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="grid md:grid-cols-2 gap-6 p-6">
              {/* Image */}
              <div className="relative aspect-square rounded-xl overflow-hidden bg-dark-700">
                {piece.image && piece.image.length > 0 ? (
                  <Image
                    src={piece.image}
                    alt={piece.title}
                    fill
                    className="object-cover"
                    unoptimized={isCloudinaryImage}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Palette className="text-dark-500" size={64} />
                  </div>
                )}
                
                {piece.category === 'nft' && (
                  <div className="absolute top-4 right-4">
                    <Sparkles className="text-accent-400" size={24} />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex flex-col">
                <h2 className="text-2xl font-bold text-white mb-2">{piece.title}</h2>
                
                <div className="flex items-center gap-2 text-dark-400 mb-4">
                  <User size={16} />
                  <span>{piece.artist}</span>
                </div>

                <p className="text-dark-300 mb-6 flex-1">{piece.description}</p>

                {/* Price */}
                <div className="p-4 bg-dark-700 rounded-xl mb-4">
                  <span className="text-dark-400 text-sm">Precio</span>
                  <p className={`text-2xl font-bold ${
                    piece.category === 'nft' ? 'text-accent-400' : 'text-primary-400'
                  }`}>
                    {formatPrice(piece.price, piece.category)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  {piece.isAvailable ? (
                    canBuy ? (
                      <button
                        onClick={() => onBuy?.(piece)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                          piece.category === 'nft'
                            ? 'bg-accent-500 hover:bg-accent-600 text-white'
                            : 'bg-primary-500 hover:bg-primary-600 text-white'
                        }`}
                      >
                        <ShoppingCart size={18} />
                        Comprar Ahora
                      </button>
                    ) : (
                      <div className="flex-1 py-3 text-center bg-dark-700 rounded-xl text-dark-400">
                        Inicia sesión para comprar
                      </div>
                    )
                  ) : (
                    <div className="flex-1 py-3 text-center bg-red-500/20 rounded-xl text-red-400">
                      Obra Vendida
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## Verificación

### Flujo de prueba

1. Publicar una obra de arte desde la app mobile con imagen
2. Verificar en la BD que `ArtPiece` tenga `imageUrl` de Cloudinary
3. Ejecutar `npm run dev` en el frontend
4. Ir a `/market` y seleccionar tab "Galería de Arte"
5. Verificar que aparezca la obra con la imagen real
6. Verificar que el hover muestre el overlay
7. Verificar que el precio se muestre correctamente

### Verificar datos del backend

```bash
# Ver obras de arte disponibles
curl http://localhost:4000/statistics/market/art | jq

# Respuesta esperada:
[
  {
    "id": "...",
    "title": "Mi Obra",
    "artist": "Artista Rafiki",
    "description": "...",
    "price": 285.71,
    "currency": "USD",
    "category": "SCULPTURE",
    "imageUrl": "https://res.cloudinary.com/xxx/image/upload/v123/Art_Gallery/abc.jpg",
    "isAvailable": true,
    ...
  }
]
```

---

## Resumen de Archivos

| Archivo | Descripción |
|---------|-------------|
| `src/hooks/useMarketData.ts` | Hook actualizado para manejar imágenes de Cloudinary |
| `src/components/market/ArtCard.tsx` | Componente actualizado con soporte para imágenes reales |
| `next.config.ts` | Configuración para permitir imágenes de Cloudinary |
| `src/app/market/page.tsx` | Página del marketplace con estado vacío mejorado |
| `src/components/market/ArtDetailModal.tsx` | (Opcional) Modal de detalle de obra |

---

## Flujo Completo

```
1. Artista publica obra desde app mobile
2. Imagen se sube a Cloudinary (carpeta Art_Gallery)
3. Backend guarda ArtPiece con imageUrl de Cloudinary
4. Frontend llama a GET /statistics/market/art
5. useMarketData transforma datos y mapea imageUrl
6. ArtCard muestra imagen de Cloudinary con Next/Image
7. Usuario puede ver y comprar la obra
```
