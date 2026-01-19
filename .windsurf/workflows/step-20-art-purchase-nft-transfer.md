---
description: Implementar compra de obras de arte con transferencia de NFT ERC-721 al comprador
---

# Step 20: Compra de Obras de Arte con Transferencia de NFT

## Descripción
Este workflow implementa la compra de obras de arte (ArtPiece) publicadas en la galería con transferencia del token ERC-721 del contrato RafiquiTracker a la wallet del comprador.

## Contexto
- Las obras de arte tienen un token ERC-721 en el contrato `RafiquiTracker` (mismo contrato que paneles)
- Cada obra tiene un `tokenId` único asignado cuando se publica
- El artista define el precio al publicar la obra
- Al comprar, el NFT se transfiere del treasury a la wallet del comprador
- El artista recibe un porcentaje de la venta (royalties)

## Archivos a Crear/Modificar

### 1. Backend - DTO de Orden de Arte (`rafiqui-back/src/marketplace/dto/art-order.dto.ts`)

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateArtOrderDto {
  @ApiProperty({ description: 'ID de la obra de arte' })
  @IsString()
  artPieceId: string;

  @ApiProperty({ description: 'Wallet address del comprador' })
  @IsString()
  buyerWallet: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  buyerId?: string;

  @ApiProperty({ required: false, description: 'Mensaje para el artista' })
  @IsString()
  @IsOptional()
  messageToArtist?: string;
}

export class ArtOrderResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  order: {
    id: string;
    artPieceId: string;
    tokenId: string;
    title: string;
    artistName: string;
    price: number;
    blockchainTxHash: string | null;
  };
}
```

### 2. Backend - Schema Prisma (`rafiqui-back/prisma/schema.prisma`)

Agregar modelo `ArtOrder`:

```prisma
model ArtOrder {
  id              String       @id @default(uuid())
  artPieceId      String
  artPiece        ArtPiece     @relation(fields: [artPieceId], references: [id])
  
  buyerId         String?
  buyer           User?        @relation("ArtBuyer", fields: [buyerId], references: [id])
  
  buyerWallet     String
  price           Float
  
  messageToArtist String?
  
  status          OrderStatus  @default(PENDING)
  blockchainTxHash String?
  
  createdAt       DateTime     @default(now())
  completedAt     DateTime?
}
```

Agregar relación en ArtPiece:
```prisma
model ArtPiece {
  // ... campos existentes ...
  orders          ArtOrder[]
  soldAt          DateTime?
  buyerWallet     String?
}
```

Agregar relación en User:
```prisma
model User {
  // ... campos existentes ...
  artOrders       ArtOrder[] @relation("ArtBuyer")
}
```

### 3. Backend - Servicio de Compra de Arte (`rafiqui-back/src/marketplace/art-marketplace.service.ts`)

```typescript
import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CreateArtOrderDto, ArtOrderResponseDto } from './dto/art-order.dto';
import { OrderStatus } from '@prisma/client';
import { ethers } from 'ethers';

@Injectable()
export class ArtMarketplaceService {
  private readonly logger = new Logger(ArtMarketplaceService.name);

  constructor(
    private prisma: PrismaService,
    private blockchainService: BlockchainService,
  ) {}

  async purchaseArt(dto: CreateArtOrderDto): Promise<ArtOrderResponseDto> {
    const { artPieceId, buyerWallet, buyerId, messageToArtist } = dto;

    if (!ethers.isAddress(buyerWallet)) {
      throw new BadRequestException('Wallet address inválida');
    }

    // Buscar la obra de arte
    const artPiece = await this.prisma.artPiece.findUnique({
      where: { id: artPieceId },
      include: { asset: true },
    });

    if (!artPiece) {
      throw new NotFoundException('Obra de arte no encontrada');
    }

    if (artPiece.status !== 'PUBLISHED') {
      throw new BadRequestException('Esta obra no está disponible para venta');
    }

    if (!artPiece.tokenId) {
      throw new BadRequestException('Esta obra no tiene token en blockchain');
    }

    // Crear orden
    const order = await this.prisma.artOrder.create({
      data: {
        artPieceId,
        buyerId: buyerId || null,
        buyerWallet,
        price: artPiece.price,
        messageToArtist,
        status: OrderStatus.PROCESSING,
      },
    });

    let txHash: string | null = null;

    try {
      // Transferir NFT al comprador
      txHash = await this.blockchainService.transferArt(
        artPiece.tokenId,
        buyerWallet,
      );

      // Actualizar estado de la obra
      await this.prisma.artPiece.update({
        where: { id: artPieceId },
        data: {
          status: 'SOLD',
          soldAt: new Date(),
          buyerWallet,
        },
      });

      // Actualizar orden
      await this.prisma.artOrder.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.COMPLETED,
          blockchainTxHash: txHash,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Art piece ${artPieceId} sold to ${buyerWallet}. TxHash: ${txHash}`);

    } catch (error) {
      this.logger.error(`Error transferring art ${artPieceId}:`, error);
      
      await this.prisma.artOrder.update({
        where: { id: order.id },
        data: { status: OrderStatus.FAILED },
      });

      throw new BadRequestException('Error al transferir la obra en blockchain');
    }

    return {
      success: true,
      message: 'Obra de arte comprada exitosamente. NFT transferido a tu wallet.',
      order: {
        id: order.id,
        artPieceId,
        tokenId: artPiece.tokenId,
        title: artPiece.title,
        artistName: artPiece.artistName,
        price: artPiece.price,
        blockchainTxHash: txHash,
      },
    };
  }

  async getAvailableArt() {
    return this.prisma.artPiece.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        asset: {
          select: {
            brand: true,
            model: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getArtDetails(artPieceId: string) {
    return this.prisma.artPiece.findUnique({
      where: { id: artPieceId },
      include: {
        asset: true,
      },
    });
  }
}
```

### 4. Backend - Método transferArt en BlockchainService

Agregar a `src/blockchain/blockchain.service.ts`:

```typescript
/**
 * Transfiere una obra de arte (NFT ERC-721) a un comprador
 */
async transferArt(tokenId: string, toAddress: string): Promise<string> {
  if (!this.contract || !this.wallet) {
    throw new Error('Blockchain not connected');
  }

  this.logger.log(`Transferring art tokenId ${tokenId} to ${toAddress}`);

  try {
    const tx = await this.contract.safeTransferFrom(
      this.wallet.address,  // from: treasury
      toAddress,            // to: buyer
      tokenId,              // tokenId
    );

    const receipt = await tx.wait();
    this.logger.log(`Art transferred successfully. TxHash: ${receipt.hash}`);

    return receipt.hash;
  } catch (error) {
    this.logger.error(`Error transferring art tokenId ${tokenId}:`, error);
    throw error;
  }
}
```

### 5. Backend - Controlador (`rafiqui-back/src/marketplace/art-marketplace.controller.ts`)

```typescript
import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ArtMarketplaceService } from './art-marketplace.service';
import { CreateArtOrderDto, ArtOrderResponseDto } from './dto/art-order.dto';

@ApiTags('Art Marketplace')
@Controller('marketplace/art')
export class ArtMarketplaceController {
  constructor(private artMarketplace: ArtMarketplaceService) {}

  @Get('available')
  @ApiOperation({ summary: 'Obtener obras de arte disponibles para venta' })
  async getAvailableArt() {
    return this.artMarketplace.getAvailableArt();
  }

  @Get(':artPieceId')
  @ApiOperation({ summary: 'Obtener detalles de una obra de arte' })
  async getArtDetails(@Param('artPieceId') artPieceId: string) {
    return this.artMarketplace.getArtDetails(artPieceId);
  }

  @Post('purchase')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Comprar una obra de arte' })
  @ApiResponse({ status: 201, type: ArtOrderResponseDto })
  async purchaseArt(@Body() dto: CreateArtOrderDto): Promise<ArtOrderResponseDto> {
    return this.artMarketplace.purchaseArt(dto);
  }
}
```

### 6. Frontend - API Types (`rafiqui-front/src/lib/api.ts`)

```typescript
// Art Marketplace API
export interface CreateArtOrder {
  artPieceId: string;
  buyerWallet: string;
  buyerId?: string;
  messageToArtist?: string;
}

export interface ArtOrderResponse {
  success: boolean;
  message: string;
  order: {
    id: string;
    artPieceId: string;
    tokenId: string;
    title: string;
    artistName: string;
    price: number;
    blockchainTxHash: string | null;
  };
}

export const artMarketplaceApi = {
  getAvailableArt: () =>
    apiRequest<any[]>('/marketplace/art/available'),

  getArtDetails: (artPieceId: string) =>
    apiRequest<any>(`/marketplace/art/${artPieceId}`),

  purchaseArt: (data: CreateArtOrder) =>
    apiRequest<ArtOrderResponse>('/marketplace/art/purchase', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
```

### 7. Frontend - Modal de Compra de Arte (`rafiqui-front/src/components/market/ArtPurchaseModal.tsx`)

Similar a `MaterialPurchaseModal` pero para obras de arte:
- Muestra imagen de la obra
- Muestra título, artista y precio
- Campo opcional para mensaje al artista
- Conexión de wallet
- Confirmación de compra
- Mostrar txHash al completar

## Flujo de Compra de Arte

1. Usuario navega al marketplace → pestaña "Galería de Arte"
2. Selecciona una obra de arte (status PUBLISHED)
3. Click en "Comprar"
4. Se abre modal de compra:
   - Muestra imagen de la obra
   - Muestra título, artista, descripción
   - Muestra precio
   - Campo opcional para mensaje al artista
   - Botón "Conectar Wallet" si no está conectada
5. Usuario conecta MetaMask
6. Usuario confirma compra
7. Backend:
   - Valida disponibilidad de la obra
   - Crea orden en BD
   - Transfiere NFT ERC-721 al comprador via `safeTransferFrom`
   - Actualiza estado de la obra a SOLD
8. Frontend muestra confirmación con txHash

## Verificación

1. Publicar una obra de arte desde la app móvil
2. Comprar la obra desde el marketplace web
3. Verificar en PolygonScan que el NFT fue transferido:
   ```
   https://amoy.polygonscan.com/address/{BUYER_WALLET}#tokentxnsErc721
   ```
4. Verificar en MetaMask → NFT que aparece la obra
5. Verificar en BD que la obra tiene status SOLD

## Diferencias con Compra de Paneles

| Aspecto | Paneles | Arte |
|---------|---------|------|
| Precio | Calculado por sistema | Definido por artista |
| Destino | Selector obligatorio | No aplica |
| Mensaje | No | Opcional para artista |
| Status final | REUSED | SOLD |

## Endpoints Resultantes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/marketplace/art/available` | Lista obras en venta |
| GET | `/marketplace/art/:id` | Detalles de obra |
| POST | `/marketplace/art/purchase` | Comprar obra |
