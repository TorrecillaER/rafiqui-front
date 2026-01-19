'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, ShoppingCart, CheckCircle, AlertCircle, Loader, MapPin, Zap, Battery } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { panelsMarketplaceApi, PanelPurchaseDestination, PanelDestinationLabels } from '@/lib/api';
import type { MarketplaceGroup } from '@/lib/api';

interface PanelPurchaseModalProps {
  panel: MarketplaceGroup | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PanelPurchaseModal({ panel, isOpen, onClose }: PanelPurchaseModalProps) {
  const { account, isConnecting, connectWallet, isConnected } = useWallet();
  const [destination, setDestination] = useState<PanelPurchaseDestination>(PanelPurchaseDestination.RESIDENTIAL);
  const [destinationNotes, setDestinationNotes] = useState('');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  if (!panel) return null;

  const price = panel.suggestedPrice || 0;

  const handleConnectWallet = async () => {
    try {
      console.log('Intentando conectar wallet...');
      await connectWallet();
      console.log('Wallet conectada exitosamente');
    } catch (err: any) {
      console.error('Error conectando wallet:', err);
      setPurchaseError(err.message || 'Error al conectar wallet');
    }
  };

  const handlePurchase = async () => {
    if (!isConnected || !account) {
      await handleConnectWallet();
      return;
    }

    setIsPurchasing(true);
    setPurchaseError(null);

    try {
      // Usar el primer panel del grupo para la compra
      const assetId = panel.panelIds && panel.panelIds.length > 0 ? panel.panelIds[0] : '';
      
      if (!assetId) {
        throw new Error('No se encontró un panel disponible en este grupo');
      }

      const buyerId = '7b01e47c-728f-4621-ae9a-2e8831c1ce5d';

      const response = await panelsMarketplaceApi.purchasePanel({
        assetId,
        buyerWallet: account!,
        destination,
        destinationNotes: destinationNotes || undefined,
        buyerId,
      });

      if (response.data && response.data.success) {
        setPurchaseSuccess(true);
        setTxHash(response.data.order.blockchainTxHash);
      } else {
        setPurchaseError(response.error || 'Error al procesar la compra');
      }
    } catch (error: any) {
      setPurchaseError(error.message || 'Error al procesar la compra');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleClose = () => {
    setPurchaseSuccess(false);
    setPurchaseError(null);
    setTxHash(null);
    setDestination(PanelPurchaseDestination.RESIDENTIAL);
    setDestinationNotes('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-md bg-dark-800 rounded-2xl border border-dark-700 shadow-2xl overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Comprar Panel</h2>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                >
                  <X className="text-dark-400" size={20} />
                </button>
              </div>

              {purchaseSuccess ? (
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center py-8">
                    <CheckCircle className="text-green-500 mb-4" size={64} />
                    <h3 className="text-xl font-bold text-white mb-2">¡Compra Exitosa!</h3>
                    <p className="text-dark-400 text-center mb-4">
                      NFT ERC-721 transferido a tu wallet
                    </p>
                    {txHash && (
                      <div className="w-full p-4 bg-dark-700 rounded-lg">
                        <p className="text-xs text-dark-400 mb-1">Transaction Hash:</p>
                        <p className="text-xs text-primary-400 font-mono break-all">{txHash}</p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleClose}
                    className="w-full btn-primary"
                  >
                    Cerrar
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    <div className="p-4 bg-dark-700 rounded-lg">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {panel.brand} {panel.model}
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Zap className="text-primary-400" size={14} />
                          <span className="text-dark-400">Potencia:</span>
                          <span className="text-white font-medium">{panel.avgPower?.toFixed(0) || 0}W</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Battery className="text-green-400" size={14} />
                          <span className="text-dark-400">Salud:</span>
                          <span className="text-white font-medium">{panel.avgHealthPercentage?.toFixed(0) || 0}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-2">
                        <span className="text-dark-400">Disponibles:</span>
                        <span className="text-white font-medium">{panel.availableCount} unidades</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">
                        <MapPin size={14} className="inline mr-1" />
                        Destino del Panel
                      </label>
                      <select
                        value={destination}
                        onChange={(e) => setDestination(e.target.value as PanelPurchaseDestination)}
                        className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                      >
                        {Object.entries(PanelDestinationLabels).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>

                    {destination === PanelPurchaseDestination.OTHER && (
                      <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">
                          Especificar destino
                        </label>
                        <input
                          type="text"
                          value={destinationNotes}
                          onChange={(e) => setDestinationNotes(e.target.value)}
                          placeholder="Describe el uso del panel..."
                          className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                        />
                      </div>
                    )}

                    <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-dark-300">Precio:</span>
                        <span className="text-2xl font-bold text-primary-400">${price.toFixed(2)}</span>
                      </div>
                    </div>

                    {!isConnected && (
                      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <p className="text-sm text-amber-400">
                          Necesitas conectar tu wallet para realizar la compra
                        </p>
                      </div>
                    )}

                    {isConnected && account && (
                      <div className="p-4 bg-dark-700 rounded-lg">
                        <p className="text-xs text-dark-400 mb-1">Wallet conectada:</p>
                        <p className="text-sm text-primary-400 font-mono">{account.slice(0, 6)}...{account.slice(-4)}</p>
                      </div>
                    )}

                    {purchaseError && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                        <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={16} />
                        <p className="text-sm text-red-400">{purchaseError}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleClose}
                      className="flex-1 px-4 py-3 bg-dark-700 hover:bg-dark-600 text-white rounded-xl transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handlePurchase}
                      disabled={isPurchasing || isConnecting}
                      className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPurchasing ? (
                        <>
                          <Loader className="animate-spin" size={18} />
                          Procesando...
                        </>
                      ) : isConnecting ? (
                        <>
                          <Loader className="animate-spin" size={18} />
                          Conectando...
                        </>
                      ) : !isConnected ? (
                        <>
                          <Wallet size={18} />
                          Conectar Wallet
                        </>
                      ) : (
                        <>
                          <ShoppingCart size={18} />
                          Comprar Panel
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
