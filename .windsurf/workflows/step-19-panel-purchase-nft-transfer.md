---
description: Implementar compra de paneles reacondicionados con transferencia de NFT ERC-721 al comprador
---

# Step 19: Compra de Paneles con Transferencia de NFT

## Descripción
Este workflow implementa la compra de paneles reacondicionados (LISTED_FOR_SALE) con transferencia del token ERC-721 del contrato RafiquiTracker a la wallet del comprador.

## Contexto
- Los paneles reacondicionados tienen un token ERC-721 en el contrato `RafiquiTracker`
- Cada panel tiene un `tokenId` único asignado cuando se registra en blockchain
- Al comprar un panel, el NFT se transfiere del treasury a la wallet del comprador

## Archivos a Crear/Modificar

### 1. Backend - DTO de Orden de Panel (`rafiqui-back/src/marketplace/dto/panel-order.dto.ts`)

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum PanelPurchaseDestination {
  RESIDENTIAL = 'RESIDENTIAL',       // Uso residencial
  COMMERCIAL = 'COMMERCIAL',         // Uso comercial
  INDUSTRIAL = 'INDUSTRIAL',         // Uso industrial
  RESEARCH = 'RESEARCH',             // Investigación
  RESALE = 'RESALE',                 // Reventa
  OTHER = 'OTHER',
}

export class CreatePanelOrderDto {
  @ApiProperty({ description: 'ID del panel a comprar' })
  @IsString()
  assetId: string;

  @ApiProperty({ description: 'Wallet address del comprador' })
  @IsString()
  buyerWallet: string;

  @ApiProperty({ enum: PanelPurchaseDestination })
  @IsEnum(PanelPurchaseDestination)
  destination: PanelPurchaseDestination;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  destinationNotes?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  buyerId?: string;
}

export class PanelOrderResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  order: {
    id: string;
    assetId: string;
    tokenId: number;
    price: number;
    blockchainTxHash: string | null;
  };
}
```

### 2. Backend - Servicio de Compra de Paneles (`rafiqui-back/src/marketplace/panels-marketplace.service.ts`)

```typescript
import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CreatePanelOrderDto, PanelOrderResponseDto } from './dto/panel-order.dto';
import { AssetStatus } from '@prisma/client';
import { ethers } from 'ethers';

@Injectable()
export class PanelsMarketplaceService {
  private readonly logger = new Logger(PanelsMarketplaceService.name);

  constructor(
    private prisma: PrismaService,
    private blockchainService: BlockchainService,
  ) {}

  async purchasePanel(dto: CreatePanelOrderDto): Promise<PanelOrderResponseDto> {
    const { assetId, buyerWallet, destination, destinationNotes, buyerId } = dto;

    // Validar wallet
    if (!ethers.isAddress(buyerWallet)) {
      throw new BadRequestException('Wallet address inválida');
    }

    // Buscar el panel
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      throw new NotFoundException('Panel no encontrado');
    }

    if (asset.status !== AssetStatus.LISTED_FOR_SALE) {
      throw new BadRequestException('Este panel no está disponible para venta');
    }

    if (!asset.tokenId) {
      throw new BadRequestException('Este panel no tiene token en blockchain');
    }

    // Calcular precio (basado en datos técnicos del panel)
    const price = this.calculatePanelPrice(asset);

    // Crear orden
    const order = await this.prisma.panelOrder.create({
      data: {
        assetId,
        buyerId: buyerId || null,
        buyerWallet,
        price,
        destination,
        destinationNotes,
        status: 'PROCESSING',
      },
    });

    let txHash: string | null = null;

    try {
      // Transferir NFT al comprador
      txHash = await this.blockchainService.transferPanel(
        asset.tokenId,
        buyerWallet,
      );

      // Actualizar estado del panel
      await this.prisma.asset.update({
        where: { id: assetId },
        data: {
          status: AssetStatus.REUSED,
          soldAt: new Date(),
          buyerWallet,
        },
      });

      // Actualizar orden
      await this.prisma.panelOrder.update({
        where: { id: order.id },
        data: {
          status: 'COMPLETED',
          blockchainTxHash: txHash,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Panel ${assetId} sold to ${buyerWallet}. TxHash: ${txHash}`);

    } catch (error) {
      this.logger.error(`Error transferring panel ${assetId}:`, error);
      
      await this.prisma.panelOrder.update({
        where: { id: order.id },
        data: { status: 'FAILED' },
      });

      throw new BadRequestException('Error al transferir el panel en blockchain');
    }

    return {
      success: true,
      message: 'Panel comprado exitosamente. NFT transferido a tu wallet.',
      order: {
        id: order.id,
        assetId,
        tokenId: asset.tokenId,
        price,
        blockchainTxHash: txHash,
      },
    };
  }

  private calculatePanelPrice(asset: any): number {
    // Precio base + ajuste por potencia y voltaje
    const basePrice = 150;
    const powerBonus = (asset.measuredPower || 0) * 0.5;
    const voltageBonus = (asset.measuredVoltage || 0) * 2;
    return Math.round(basePrice + powerBonus + voltageBonus);
  }
}
```

### 3. Backend - Método de Transferencia en BlockchainService (`rafiqui-back/src/blockchain/blockchain.service.ts`)

Agregar método `transferPanel`:

```typescript
async transferPanel(tokenId: number, toAddress: string): Promise<string> {
  if (!this.contract || !this.wallet) {
    throw new Error('Blockchain not connected');
  }

  this.logger.log(`Transferring panel tokenId ${tokenId} to ${toAddress}`);

  // El treasury (wallet del backend) transfiere el NFT al comprador
  const tx = await this.contract.safeTransferFrom(
    this.wallet.address,  // from: treasury
    toAddress,            // to: buyer
    tokenId,              // tokenId
  );

  const receipt = await tx.wait();
  this.logger.log(`Panel transferred. TxHash: ${receipt.hash}`);

  return receipt.hash;
}
```

### 4. Backend - Schema Prisma (`rafiqui-back/prisma/schema.prisma`)

Agregar modelo `PanelOrder`:

```prisma
enum PanelPurchaseDestination {
  RESIDENTIAL
  COMMERCIAL
  INDUSTRIAL
  RESEARCH
  RESALE
  OTHER
}

model PanelOrder {
  id              String       @id @default(uuid())
  assetId         String
  asset           Asset        @relation(fields: [assetId], references: [id])
  
  buyerId         String?
  buyer           User?        @relation("PanelBuyer", fields: [buyerId], references: [id])
  
  buyerWallet     String
  price           Float
  
  destination     PanelPurchaseDestination @default(OTHER)
  destinationNotes String?
  
  status          OrderStatus  @default(PENDING)
  blockchainTxHash String?
  
  createdAt       DateTime     @default(now())
  completedAt     DateTime?
}
```

### 5. Backend - Campos adicionales en Asset (`rafiqui-back/prisma/schema.prisma`)

Agregar a modelo `Asset`:

```prisma
model Asset {
  // ... campos existentes ...
  
  soldAt          DateTime?
  buyerWallet     String?
  panelOrders     PanelOrder[]
}
```

### 6. Frontend - Modal de Compra de Panel (`rafiqui-front/src/components/market/PanelPurchaseModal.tsx`)

Similar a `MaterialPurchaseModal` pero para paneles:
- Selector de destino (Residencial, Comercial, Industrial, etc.)
- Conexión de wallet
- Confirmación de compra
- Mostrar txHash al completar

### 7. Frontend - API (`rafiqui-front/src/lib/api.ts`)

```typescript
export enum PanelPurchaseDestination {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
  INDUSTRIAL = 'INDUSTRIAL',
  RESEARCH = 'RESEARCH',
  RESALE = 'RESALE',
  OTHER = 'OTHER',
}

export const PanelDestinationLabels: Record<PanelPurchaseDestination, string> = {
  [PanelPurchaseDestination.RESIDENTIAL]: 'Uso Residencial',
  [PanelPurchaseDestination.COMMERCIAL]: 'Uso Comercial',
  [PanelPurchaseDestination.INDUSTRIAL]: 'Uso Industrial',
  [PanelPurchaseDestination.RESEARCH]: 'Investigación',
  [PanelPurchaseDestination.RESALE]: 'Reventa',
  [PanelPurchaseDestination.OTHER]: 'Otro',
};

export interface CreatePanelOrder {
  assetId: string;
  buyerWallet: string;
  destination: PanelPurchaseDestination;
  destinationNotes?: string;
  buyerId?: string;
}

export const panelsMarketplaceApi = {
  purchasePanel: (order: CreatePanelOrder) =>
    apiRequest<PanelOrderResponse>('/marketplace/panels/purchase', {
      method: 'POST',
      body: JSON.stringify(order),
    }),
};
```

## Flujo de Compra

1. Usuario navega al marketplace → pestaña "Paneles 2da Mano"
2. Selecciona un panel reacondicionado (LISTED_FOR_SALE)
3. Click en "Comprar"
4. Se abre modal de compra:
   - Muestra detalles del panel (marca, modelo, potencia, voltaje)
   - Muestra precio calculado
   - Selector de destino del panel
   - Botón "Conectar Wallet" si no está conectada
5. Usuario conecta MetaMask
6. Usuario confirma compra
7. Backend:
   - Valida disponibilidad del panel
   - Crea orden en BD
   - Transfiere NFT ERC-721 al comprador via `safeTransferFrom`
   - Actualiza estado del panel a REUSED
8. Frontend muestra confirmación con txHash

## Verificación

1. Comprar un panel desde el marketplace
2. Verificar en PolygonScan que el NFT fue transferido:
   ```
   https://amoy.polygonscan.com/address/{BUYER_WALLET}#tokentxnsErc721
   ```
3. Verificar en MetaMask → NFT que aparece el panel
4. Verificar en BD que el panel tiene status REUSED

## Contratos Involucrados

| Contrato | Address | Tipo |
|----------|---------|------|
| RafiquiTracker | Ver .env | ERC-721 (Paneles y Arte) |

## Token IDs

Los paneles tienen `tokenId` asignado secuencialmente cuando se registran en blockchain. El `tokenId` se guarda en el campo `Asset.tokenId` de la BD.
