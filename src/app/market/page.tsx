'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { useHydration } from '@/hooks/useHydration';
import { useMarketData } from '@/hooks/useMarketData';
import { useMarketplace } from '@/hooks/useMarketplace';
import { MaterialCard } from '@/components/market/MaterialCard';
import { MaterialPurchaseModal } from '@/components/market/MaterialPurchaseModal';
import { PanelPurchaseModal } from '@/components/market/PanelPurchaseModal';
import { ArtPurchaseModal } from '@/components/market/ArtPurchaseModal';
import { ArtCard } from '@/components/market/ArtCard';
import { AssetCard } from '@/components/market/AssetCard';
import { RefurbishedPanelCard } from '@/components/market/RefurbishedPanelCard';
import { PanelFilters } from '@/components/market/PanelFilters';
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
  Filter,
} from 'lucide-react';
import type { Material, ArtPiece } from '@/types';
import type { MarketAsset, MarketplaceGroup } from '@/lib/api';

type Tab = 'materials' | 'panels' | 'art';
type ArtFilter = 'all' | 'nft' | 'sculpture' | 'installation';

export default function MarketPage() {
  const [activeTab, setActiveTab] = useState<Tab>('materials');
  const [searchQuery, setSearchQuery] = useState('');
  const [artFilter, setArtFilter] = useState<ArtFilter>('all');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Material | ArtPiece | MarketAsset | MarketplaceGroup | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any>(null);
  const hydrated = useHydration();
  const { userRole } = useAuthStore();
  const currentUserRole = hydrated ? userRole : 'GUEST';
  
  const { materials, assets, artPieces, isLoading, error, refetch } = useMarketData();
  const { groups: refurbishedPanels, availableFilters, isLoading: panelsLoading, error: panelsError, totalPanels, totalGroups, refetch: refetchPanels } = useMarketplace();

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

  const handleBuyRefurbishedPanel = (group: MarketplaceGroup) => {
    setSelectedItem(group);
    setShowPurchaseModal(true);
  };

  const handleFiltersChange = (filters: any) => {
    setActiveFilters(filters);
    refetchPanels(filters);
  };

  const filteredMaterials = materials.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAssets = assets.filter((a) =>
    (a.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     a.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     a.nfcTagId?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredRefurbishedPanels = refurbishedPanels.filter((g) =>
    g.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeFilterCount = activeFilters
    ? (activeFilters.brands?.length || 0) +
      (activeFilters.healthGrade ? 1 : 0) +
      (activeFilters.powerRange ? 1 : 0) +
      (activeFilters.voltageRange ? 1 : 0)
    : 0;

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
              onClick={() => activeTab === 'panels' ? refetchPanels(activeFilters) : refetch()}
              disabled={activeTab === 'panels' ? panelsLoading : isLoading}
              className="px-4 py-2 bg-dark-700 text-dark-300 hover:text-white rounded-xl transition-colors flex items-center gap-2"
            >
              <RefreshCw size={18} className={(activeTab === 'panels' ? panelsLoading : isLoading) ? 'animate-spin' : ''} />
              Actualizar
            </button>

            {/* Filters button for panels */}
            {activeTab === 'panels' && (
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
            )}

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
          {currentUserRole === 'GUEST' && (
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
          {(activeTab === 'panels' ? panelsLoading : isLoading) && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-primary-400" size={32} />
              <span className="ml-3 text-dark-400">Cargando datos del marketplace...</span>
            </div>
          )}

          {/* Error State */}
          {((activeTab === 'panels' && panelsError && !panelsLoading) || (activeTab !== 'panels' && error && !isLoading)) && (
            <div className="text-center py-8 mb-8 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <p className="text-amber-400">{activeTab === 'panels' ? panelsError : error}</p>
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

            {activeTab === 'panels' && !panelsLoading && (
              <motion.div
                key="panels"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {filteredRefurbishedPanels.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRefurbishedPanels.map((group) => (
                      <RefurbishedPanelCard
                        key={group.groupId}
                        group={group}
                        onBuy={handleBuyRefurbishedPanel}
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

      {/* Material Purchase Modal with Wallet Integration */}
      <MaterialPurchaseModal
        material={selectedItem && 'pricePerTon' in selectedItem ? selectedItem as Material : null}
        isOpen={showPurchaseModal && selectedItem !== null && 'pricePerTon' in selectedItem}
        onClose={() => {
          setShowPurchaseModal(false);
          setSelectedItem(null);
        }}
      />

      {/* Panel Purchase Modal with Wallet Integration */}
      <PanelPurchaseModal
        panel={selectedItem && 'groupId' in selectedItem ? selectedItem as MarketplaceGroup : null}
        isOpen={showPurchaseModal && selectedItem !== null && 'groupId' in selectedItem}
        onClose={() => {
          setShowPurchaseModal(false);
          setSelectedItem(null);
        }}
      />

      {/* Art Purchase Modal with Wallet Integration */}
      <ArtPurchaseModal
        artPiece={selectedItem && 'title' in selectedItem && 'artist' in selectedItem ? selectedItem as ArtPiece : null}
        isOpen={showPurchaseModal && selectedItem !== null && 'title' in selectedItem && 'artist' in selectedItem}
        onClose={() => {
          setShowPurchaseModal(false);
          setSelectedItem(null);
        }}
      />

      {/* Legacy Generic Modal (should not be reached) */}
      <AnimatePresence>
        {showPurchaseModal && selectedItem && !('pricePerTon' in selectedItem) && !('groupId' in selectedItem) && !('title' in selectedItem) && (
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
                  Item no identificado
                </p>
                <p className="text-primary-400 font-bold">
                  $0 USD
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

      {/* Panel Filters Sidebar */}
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
