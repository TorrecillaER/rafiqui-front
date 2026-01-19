---
description: Planificar el sistema para filtrar
---

# Conectar Marketplace con Backend

Este workflow conecta el marketplace con los endpoints reales de Assets y Materiales.

## Contexto

- **Frontend**: Next.js en `rafiqui-front`
- **Backend**: NestJS en `rafiqui-back` (puerto 4000)
- **Endpoints**:
  - `GET /statistics/market/assets` - Paneles disponibles
  - `GET /statistics/market/materials` - Stock de materiales
  - `GET /statistics/market/art` - Obras de arte disponibles

## Pasos

### 1. Agregar funciones de API para marketplace

Actualizar `src/lib/api.ts` agregando:

```typescript
// ... código existente ...

// Market API Types
export interface MarketAsset {
  id: string;
  nfcTagId: string;
  brand: string;
  model: string;
  status: string;
  inspectionResult: string;
  measuredVoltage: number;
  measuredAmps: number;
  photoUrl: string;
  createdAt: string;
}

export interface MaterialStock {
  type: string;
  name: string;
  quantity: number;
  pricePerTon: number;
  available: boolean;
}

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

// Market API
export const marketApi = {
  getAssets: () =>
    apiRequest<MarketAsset[]>('/statistics/market/assets'),

  getMaterials: () =>
    apiRequest<MaterialStock[]>('/statistics/market/materials'),

  getArt: () =>
    apiRequest<BackendArtPiece[]>('/statistics/market/art'),
};
```

### 2. Crear hook personalizado para marketplace

Crear `src/hooks/useMarketData.ts`:

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
        const transformedArt: ArtPiece[] = artRes.data.map((a) => ({
          id: a.id,
          title: a.title,
          artist: a.artist,
          description: a.description,
          price: a.price,
          image: a.imageUrl || '/art/default.jpg',
          category: categoryMap[a.category] || 'sculpture',
          isAvailable: a.isAvailable,
        }));
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

### 3. Crear componente de tarjeta de Asset (Panel de 2da mano)

Crear `src/components/market/AssetCard.tsx`:

```typescript
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
```

### 4. Actualizar página de marketplace

Modificar `src/app/market/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { useMarketData } from '@/hooks/useMarketData';
import { MaterialCard } from '@/components/market/MaterialCard';
import { ArtCard } from '@/components/market/ArtCard';
import { AssetCard } from '@/components/market/AssetCard';
import {
  Package,
  Palette,
  SunMedium,
  Search,
  ShoppingBag,
  Sparkles,
  CheckCircle,
  X,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import type { Material, ArtPiece } from '@/types';
import type { MarketAsset } from '@/lib/api';

type Tab = 'materials' | 'panels' | 'art';
type ArtFilter = 'all' | 'nft' | 'sculpture' | 'installation';

export default function MarketPage() {
  const [activeTab, setActiveTab] = useState<Tab>('materials');
  const [searchQuery, setSearchQuery] = useState('');
  const [artFilter, setArtFilter] = useState<ArtFilter>('all');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Material | ArtPiece | MarketAsset | null>(null);
  const { userRole } = useAuthStore();
  
  const { materials, assets, artPieces, isLoading, error, refetch } = useMarketData();

  const handleBuyMaterial = (material: Material) => {
    setSelectedItem(material);
    setShowPurchaseModal(true);
  };

  const handleBuyArt = (piece: ArtPiece) => {
    setSelectedItem(piece);
    setShowPurchaseModal(true);
  };

  const handleBuyAsset = (asset: MarketAsset) => {
    setSelectedItem(asset);
    setShowPurchaseModal(true);
  };

  const filteredMaterials = materials.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAssets = assets.filter((a) =>
    (a.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     a.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     a.nfcTagId?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredArt = artPieces.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.artist.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = artFilter === 'all' || p.category === artFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-dark-900 via-dark-900 to-dark-800" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-accent-500/10 border border-accent-500/30 rounded-full text-accent-400 text-sm font-medium mb-6">
              <ShoppingBag size={16} />
              Marketplace Sostenible
            </span>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              Materiales, Paneles & <span className="text-gradient-art">Arte Solar</span>
            </h1>
            <p className="text-dark-400 max-w-2xl mx-auto">
              Descubre materiales reciclados, paneles de segunda mano y obras de arte únicas 
              creadas a partir de paneles solares.
            </p>
          </motion.div>

          {/* Tabs */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1 bg-dark-800 rounded-xl">
              <button
                onClick={() => setActiveTab('materials')}
                className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'materials'
                    ? 'bg-primary-500 text-white'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                <Package size={18} />
                Materiales
              </button>
              <button
                onClick={() => setActiveTab('panels')}
                className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'panels'
                    ? 'bg-amber-500 text-white'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                <SunMedium size={18} />
                Paneles 2da Mano
                {assets.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    {assets.filter(a => a.inspectionResult === 'REUSE').length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('art')}
                className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'art'
                    ? 'bg-accent-500 text-white'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                <Palette size={18} />
                Galería de Arte
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" size={20} />
              <input
                type="text"
                placeholder={
                  activeTab === 'materials' 
                    ? 'Buscar materiales...' 
                    : activeTab === 'panels'
                    ? 'Buscar por marca, modelo o NFC...'
                    : 'Buscar obras o artistas...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-12"
              />
            </div>

            {/* Refresh button */}
            <button
              onClick={refetch}
              disabled={isLoading}
              className="px-4 py-2 bg-dark-700 text-dark-300 hover:text-white rounded-xl transition-colors flex items-center gap-2"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
              Actualizar
            </button>

            {activeTab === 'art' && (
              <div className="flex gap-2">
                {(['all', 'nft', 'sculpture', 'installation'] as ArtFilter[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setArtFilter(filter)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      artFilter === filter
                        ? 'bg-accent-500 text-white'
                        : 'bg-dark-700 text-dark-400 hover:text-white'
                    }`}
                  >
                    {filter === 'all' ? 'Todos' : filter === 'nft' ? 'NFTs' : filter === 'sculpture' ? 'Esculturas' : 'Instalaciones'}
                  </button>
                ))}
              </div>
            )}
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
                  <span className="text-white font-medium">Inicia sesión</span> para comprar materiales, paneles y obras de arte.
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
              <span className="ml-3 text-dark-400">Cargando datos del marketplace...</span>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="text-center py-8 mb-8 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <p className="text-amber-400">{error}</p>
              <p className="text-dark-400 text-sm mt-1">Mostrando datos de demostración</p>
            </div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === 'materials' && !isLoading && (
              <motion.div
                key="materials"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                {filteredMaterials.map((material) => (
                  <MaterialCard
                    key={material.id}
                    material={material}
                    onBuy={handleBuyMaterial}
                  />
                ))}
              </motion.div>
            )}

            {activeTab === 'panels' && !isLoading && (
              <motion.div
                key="panels"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {filteredAssets.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAssets.map((asset) => (
                      <AssetCard
                        key={asset.id}
                        asset={asset}
                        onBuy={handleBuyAsset}
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
                      Los paneles aparecerán aquí una vez que sean inspeccionados y aprobados para reuso.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'art' && !isLoading && (
              <motion.div
                key="art"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredArt.map((piece) => (
                  <ArtCard
                    key={piece.id}
                    piece={piece}
                    onBuy={handleBuyArt}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!isLoading && (
            (activeTab === 'materials' && filteredMaterials.length === 0) ||
            (activeTab === 'art' && filteredArt.length === 0)
          ) && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-dark-700 mb-4">
                <Search className="text-dark-400" size={24} />
              </div>
              <p className="text-dark-400">No se encontraron resultados para tu búsqueda.</p>
            </div>
          )}
        </div>
      </section>

      {/* Purchase Modal */}
      <AnimatePresence>
        {showPurchaseModal && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowPurchaseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="card max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Confirmar Compra</h3>
                <button
                  onClick={() => setShowPurchaseModal(false)}
                  className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 bg-dark-700 rounded-xl mb-6">
                <p className="text-white font-medium mb-1">
                  {'name' in selectedItem 
                    ? selectedItem.name 
                    : 'title' in selectedItem 
                    ? selectedItem.title 
                    : `Panel ${(selectedItem as MarketAsset).brand}`}
                </p>
                <p className="text-primary-400 font-bold">
                  {'pricePerTon' in selectedItem
                    ? `$${selectedItem.pricePerTon.toLocaleString()} USD/ton`
                    : 'price' in selectedItem
                    ? (selectedItem as ArtPiece).category === 'nft'
                      ? `${(selectedItem as ArtPiece).price} ETH`
                      : `$${(selectedItem as ArtPiece).price.toLocaleString()} USD`
                    : `$${Math.round((selectedItem as MarketAsset).measuredVoltage * 15 + 100)} USD`}
                </p>
              </div>

              <div className="flex items-center gap-3 p-4 bg-primary-500/10 border border-primary-500/30 rounded-xl mb-6">
                <CheckCircle className="text-primary-400" size={20} />
                <span className="text-dark-300 text-sm">
                  Esta es una simulación. No se realizará ningún cargo.
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPurchaseModal(false)}
                  className="flex-1 btn-outline"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setShowPurchaseModal(false);
                    alert('¡Compra simulada exitosa!');
                  }}
                  className="flex-1 btn-primary"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

// turbo
### 5. Verificar conexión

```bash
# Terminal 1: Backend
cd rafiqui-back && npm run start:dev

# Terminal 2: Frontend
cd rafiqui-front && npm run dev
```

## Verificación Final

- [ ] `api.ts` actualizado con funciones de marketplace
- [ ] `useMarketData.ts` hook creado
- [ ] `AssetCard.tsx` componente creado
- [ ] `page.tsx` de market actualizado con 3 tabs
- [ ] Tab "Materiales" muestra datos del backend
- [ ] Tab "Paneles 2da Mano" muestra Assets reales
- [ ] Tab "Galería de Arte" muestra datos del backend
- [ ] Fallback a datos mock si el backend falla
- [ ] Botón de actualizar funciona

## Siguiente Paso

Continúa con `/step-8-conectar-dashboard` para conectar el dashboard con las métricas ESG reales.
