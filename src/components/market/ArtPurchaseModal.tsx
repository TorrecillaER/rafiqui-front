'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, ShoppingCart, CheckCircle, AlertCircle, Loader, Palette, User, MessageSquare } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { artMarketplaceApi } from '@/lib/api';
import type { ArtPiece } from '@/types';

interface ArtPurchaseModalProps {
  artPiece: ArtPiece | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ArtPurchaseModal({ artPiece, isOpen, onClose }: ArtPurchaseModalProps) {
  const { account, isConnecting, connectWallet, isConnected } = useWallet();
  const [messageToArtist, setMessageToArtist] = useState('');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  if (!artPiece) return null;

  const formatPrice = (price: number, category: string) => {
    if (category === 'nft') {
      return `${price} ETH`;
    }
    return `$${price.toLocaleString()} USD`;
  };

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
      const buyerId = '7b01e47c-728f-4621-ae9a-2e8831c1ce5d';

      const response = await artMarketplaceApi.purchaseArt({
        artPieceId: artPiece.id,
        buyerWallet: account!,
        buyerId,
        messageToArtist: messageToArtist || undefined,
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
    setMessageToArtist('');
    onClose();
  };

  const categoryLabels = {
    nft: 'NFT Digital',
    sculpture: 'Escultura',
    installation: 'Instalación',
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
                <h2 className="text-2xl font-bold text-white">Comprar Obra de Arte</h2>
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
                        {artPiece.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-dark-400 mb-2">
                        <User size={14} />
                        <span>{artPiece.artist}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Palette size={14} className="text-accent-400" />
                        <span className="text-dark-400">Categoría:</span>
                        <span className="text-white font-medium">{categoryLabels[artPiece.category]}</span>
                      </div>
                      <p className="text-dark-400 text-sm mt-2 line-clamp-2">
                        {artPiece.description}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">
                        <MessageSquare size={14} className="inline mr-1" />
                        Mensaje para el Artista (Opcional)
                      </label>
                      <textarea
                        value={messageToArtist}
                        onChange={(e) => setMessageToArtist(e.target.value)}
                        placeholder="Escribe un mensaje para el artista..."
                        rows={3}
                        className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500 resize-none"
                      />
                    </div>

                    <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-dark-300">Precio:</span>
                        <span className="text-2xl font-bold text-primary-400">
                          {formatPrice(artPiece.price, artPiece.category)}
                        </span>
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
                          Comprar Obra
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
