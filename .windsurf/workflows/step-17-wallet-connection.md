---
description: Configurar conexión de wallet MetaMask para compras en el marketplace
---

# Step 17: Conexión de Wallet MetaMask

## Descripción
Este workflow documenta la implementación de conexión de wallet para el marketplace de materiales.

## Archivos Implementados

### 1. Hook useWallet (`src/hooks/useWallet.ts`)
Hook personalizado para manejar la conexión con MetaMask:
- `account`: Dirección de la wallet conectada
- `isConnecting`: Estado de conexión en progreso
- `error`: Mensaje de error si falla la conexión
- `connectWallet()`: Función para solicitar conexión
- `disconnectWallet()`: Función para desconectar
- `isConnected`: Boolean indicando si hay wallet conectada

### 2. Funcionalidades
- Detecta automáticamente si MetaMask está instalado
- Verifica conexiones previas al cargar la página
- Maneja errores de conexión con mensajes claros
- Soporta cambio de cuenta automático

## Uso

```tsx
import { useWallet } from '@/hooks/useWallet';

function MyComponent() {
  const { account, isConnecting, connectWallet, isConnected } = useWallet();

  return (
    <button onClick={connectWallet} disabled={isConnecting}>
      {isConnected ? `${account.slice(0,6)}...${account.slice(-4)}` : 'Conectar Wallet'}
    </button>
  );
}
```

## Requisitos
- MetaMask instalado en el navegador
- Red Polygon Amoy configurada en MetaMask

## Configuración de Red Polygon Amoy en MetaMask
1. Abrir MetaMask → Configuración → Redes → Agregar Red
2. Datos:
   - Nombre: Polygon Amoy Testnet
   - RPC URL: https://rpc-amoy.polygon.technology/
   - Chain ID: 80002
   - Símbolo: MATIC
   - Explorer: https://amoy.polygonscan.com/
