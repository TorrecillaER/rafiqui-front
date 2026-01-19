---
description: Crear marketplace de materiales y galería de arte
---

# Crear Página de Marketplace

Este workflow implementa el marketplace híbrido con materiales reciclados y galería de arte/NFTs.

## Contexto

La página `/market` es híbrida:
- **GUEST**: Puede ver productos pero no comprar
- **DONOR/PARTNER**: Puede ver y comprar

Tiene dos pestañas:
1. **Materiales**: Aluminio, Vidrio, Silicio (toneladas, precio)
2. **Galería de Arte**: NFTs y esculturas de paneles reciclados

## Pasos

### 1. Crear datos mock

Crear `src/data/marketData.ts`:

```typescript
import type { Material, ArtPiece } from '@/types';

export const materials: Material[] = [
  {
    id: 'mat-001',
    name: 'Aluminio Reciclado',
    type: 'aluminum',
    quantity: 45.5,
    pricePerTon: 2800,
    available: true,
    image: '/materials/aluminum.jpg',
  },
  {
    id: 'mat-002',
    name: 'Vidrio Solar Premium',
    type: 'glass',
    quantity: 120.3,
    pricePerTon: 450,
    available: true,
    image: '/materials/glass.jpg',
  },
  {
    id: 'mat-003',
    name: 'Silicio Purificado',
    type: 'silicon',
    quantity: 8.2,
    pricePerTon: 15000,
    available: true,
    image: '/materials/silicon.jpg',
  },
  {
    id: 'mat-004',
    name: 'Cobre Recuperado',
    type: 'copper',
    quantity: 12.8,
    pricePerTon: 8500,
    available: false,
    image: '/materials/copper.jpg',
  },
];

export const artPieces: ArtPiece[] = [
  {
    id: 'art-001',
    title: 'Amanecer Solar #001',
    artist: 'Elena Vázquez',
    description: 'Escultura creada con células solares recuperadas que captura la esencia del amanecer.',
    price: 4500,
    image: '/art/sculpture-1.jpg',
    category: 'sculpture',
    isAvailable: true,
  },
  {
    id: 'art-002',
    title: 'Fragmentos de Luz',
    artist: 'Carlos Mendoza',
    description: 'NFT generativo basado en patrones de degradación de paneles solares.',
    price: 0.5,
    image: '/art/nft-1.jpg',
    category: 'nft',
    isAvailable: true,
  },
  {
    id: 'art-003',
    title: 'Ciclo Infinito',
    artist: 'Ana Torres',
    description: 'Instalación interactiva que representa el ciclo de vida de la energía solar.',
    price: 12000,
    image: '/art/installation-1.jpg',
    category: 'installation',
    isAvailable: true,
  },
  {
    id: 'art-004',
    title: 'Memoria Fotovoltaica',
    artist: 'Roberto Luna',
    description: 'Serie de NFTs que documentan la historia de cada panel reciclado.',
    price: 0.25,
    image: '/art/nft-2.jpg',
    category: 'nft',
    isAvailable: true,
  },
  {
    id: 'art-005',
    title: 'Reflejo Urbano',
    artist: 'María Solís',
    description: 'Escultura de vidrio solar que refleja el paisaje urbano de manera única.',
    price: 7800,
    image: '/art/sculpture-2.jpg',
    category: 'sculpture',
    isAvailable: false,
  },
  {
    id: 'art-006',
    title: 'Energía Ancestral',
    artist: 'Diego Ramírez',
    description: 'Fusión de técnicas tradicionales con materiales solares reciclados.',
    price: 15000,
    image: '/art/installation-2.jpg',
    category: 'installation',
    isAvailable: true,
  },
];
```

### 2. Crear componente de tarjeta de material

Crear `src/components/market/MaterialCard.tsx`:

```typescript
'use client';

import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { Package, Scale, DollarSign, ShoppingCart, Lock } from 'lucide-react';
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
            {material.quantity.toFixed(1)} ton
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-dark-400">
            <DollarSign size={16} />
            Precio/ton
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
```

### 3. Crear componente de tarjeta de arte

Crear `src/components/market/ArtCard.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { Palette, User, ShoppingCart, Lock, Sparkles, ExternalLink } from 'lucide-react';
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

export function ArtCard({ piece, onBuy }: ArtCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { userRole } = useAuthStore();
  const canBuy = userRole === 'PARTNER' || userRole === 'DONOR';

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
        {/* Placeholder gradient for demo */}
        <div className={`absolute inset-0 bg-gradient-to-br ${
          piece.category === 'nft' 
            ? 'from-accent-600 via-purple-600 to-pink-600' 
            : piece.category === 'sculpture'
            ? 'from-primary-600 via-teal-600 to-cyan-600'
            : 'from-amber-600 via-orange-600 to-red-600'
        }`}>
          <motion.div
            animate={{ 
              backgroundPosition: isHovered ? '100% 100%' : '0% 0%' 
            }}
            transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
            className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent"
          />
        </div>

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

### 4. Crear página de marketplace

Crear `src/app/market/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { MaterialCard } from '@/components/market/MaterialCard';
import { ArtCard } from '@/components/market/ArtCard';
import { materials, artPieces } from '@/data/marketData';
import {
  Package,
  Palette,
  Search,
  Filter,
  ShoppingBag,
  Sparkles,
  CheckCircle,
  X,
} from 'lucide-react';
import type { Material, ArtPiece } from '@/types';

type Tab = 'materials' | 'art';
type ArtFilter = 'all' | 'nft' | 'sculpture' | 'installation';

export default function MarketPage() {
  const [activeTab, setActiveTab] = useState<Tab>('materials');
  const [searchQuery, setSearchQuery] = useState('');
  const [artFilter, setArtFilter] = useState<ArtFilter>('all');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Material | ArtPiece | null>(null);
  const { userRole } = useAuthStore();

  const handleBuyMaterial = (material: Material) => {
    setSelectedItem(material);
    setShowPurchaseModal(true);
  };

  const handleBuyArt = (piece: ArtPiece) => {
    setSelectedItem(piece);
    setShowPurchaseModal(true);
  };

  const filteredMaterials = materials.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
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
              Materiales & <span className="text-gradient-art">Arte Solar</span>
            </h1>
            <p className="text-dark-400 max-w-2xl mx-auto">
              Descubre materiales reciclados de alta calidad y obras de arte únicas 
              creadas a partir de paneles solares.
            </p>
          </motion.div>

          {/* Tabs */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1 bg-dark-800 rounded-xl">
              <button
                onClick={() => setActiveTab('materials')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'materials'
                    ? 'bg-primary-500 text-white'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                <Package size={18} />
                Materiales
              </button>
              <button
                onClick={() => setActiveTab('art')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
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
                placeholder={activeTab === 'materials' ? 'Buscar materiales...' : 'Buscar obras o artistas...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-12"
              />
            </div>

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
                  <span className="text-white font-medium">Inicia sesión</span> para comprar materiales y obras de arte.
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
          <AnimatePresence mode="wait">
            {activeTab === 'materials' ? (
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
            ) : (
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
          {((activeTab === 'materials' && filteredMaterials.length === 0) ||
            (activeTab === 'art' && filteredArt.length === 0)) && (
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
                  {'name' in selectedItem ? selectedItem.name : selectedItem.title}
                </p>
                <p className="text-primary-400 font-bold">
                  {'pricePerTon' in selectedItem
                    ? `$${selectedItem.pricePerTon.toLocaleString()} USD/ton`
                    : selectedItem.category === 'nft'
                    ? `${selectedItem.price} ETH`
                    : `$${selectedItem.price.toLocaleString()} USD`}
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
                    // Simulate purchase
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
### 5. Verificar compilación

```bash
npm run dev
```

## Verificación Final

- [ ] `marketData.ts` creado con datos mock
- [ ] `MaterialCard.tsx` creado con diseño de tarjeta
- [ ] `ArtCard.tsx` creado con animaciones Framer Motion
- [ ] `page.tsx` en `/market` creado
- [ ] Tabs funcionan (Materiales / Galería de Arte)
- [ ] Búsqueda funciona
- [ ] Filtros de arte funcionan (NFT, Escultura, Instalación)
- [ ] GUEST ve productos pero no puede comprar
- [ ] PARTNER/DONOR pueden comprar
- [ ] Modal de compra funciona
- [ ] Animaciones hover funcionan en tarjetas de arte
- [ ] App compila sin errores

## Siguiente Paso

Continúa con `/step-5-pagina-dashboard` para crear el dashboard privado con gráficas ESG.
