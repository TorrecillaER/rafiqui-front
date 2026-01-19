---
description: Implementar compra de materiales con transferencia de tokens ERC-1155 y destino del material
---

# Step 18: Compra de Materiales con Destino

## Descripción
Este workflow implementa la compra de materiales reciclados con:
1. Conexión de wallet MetaMask
2. Selección de destino del material
3. Transferencia de tokens ERC-1155 a la wallet del comprador

## Archivos a Modificar

### 1. Backend - DTO de Orden (`rafiqui-back/src/marketplace/dto/material-order.dto.ts`)
Agregar campo `destination` al DTO:
```typescript
export enum MaterialDestination {
  MANUFACTURING = 'MANUFACTURING',      // Manufactura industrial
  CONSTRUCTION = 'CONSTRUCTION',        // Construcción
  RESEARCH = 'RESEARCH',                // Investigación
  RECYCLING_CENTER = 'RECYCLING_CENTER', // Centro de reciclaje
  OTHER = 'OTHER',                      // Otro
}

export class CreateMaterialOrderDto {
  buyerId: string;
  materialType: string;
  quantityKg: number;
  buyerWallet: string;
  destination: MaterialDestination;     // NUEVO
  destinationNotes?: string;            // NUEVO - Notas opcionales
}
```

### 2. Frontend - API Types (`rafiqui-front/src/lib/api.ts`)
Actualizar interface:
```typescript
export enum MaterialDestination {
  MANUFACTURING = 'MANUFACTURING',
  CONSTRUCTION = 'CONSTRUCTION',
  RESEARCH = 'RESEARCH',
  RECYCLING_CENTER = 'RECYCLING_CENTER',
  OTHER = 'OTHER',
}

export interface CreateMaterialOrder {
  buyerId: string;
  materialType: string;
  quantityKg: number;
  buyerWallet: string;
  destination: MaterialDestination;
  destinationNotes?: string;
}
```

### 3. Frontend - Modal de Compra (`rafiqui-front/src/components/market/MaterialPurchaseModal.tsx`)
Agregar selector de destino:
- Dropdown con opciones de destino
- Campo de texto opcional para notas
- Validación antes de enviar

## Flujo de Compra

1. Usuario hace clic en "Comprar" en una card de material
2. Se abre el modal de compra
3. Usuario selecciona cantidad (kg)
4. Usuario selecciona destino del material
5. Si no hay wallet conectada, se muestra botón "Conectar Wallet"
6. Usuario conecta MetaMask
7. Usuario confirma la compra
8. Backend:
   - Valida stock disponible
   - Crea orden en BD
   - Transfiere tokens ERC-1155 a la wallet del comprador
   - Actualiza stock
9. Frontend muestra confirmación con hash de transacción

## Destinos Disponibles
| Código | Etiqueta | Descripción |
|--------|----------|-------------|
| MANUFACTURING | Manufactura Industrial | Uso en procesos de fabricación |
| CONSTRUCTION | Construcción | Proyectos de construcción |
| RESEARCH | Investigación | Laboratorios y centros de I+D |
| RECYCLING_CENTER | Centro de Reciclaje | Procesamiento adicional |
| OTHER | Otro | Especificar en notas |

## Verificación
1. Conectar wallet MetaMask en red Polygon Amoy
2. Seleccionar material y cantidad
3. Seleccionar destino
4. Confirmar compra
5. Verificar tokens en wallet usando PolygonScan Amoy
