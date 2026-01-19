---
description: Implementar compra de materiales con transferencia de tokens ERC-1155 a wallet del comprador
---

# Step 16: Compra de Materiales con Transferencia de Tokens

Este workflow implementa el flujo completo de compra de materiales en el marketplace web, incluyendo la transferencia de tokens ERC-1155 a la wallet del comprador.

## Arquitectura del Flujo de Compra

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO DE COMPRA                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Comprador conecta wallet (MetaMask)                     │
│                     ↓                                       │
│  2. Selecciona material y cantidad                          │
│                     ↓                                       │
│  3. Confirma compra y pago                                  │
│                     ↓                                       │
│  4. Backend:                                                │
│     a. Crea orden en BD                                     │
│     b. Actualiza MaterialStock                              │
│     c. Llama transferToBuyer en contrato                    │
│                     ↓                                       │
│  5. Tokens transferidos a wallet del comprador              │
│                     ↓                                       │
│  6. Comprador ve tokens en su wallet                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Parte 1: Backend - Endpoints de Compra

### Paso 1.1: Crear Modelo de Orden en Prisma

Agregar a `prisma/schema.prisma`:

```prisma
enum OrderStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}

model MaterialOrder {
  id              String      @id @default(uuid())
  buyerId         String
  buyer           User        @relation("MaterialBuyer", fields: [buyerId], references: [id])
  
  materialType    MaterialType
  quantityKg      Float
  pricePerKg      Float
  totalPrice      Float
  
  buyerWallet     String      // Wallet address del comprador
  
  status          OrderStatus @default(PENDING)
  blockchainTxHash String?
  
  createdAt       DateTime    @default(now())
  completedAt     DateTime?
}
```

Actualizar modelo User:
```prisma
model User {
  // ... campos existentes ...
  materialOrders  MaterialOrder[] @relation("MaterialBuyer")
  walletAddress   String?         // Wallet del usuario
}
```

Ejecutar migración:
```bash
npx prisma migrate dev --name add_material_orders
```

---

### Paso 1.2: Crear DTOs de Orden

Crear `src/marketplace/dto/material-order.dto.ts`:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, IsEthereumAddress } from 'class-validator';

export class CreateMaterialOrderDto {
  @ApiProperty({ description: 'ID del comprador' })
  @IsString()
  buyerId: string;

  @ApiProperty({ enum: ['ALUMINUM', 'GLASS', 'SILICON', 'COPPER'] })
  @IsString()
  materialType: string;

  @ApiProperty({ description: 'Cantidad en kg' })
  @IsNumber()
  @Min(0.1)
  quantityKg: number;

  @ApiProperty({ description: 'Wallet address del comprador' })
  @IsString()
  buyerWallet: string;
}

export class MaterialOrderResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  order: {
    id: string;
    materialType: string;
    quantityKg: number;
    totalPrice: number;
    status: string;
    blockchainTxHash: string | null;
    tokensTransferred: number;
  };
}

export class MaterialAvailabilityDto {
  @ApiProperty()
  type: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  availableKg: number;

  @ApiProperty()
  availableTokens: number;

  @ApiProperty()
  pricePerKg: number;

  @ApiProperty()
  totalValue: number;
}
```

---

### Paso 1.3: Crear Servicio de Marketplace de Materiales

Crear `src/marketplace/materials-marketplace.service.ts`:

```typescript
import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MaterialsBlockchainService, MaterialTokenId } from '../blockchain/materials-blockchain.service';
import { CreateMaterialOrderDto, MaterialOrderResponseDto, MaterialAvailabilityDto } from './dto/material-order.dto';
import { MaterialType, OrderStatus } from '@prisma/client';
import { ethers } from 'ethers';

const TOKENS_PER_KG = 10;

const MATERIAL_NAMES: Record<string, string> = {
  ALUMINUM: 'Aluminio Reciclado',
  GLASS: 'Vidrio Solar Premium',
  SILICON: 'Silicio Purificado',
  COPPER: 'Cobre Recuperado',
};

@Injectable()
export class MaterialsMarketplaceService {
  private readonly logger = new Logger(MaterialsMarketplaceService.name);

  constructor(
    private prisma: PrismaService,
    private materialsBlockchain: MaterialsBlockchainService,
  ) {}

  /**
   * Obtiene disponibilidad de materiales para compra
   */
  async getAvailability(): Promise<MaterialAvailabilityDto[]> {
    // Obtener stock de BD
    const stocks = await this.prisma.materialStock.findMany({
      orderBy: { type: 'asc' },
    });

    // Obtener balances de blockchain si está conectado
    let blockchainBalances = null;
    if (this.materialsBlockchain.isConnected()) {
      blockchainBalances = await this.materialsBlockchain.getTreasuryBalances();
    }

    return stocks.map(stock => {
      // Usar el menor entre BD y blockchain para evitar overselling
      const blockchainKg = blockchainBalances 
        ? blockchainBalances[stock.type.toLowerCase() as keyof typeof blockchainBalances] 
        : stock.availableKg;
      
      const availableKg = Math.min(stock.availableKg, blockchainKg || stock.availableKg);

      return {
        type: stock.type,
        name: stock.name,
        availableKg,
        availableTokens: Math.floor(availableKg * TOKENS_PER_KG),
        pricePerKg: stock.pricePerKg,
        totalValue: availableKg * stock.pricePerKg,
      };
    });
  }

  /**
   * Crea una orden de compra y transfiere tokens
   */
  async createOrder(dto: CreateMaterialOrderDto): Promise<MaterialOrderResponseDto> {
    const { buyerId, materialType, quantityKg, buyerWallet } = dto;

    // Validar wallet address
    if (!ethers.isAddress(buyerWallet)) {
      throw new BadRequestException('Wallet address inválida');
    }

    // Validar tipo de material
    const validTypes = ['ALUMINUM', 'GLASS', 'SILICON', 'COPPER'];
    if (!validTypes.includes(materialType.toUpperCase())) {
      throw new BadRequestException('Tipo de material inválido');
    }

    const materialTypeEnum = materialType.toUpperCase() as MaterialType;

    // Verificar stock disponible
    const stock = await this.prisma.materialStock.findUnique({
      where: { type: materialTypeEnum },
    });

    if (!stock) {
      throw new NotFoundException('Material no encontrado');
    }

    if (stock.availableKg < quantityKg) {
      throw new BadRequestException(
        `Stock insuficiente. Disponible: ${stock.availableKg} kg, Solicitado: ${quantityKg} kg`
      );
    }

    // Calcular precio total
    const totalPrice = quantityKg * stock.pricePerKg;
    const tokensToTransfer = Math.round(quantityKg * TOKENS_PER_KG);

    // Crear orden en BD
    const order = await this.prisma.materialOrder.create({
      data: {
        buyerId,
        materialType: materialTypeEnum,
        quantityKg,
        pricePerKg: stock.pricePerKg,
        totalPrice,
        buyerWallet,
        status: OrderStatus.PROCESSING,
      },
    });

    // Transferir tokens en blockchain
    let blockchainTxHash: string | null = null;
    
    try {
      if (this.materialsBlockchain.isConnected()) {
        const materialTokenId = this.materialsBlockchain.getMaterialTokenId(materialType);
        
        const result = await this.materialsBlockchain.transferToBuyer(
          buyerWallet,
          materialTokenId,
          quantityKg,
          order.id,
        );

        blockchainTxHash = result.txHash;
        
        this.logger.log(`Tokens transferred: ${tokensToTransfer} to ${buyerWallet}`);
      }
    } catch (error) {
      // Si falla la transferencia, marcar orden como fallida
      await this.prisma.materialOrder.update({
        where: { id: order.id },
        data: { status: OrderStatus.FAILED },
      });

      this.logger.error('Failed to transfer tokens', error);
      throw new BadRequestException('Error al transferir tokens. La orden ha sido cancelada.');
    }

    // Actualizar orden y stock
    await this.prisma.$transaction([
      // Actualizar orden como completada
      this.prisma.materialOrder.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.COMPLETED,
          blockchainTxHash,
          completedAt: new Date(),
        },
      }),
      // Reducir stock disponible
      this.prisma.materialStock.update({
        where: { type: materialTypeEnum },
        data: {
          availableKg: { decrement: quantityKg },
        },
      }),
    ]);

    return {
      success: true,
      message: `Compra exitosa. ${tokensToTransfer} tokens de ${MATERIAL_NAMES[materialType]} transferidos a tu wallet.`,
      order: {
        id: order.id,
        materialType,
        quantityKg,
        totalPrice,
        status: 'COMPLETED',
        blockchainTxHash,
        tokensTransferred: tokensToTransfer,
      },
    };
  }

  /**
   * Obtiene órdenes de un comprador
   */
  async getBuyerOrders(buyerId: string) {
    return this.prisma.materialOrder.findMany({
      where: { buyerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Obtiene balance de tokens de una wallet
   */
  async getWalletBalance(walletAddress: string) {
    if (!ethers.isAddress(walletAddress)) {
      throw new BadRequestException('Wallet address inválida');
    }

    if (!this.materialsBlockchain.isConnected()) {
      return null;
    }

    const balances = await this.materialsBlockchain.getWalletBalances(walletAddress);
    
    return {
      wallet: walletAddress,
      balances: {
        aluminum: { kg: balances.aluminum, tokens: balances.aluminum * TOKENS_PER_KG },
        glass: { kg: balances.glass, tokens: balances.glass * TOKENS_PER_KG },
        silicon: { kg: balances.silicon, tokens: balances.silicon * TOKENS_PER_KG },
        copper: { kg: balances.copper, tokens: balances.copper * TOKENS_PER_KG },
      },
    };
  }

  /**
   * Obtiene estadísticas del marketplace
   */
  async getStats() {
    const [totalOrders, completedOrders, totalRevenue, stockStats] = await Promise.all([
      this.prisma.materialOrder.count(),
      this.prisma.materialOrder.count({ where: { status: OrderStatus.COMPLETED } }),
      this.prisma.materialOrder.aggregate({
        where: { status: OrderStatus.COMPLETED },
        _sum: { totalPrice: true },
      }),
      this.prisma.materialStock.findMany(),
    ]);

    return {
      totalOrders,
      completedOrders,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      stockByMaterial: stockStats.map(s => ({
        type: s.type,
        name: s.name,
        totalKg: s.totalKg,
        availableKg: s.availableKg,
        soldKg: s.totalKg - s.availableKg,
      })),
    };
  }
}
```

---

### Paso 1.4: Crear Controlador de Marketplace

Crear `src/marketplace/materials-marketplace.controller.ts`:

```typescript
import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { MaterialsMarketplaceService } from './materials-marketplace.service';
import { CreateMaterialOrderDto, MaterialOrderResponseDto, MaterialAvailabilityDto } from './dto/material-order.dto';

@ApiTags('Materials Marketplace')
@Controller('marketplace/materials')
export class MaterialsMarketplaceController {
  constructor(private readonly service: MaterialsMarketplaceService) {}

  @Get('availability')
  @ApiOperation({ summary: 'Obtener disponibilidad de materiales para compra' })
  @ApiResponse({ status: 200, type: [MaterialAvailabilityDto] })
  getAvailability() {
    return this.service.getAvailability();
  }

  @Post('purchase')
  @ApiOperation({ 
    summary: 'Comprar materiales y recibir tokens',
    description: 'Crea una orden de compra y transfiere tokens ERC-1155 a la wallet del comprador'
  })
  @ApiResponse({ status: 200, type: MaterialOrderResponseDto })
  createOrder(@Body() dto: CreateMaterialOrderDto) {
    return this.service.createOrder(dto);
  }

  @Get('orders/:buyerId')
  @ApiOperation({ summary: 'Obtener órdenes de un comprador' })
  getBuyerOrders(@Param('buyerId') buyerId: string) {
    return this.service.getBuyerOrders(buyerId);
  }

  @Get('wallet/:address')
  @ApiOperation({ summary: 'Obtener balance de tokens de una wallet' })
  getWalletBalance(@Param('address') address: string) {
    return this.service.getWalletBalance(address);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas del marketplace' })
  getStats() {
    return this.service.getStats();
  }
}
```

---

### Paso 1.5: Crear Módulo de Marketplace

Crear `src/marketplace/marketplace.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { MaterialsMarketplaceController } from './materials-marketplace.controller';
import { MaterialsMarketplaceService } from './materials-marketplace.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [PrismaModule, BlockchainModule],
  controllers: [MaterialsMarketplaceController],
  providers: [MaterialsMarketplaceService],
  exports: [MaterialsMarketplaceService],
})
export class MarketplaceModule {}
```

Registrar en `app.module.ts`:
```typescript
import { MarketplaceModule } from './marketplace/marketplace.module';

@Module({
  imports: [
    // ... otros módulos
    MarketplaceModule,
  ],
})
export class AppModule {}
```

---

## Parte 2: Frontend - UI de Compra

### Paso 2.1: Instalar Dependencias para Web3

```bash
cd rafiqui-front
npm install ethers@6 @web3modal/ethers
```

---

### Paso 2.2: Crear Hook de Wallet

Crear `src/hooks/useWallet.ts`:

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers, BrowserProvider } from 'ethers';

interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isConnecting: false,
    chainId: null,
    error: null,
  });

  const checkConnection = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      return;
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      
      if (accounts.length > 0) {
        const network = await provider.getNetwork();
        setState({
          address: accounts[0].address,
          isConnected: true,
          isConnecting: false,
          chainId: Number(network.chainId),
          error: null,
        });
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  }, []);

  const connect = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setState(prev => ({ ...prev, error: 'MetaMask no está instalado' }));
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const network = await provider.getNetwork();

      setState({
        address: accounts[0],
        isConnected: true,
        isConnecting: false,
        chainId: Number(network.chainId),
        error: null,
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Error al conectar wallet',
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({
      address: null,
      isConnected: false,
      isConnecting: false,
      chainId: null,
      error: null,
    });
  }, []);

  // Escuchar cambios de cuenta
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setState(prev => ({ ...prev, address: accounts[0] }));
      }
    };

    const handleChainChanged = (chainId: string) => {
      setState(prev => ({ ...prev, chainId: parseInt(chainId, 16) }));
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    checkConnection();

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [checkConnection, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    shortAddress: state.address 
      ? `${state.address.slice(0, 6)}...${state.address.slice(-4)}`
      : null,
  };
}
```

---

### Paso 2.3: Crear API de Marketplace

Agregar a `src/lib/api.ts`:

```typescript
// Materials Marketplace API
export interface MaterialAvailability {
  type: string;
  name: string;
  availableKg: number;
  availableTokens: number;
  pricePerKg: number;
  totalValue: number;
}

export interface CreateMaterialOrderRequest {
  buyerId: string;
  materialType: string;
  quantityKg: number;
  buyerWallet: string;
}

export interface MaterialOrderResponse {
  success: boolean;
  message: string;
  order: {
    id: string;
    materialType: string;
    quantityKg: number;
    totalPrice: number;
    status: string;
    blockchainTxHash: string | null;
    tokensTransferred: number;
  };
}

export interface WalletBalance {
  wallet: string;
  balances: {
    aluminum: { kg: number; tokens: number };
    glass: { kg: number; tokens: number };
    silicon: { kg: number; tokens: number };
    copper: { kg: number; tokens: number };
  };
}

export const materialsMarketplaceApi = {
  getAvailability: () =>
    apiRequest<MaterialAvailability[]>('/marketplace/materials/availability'),

  purchase: (data: CreateMaterialOrderRequest) =>
    apiRequest<MaterialOrderResponse>('/marketplace/materials/purchase', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getWalletBalance: (address: string) =>
    apiRequest<WalletBalance>(`/marketplace/materials/wallet/${address}`),

  getBuyerOrders: (buyerId: string) =>
    apiRequest<any[]>(`/marketplace/materials/orders/${buyerId}`),
};
```

---

### Paso 2.4: Crear Componente de Compra de Material

Crear `src/components/market/MaterialPurchaseModal.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, Package, ArrowRight, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { materialsMarketplaceApi, MaterialAvailability } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

interface MaterialPurchaseModalProps {
  material: MaterialAvailability | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function MaterialPurchaseModal({ 
  material, 
  isOpen, 
  onClose,
  onSuccess 
}: MaterialPurchaseModalProps) {
  const { address, isConnected, connect, isConnecting, shortAddress } = useWallet();
  const { user } = useAuthStore();
  
  const [quantity, setQuantity] = useState(1);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState<{
    success: boolean;
    message: string;
    txHash?: string;
    tokensTransferred?: number;
  } | null>(null);

  if (!material) return null;

  const totalPrice = quantity * material.pricePerKg;
  const tokensToReceive = Math.round(quantity * 10); // 10 tokens per kg
  const maxQuantity = Math.floor(material.availableKg);

  const handlePurchase = async () => {
    if (!address || !user) return;

    setIsPurchasing(true);
    setPurchaseResult(null);

    try {
      const response = await materialsMarketplaceApi.purchase({
        buyerId: user.id,
        materialType: material.type,
        quantityKg: quantity,
        buyerWallet: address,
      });

      if (response.data) {
        setPurchaseResult({
          success: true,
          message: response.data.message,
          txHash: response.data.order.blockchainTxHash || undefined,
          tokensTransferred: response.data.order.tokensTransferred,
        });
        onSuccess?.();
      } else {
        setPurchaseResult({
          success: false,
          message: response.error || 'Error al procesar la compra',
        });
      }
    } catch (error) {
      setPurchaseResult({
        success: false,
        message: 'Error de conexión',
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleClose = () => {
    setPurchaseResult(null);
    setQuantity(1);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-dark-800 rounded-2xl max-w-md w-full overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-dark-700">
              <div className="flex items-center gap-2">
                <Package className="text-primary-400" size={20} />
                <span className="font-semibold text-white">Comprar {material.name}</span>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {purchaseResult ? (
                // Resultado de compra
                <div className="text-center py-4">
                  {purchaseResult.success ? (
                    <>
                      <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                        <CheckCircle className="text-green-500" size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">¡Compra Exitosa!</h3>
                      <p className="text-dark-400 mb-4">{purchaseResult.message}</p>
                      
                      {purchaseResult.tokensTransferred && (
                        <div className="bg-dark-700 rounded-xl p-4 mb-4">
                          <p className="text-sm text-dark-400">Tokens recibidos</p>
                          <p className="text-2xl font-bold text-primary-400">
                            {purchaseResult.tokensTransferred} tokens
                          </p>
                        </div>
                      )}

                      {purchaseResult.txHash && (
                        <a
                          href={`https://amoy.polygonscan.com/tx/${purchaseResult.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-accent-400 hover:underline"
                        >
                          Ver en Polygonscan
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                        <X className="text-red-500" size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Error</h3>
                      <p className="text-dark-400">{purchaseResult.message}</p>
                    </>
                  )}

                  <button
                    onClick={handleClose}
                    className="mt-6 w-full py-3 bg-dark-700 hover:bg-dark-600 text-white rounded-xl transition-all"
                  >
                    Cerrar
                  </button>
                </div>
              ) : (
                // Formulario de compra
                <>
                  {/* Wallet Connection */}
                  {!isConnected ? (
                    <div className="mb-6 p-4 bg-dark-700 rounded-xl">
                      <p className="text-dark-400 text-sm mb-3">
                        Conecta tu wallet para recibir los tokens
                      </p>
                      <button
                        onClick={connect}
                        disabled={isConnecting}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-accent-500 hover:bg-accent-600 text-white rounded-xl transition-all disabled:opacity-50"
                      >
                        {isConnecting ? (
                          <Loader2 className="animate-spin" size={18} />
                        ) : (
                          <Wallet size={18} />
                        )}
                        {isConnecting ? 'Conectando...' : 'Conectar MetaMask'}
                      </button>
                    </div>
                  ) : (
                    <div className="mb-6 p-4 bg-dark-700 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet className="text-green-500" size={18} />
                        <span className="text-white">{shortAddress}</span>
                      </div>
                      <span className="text-xs text-green-500 bg-green-500/20 px-2 py-1 rounded-full">
                        Conectado
                      </span>
                    </div>
                  )}

                  {/* Quantity Selector */}
                  <div className="mb-6">
                    <label className="block text-sm text-dark-400 mb-2">
                      Cantidad (kg)
                    </label>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 bg-dark-700 hover:bg-dark-600 rounded-lg text-white transition-all"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.min(maxQuantity, Math.max(1, parseInt(e.target.value) || 1)))}
                        className="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-center text-white text-xl font-bold"
                      />
                      <button
                        onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                        className="w-10 h-10 bg-dark-700 hover:bg-dark-600 rounded-lg text-white transition-all"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-xs text-dark-500 mt-1">
                      Disponible: {material.availableKg.toFixed(1)} kg
                    </p>
                  </div>

                  {/* Summary */}
                  <div className="bg-dark-700 rounded-xl p-4 mb-6 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-400">Precio por kg</span>
                      <span className="text-white">${material.pricePerKg.toFixed(2)} USD</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-400">Cantidad</span>
                      <span className="text-white">{quantity} kg</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-400">Tokens a recibir</span>
                      <span className="text-accent-400">{tokensToReceive} tokens</span>
                    </div>
                    <div className="border-t border-dark-600 pt-3 flex justify-between">
                      <span className="text-white font-semibold">Total</span>
                      <span className="text-primary-400 font-bold text-xl">
                        ${totalPrice.toFixed(2)} USD
                      </span>
                    </div>
                  </div>

                  {/* Purchase Button */}
                  <button
                    onClick={handlePurchase}
                    disabled={!isConnected || isPurchasing || quantity < 1}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPurchasing ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Procesando...
                      </>
                    ) : (
                      <>
                        Comprar y Recibir Tokens
                        <ArrowRight size={20} />
                      </>
                    )}
                  </button>

                  <p className="text-xs text-dark-500 text-center mt-4">
                    Los tokens serán transferidos a tu wallet automáticamente
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

### Paso 2.5: Actualizar MaterialCard para Incluir Compra

Modificar `src/components/market/MaterialCard.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, ShoppingCart, Coins } from 'lucide-react';
import { MaterialPurchaseModal } from './MaterialPurchaseModal';
import type { MaterialAvailability } from '@/lib/api';

interface MaterialCardProps {
  material: MaterialAvailability;
  onPurchaseSuccess?: () => void;
}

const materialIcons: Record<string, string> = {
  ALUMINUM: '🔩',
  GLASS: '🪟',
  SILICON: '💎',
  COPPER: '🔶',
};

const materialColors: Record<string, string> = {
  ALUMINUM: 'from-gray-500 to-gray-600',
  GLASS: 'from-cyan-500 to-blue-500',
  SILICON: 'from-purple-500 to-pink-500',
  COPPER: 'from-orange-500 to-red-500',
};

export function MaterialCard({ material, onPurchaseSuccess }: MaterialCardProps) {
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        className="bg-dark-800 rounded-2xl p-6 border border-dark-700 hover:border-primary-500/50 transition-all"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${materialColors[material.type]} flex items-center justify-center text-2xl`}>
            {materialIcons[material.type]}
          </div>
          <div className="flex items-center gap-1 text-xs bg-accent-500/20 text-accent-400 px-2 py-1 rounded-full">
            <Coins size={12} />
            <span>{material.availableTokens} tokens</span>
          </div>
        </div>

        {/* Info */}
        <h3 className="text-lg font-semibold text-white mb-1">{material.name}</h3>
        <p className="text-dark-400 text-sm mb-4">
          {material.availableKg.toFixed(1)} kg disponibles
        </p>

        {/* Price */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-dark-400 text-sm">Precio por kg</span>
          <span className="text-primary-400 font-bold text-lg">
            ${material.pricePerKg.toFixed(2)}
          </span>
        </div>

        {/* Buy Button */}
        <button
          onClick={() => setShowPurchaseModal(true)}
          disabled={material.availableKg < 0.1}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-dark-700 disabled:text-dark-500 text-white rounded-xl font-medium transition-all"
        >
          <ShoppingCart size={18} />
          {material.availableKg < 0.1 ? 'Sin Stock' : 'Comprar'}
        </button>
      </motion.div>

      <MaterialPurchaseModal
        material={material}
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onSuccess={onPurchaseSuccess}
      />
    </>
  );
}
```

---

## Verificación

### Probar el flujo completo

1. **Reciclar un panel** para generar tokens
2. **Verificar tokens en treasury**:
   ```bash
   curl http://localhost:4000/recycle/tokens
   ```

3. **Ver disponibilidad en marketplace**:
   ```bash
   curl http://localhost:4000/marketplace/materials/availability
   ```

4. **Realizar compra**:
   ```bash
   curl -X POST http://localhost:4000/marketplace/materials/purchase \
     -H "Content-Type: application/json" \
     -d '{
       "buyerId": "user-uuid",
       "materialType": "ALUMINUM",
       "quantityKg": 2,
       "buyerWallet": "0x..."
     }'
   ```

5. **Verificar tokens en wallet del comprador**:
   ```bash
   curl http://localhost:4000/marketplace/materials/wallet/0x...
   ```

---

## Resumen de Archivos

### Backend
| Archivo | Descripción |
|---------|-------------|
| `prisma/schema.prisma` | Modelo MaterialOrder |
| `src/marketplace/dto/material-order.dto.ts` | DTOs de órdenes |
| `src/marketplace/materials-marketplace.service.ts` | Lógica de compra |
| `src/marketplace/materials-marketplace.controller.ts` | Endpoints |
| `src/marketplace/marketplace.module.ts` | Módulo |

### Frontend
| Archivo | Descripción |
|---------|-------------|
| `src/hooks/useWallet.ts` | Hook para conexión MetaMask |
| `src/lib/api.ts` | API de marketplace |
| `src/components/market/MaterialPurchaseModal.tsx` | Modal de compra |
| `src/components/market/MaterialCard.tsx` | Card con botón comprar |

---

## Diagrama de Flujo Completo

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO COMPLETO                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  RECICLAJE (Operador)                                       │
│  ─────────────────────                                      │
│  1. Escanear panel RECYCLE                                  │
│  2. Confirmar reciclaje                                     │
│  3. Backend:                                                │
│     - Calcular materiales                                   │
│     - Guardar en BD                                         │
│     - Mintear tokens → Treasury Wallet                      │
│                                                             │
│  COMPRA (Cliente)                                           │
│  ────────────────                                           │
│  1. Conectar MetaMask                                       │
│  2. Seleccionar material y cantidad                         │
│  3. Confirmar compra                                        │
│  4. Backend:                                                │
│     - Crear orden                                           │
│     - transferToBuyer() en contrato                         │
│     - Tokens → Wallet del comprador                         │
│                                                             │
│  RESULTADO                                                  │
│  ─────────                                                  │
│  - Comprador tiene tokens ERC-1155 en su wallet             │
│  - Puede verlos en MetaMask/OpenSea                         │
│  - Puede transferirlos a otros                              │
│  - Puede canjearlos por material físico                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```
