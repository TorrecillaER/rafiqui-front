---
description: Conectar las métricas ESG del dashboard con el endpoint del backend
---

# Step 24: Dashboard Metrics Frontend - Consumir API de Métricas ESG

Este workflow conecta las cards del dashboard con el endpoint `/dashboard/metrics` del backend para mostrar datos reales.

## Endpoint del Backend

```
GET http://localhost:4000/dashboard/metrics
```

### Respuesta esperada:
```json
{
  "co2Saved": {
    "value": 15.7,
    "unit": "ton",
    "breakdown": {
      "fromEnergy": 15475,
      "fromRecycling": 242
    }
  },
  "treesEquivalent": {
    "value": 786,
    "description": "Plantados durante 10 años"
  },
  "energyRecovered": {
    "value": 36.6,
    "unit": "MWh",
    "homesPerYear": 12
  },
  "waterSaved": {
    "value": 26,
    "unit": "m³",
    "breakdown": {
      "fromEnergy": 25609,
      "fromRecycling": 420
    }
  },
  "panelsProcessed": {
    "total": 18,
    "reused": 5,
    "recycled": 3,
    "art": 10
  }
}
```

---

## Paso 1: Crear el tipo TypeScript para las métricas

Crear archivo `src/types/dashboard.ts`:

```typescript
export interface DashboardMetrics {
  co2Saved: {
    value: number;
    unit: string;
    breakdown: {
      fromEnergy: number;
      fromRecycling: number;
    };
  };
  treesEquivalent: {
    value: number;
    description: string;
  };
  energyRecovered: {
    value: number;
    unit: string;
    homesPerYear: number;
  };
  waterSaved: {
    value: number;
    unit: string;
    breakdown: {
      fromEnergy: number;
      fromRecycling: number;
    };
  };
  panelsProcessed: {
    total: number;
    reused: number;
    recycled: number;
    art: number;
  };
}
```

---

## Paso 2: Crear el servicio/hook para obtener las métricas

Crear archivo `src/services/dashboardService.ts` o `src/hooks/useDashboardMetrics.ts`:

### Opción A: Servicio con Axios
```typescript
import axios from 'axios';
import { DashboardMetrics } from '../types/dashboard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const dashboardService = {
  async getMetrics(): Promise<DashboardMetrics> {
    const response = await axios.get<DashboardMetrics>(`${API_URL}/dashboard/metrics`);
    return response.data;
  },
};
```

### Opción B: Hook con React Query (recomendado)
```typescript
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { DashboardMetrics } from '../types/dashboard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const fetchMetrics = async (): Promise<DashboardMetrics> => {
  const { data } = await axios.get<DashboardMetrics>(`${API_URL}/dashboard/metrics`);
  return data;
};

export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: fetchMetrics,
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchInterval: 1000 * 60 * 5, // Refrescar cada 5 minutos
  });
};
```

---

## Paso 3: Actualizar el componente de las Cards

Localizar el componente que renderiza las 5 cards del dashboard (probablemente en `src/components/Dashboard/MetricsCards.tsx` o similar).

### Estructura sugerida:

```tsx
'use client';

import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { Leaf, TreePine, Zap, Droplets, Sun } from 'lucide-react';

export function MetricsCards() {
  const { data: metrics, isLoading, error } = useDashboardMetrics();

  if (isLoading) {
    return <MetricsCardsSkeleton />;
  }

  if (error || !metrics) {
    return <MetricsCardsError />;
  }

  const cards = [
    {
      icon: Leaf,
      value: metrics.co2Saved.value,
      unit: metrics.co2Saved.unit,
      label: 'CO₂ Ahorrado',
      sublabel: `Equivalente a ${Math.round(metrics.co2Saved.value * 4)} vuelos CDMX-NYC`,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      icon: TreePine,
      value: metrics.treesEquivalent.value,
      unit: '',
      label: 'Árboles Equivalentes',
      sublabel: metrics.treesEquivalent.description,
      color: 'from-green-500 to-emerald-600',
    },
    {
      icon: Zap,
      value: metrics.energyRecovered.value,
      unit: metrics.energyRecovered.unit,
      label: 'Energía Recuperada',
      sublabel: `Alimenta ${metrics.energyRecovered.homesPerYear} hogares por 1 año`,
      color: 'from-yellow-500 to-orange-500',
    },
    {
      icon: Droplets,
      value: metrics.waterSaved.value,
      unit: metrics.waterSaved.unit,
      label: 'Agua Ahorrada',
      sublabel: 'En procesos de manufactura',
      color: 'from-cyan-500 to-blue-600',
    },
    {
      icon: Sun,
      value: metrics.panelsProcessed.total,
      unit: '',
      label: 'Paneles Procesados',
      sublabel: `${metrics.panelsProcessed.reused} reusados, ${metrics.panelsProcessed.recycled} reciclados`,
      color: 'from-purple-500 to-pink-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card, index) => (
        <MetricCard key={index} {...card} />
      ))}
    </div>
  );
}

function MetricCard({ icon: Icon, value, unit, label, sublabel, color }) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-2xl p-6 text-white`}>
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-6 h-6 opacity-80" />
      </div>
      <div className="text-3xl font-bold">
        {value.toLocaleString()}
        <span className="text-lg ml-1 opacity-80">{unit}</span>
      </div>
      <div className="text-sm font-medium mt-1">{label}</div>
      <div className="text-xs opacity-70 mt-1">{sublabel}</div>
    </div>
  );
}
```

---

## Paso 4: Agregar estados de carga y error

### Skeleton para carga:
```tsx
function MetricsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-gray-700 rounded-2xl p-6 animate-pulse">
          <div className="h-6 w-6 bg-gray-600 rounded mb-4" />
          <div className="h-8 w-20 bg-gray-600 rounded mb-2" />
          <div className="h-4 w-24 bg-gray-600 rounded mb-1" />
          <div className="h-3 w-32 bg-gray-600 rounded" />
        </div>
      ))}
    </div>
  );
}
```

### Estado de error:
```tsx
function MetricsCardsError() {
  return (
    <div className="bg-red-900/20 border border-red-500 rounded-2xl p-6 text-center">
      <p className="text-red-400">Error al cargar las métricas</p>
      <button 
        onClick={() => window.location.reload()}
        className="mt-2 text-sm underline"
      >
        Reintentar
      </button>
    </div>
  );
}
```

---

## Paso 5: Configurar variable de entorno

En `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## Mapeo de Cards con Datos

| Card UI | Campo API | Fórmula Backend |
|---------|-----------|-----------------|
| CO₂ Ahorrado | `co2Saved.value` + `co2Saved.unit` | (kWh × 0.423) + (kg_Al × 11.5) |
| Árboles Equivalentes | `treesEquivalent.value` | CO2_total / 20 |
| Energía Recuperada | `energyRecovered.value` + `unit` | Σ(W/1000 × 5.5 × 365 × 15) |
| Agua Ahorrada | `waterSaved.value` + `unit` | (kWh × 0.7) + (kg_Al × 20) |
| Paneles Procesados | `panelsProcessed.total` | Count de assets |

---

## Sublabels Dinámicos Sugeridos

| Card | Sublabel |
|------|----------|
| CO₂ | `Equivalente a ${value * 4} vuelos CDMX-NYC` (1 vuelo ≈ 0.25 ton CO2) |
| Árboles | `Plantados durante 10 años` |
| Energía | `Alimenta ${homesPerYear} hogares por 1 año` |
| Agua | `En procesos de manufactura` |
| Paneles | `${reused} reusados, ${recycled} reciclados` |
