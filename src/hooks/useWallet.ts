'use client';

import { useState, useEffect } from 'react';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function useWallet() {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const checkIfWalletIsConnected = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }
      }
    } catch (err) {
      console.error('Error checking wallet connection:', err);
    }
  };

  const connectWallet = async () => {
    console.log('🔗 useWallet: Iniciando conexión...');
    setIsConnecting(true);
    setError(null);

    try {
      if (typeof window.ethereum === 'undefined') {
        console.error('🔗 useWallet: MetaMask no detectado');
        throw new Error('MetaMask no está instalado. Por favor instala MetaMask para continuar.');
      }

      console.log('🔗 useWallet: MetaMask detectado, solicitando cuentas...');
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      console.log('🔗 useWallet: Cuentas recibidas:', accounts);

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        console.log('🔗 useWallet: Cuenta establecida:', accounts[0]);
        return accounts[0];
      }
    } catch (err: any) {
      console.error('🔗 useWallet: Error:', err);
      const errorMessage = err.message || 'Error al conectar wallet';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsConnecting(false);
      console.log('🔗 useWallet: Conexión finalizada');
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setError(null);
  };

  return {
    account,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    isConnected: !!account,
  };
}
