---
description: Conectar las gráficas del dashboard con el endpoint de datos reales
---

# Step 26: Dashboard Charts Frontend - Consumir API de Gráficas

Este workflow conecta las 4 gráficas del dashboard con el endpoint `/dashboard/charts` del backend para mostrar datos reales.

## Endpoint del Backend

```
GET http://localhost:4000/dashboard/charts
```

### Respuesta esperada:
```json
{
  "co2ByMonth": [
    { "month": "Feb", "value": 0 },
    { "month": "Mar", "value": 0 },
    ...
    { "month": "Ene", "value": 356 }
  ],
  "materialDistribution": [
    { "name": "Aluminio", "value": 35, "color": "#94A3B8" },
    { "name": "Vidrio", "value": 40, "color": "#22D3EE" },
    { "name": "Silicio", "value": 15, "color": "#A78BFA" },
    { "name": "Cobre", "value": 10, "color": "#F97316" }
  ],
  "panelsByMonth": [
    { "month": "Feb", "value": 0 },
    ...
    { "month": "Ene", "value": 20 }
  ],
  "energyByMonth": [
    { "month": "Feb", "value": 0 },
    ...
    { "month": "Ene", "value": 984 }
  ]
}
```

---

## Paso 1: Agregar tipos TypeScript

En `src/lib/api.ts`, agregar las interfaces:

```typescript
// Dashboard Charts API
export interface ChartDataPoint {
  month: string;
  value: number;
}

export interface MaterialDistributionItem {
  name: string;
  value: number;
  color: string;
}

export interface DashboardCharts {
  co2ByMonth: ChartDataPoint[];
  materialDistribution: MaterialDistributionItem[];
  panelsByMonth: ChartDataPoint[];
  energyByMonth: ChartDataPoint[];
}
```

---

## Paso 2: Agregar función al dashboardApi

En `src/lib/api.ts`, modificar `dashboardApi`:

```typescript
export const dashboardApi = {
  getMetrics: () =>
    apiRequest<DashboardMetrics>('/dashboard/metrics'),
  
  getCharts: () =>
    apiRequest<DashboardCharts>('/dashboard/charts'),
};
```

---

## Paso 3: Crear hook para las gráficas

Crear archivo `src/hooks/useDashboardCharts.ts`:

```typescript
import { useState, useEffect } from 'react';
import { dashboardApi, DashboardCharts } from '@/lib/api';

export function useDashboardCharts() {
  const [data, setData] = useState<DashboardCharts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCharts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await dashboardApi.getCharts();
        
        if (response.data) {
          setData(response.data);
        } else {
          setError(response.error || 'Error al cargar las gráficas');
        }
      } catch (err) {
        console.error('Error fetching dashboard charts:', err);
        setError('Error al conectar con el servidor');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCharts();

    // Refrescar cada 5 minutos
    const interval = setInterval(fetchCharts, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return { data, isLoading, error };
}
```

---

## Paso 4: Actualizar el hook useDashboardData

Modificar `src/hooks/useDashboardData.ts` para usar el nuevo endpoint:

```typescript
import { useState, useEffect } from 'react';
import { dashboardApi, DashboardCharts, DashboardMetrics } from '@/lib/api';

interface UseDashboardDataReturn {
  charts: DashboardCharts | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboardData(): UseDashboardDataReturn {
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await dashboardApi.getCharts();

      if (response.data) {
        setCharts(response.data);
      } else {
        setError(response.error || 'Error al cargar datos');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Error al conectar con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { charts, isLoading, error, refetch: fetchData };
}
```

---

## Paso 5: Actualizar componentes de gráficas

### CO2Chart.tsx

```tsx
'use client';

import { useDashboardCharts } from '@/hooks/useDashboardCharts';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function CO2Chart() {
  const { data, isLoading, error } = useDashboardCharts();

  if (isLoading) return <ChartSkeleton />;
  if (error || !data) return <ChartError />;

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-white mb-4">CO₂ Ahorrado (kg/mes)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data.co2ByMonth}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="month" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
            labelStyle={{ color: '#fff' }}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#10B981" 
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### MaterialDistributionChart.tsx

```tsx
'use client';

import { useDashboardCharts } from '@/hooks/useDashboardCharts';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export function MaterialDistributionChart() {
  const { data, isLoading, error } = useDashboardCharts();

  if (isLoading) return <ChartSkeleton />;
  if (error || !data) return <ChartError />;

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-white mb-4">Distribución de Materiales</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data.materialDistribution}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.materialDistribution.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
            formatter={(value: number) => [`${value}%`, '']}
          />
          <Legend 
            formatter={(value) => <span style={{ color: '#9CA3AF' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### PanelsChart.tsx

```tsx
'use client';

import { useDashboardCharts } from '@/hooks/useDashboardCharts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function PanelsChart() {
  const { data, isLoading, error } = useDashboardCharts();

  if (isLoading) return <ChartSkeleton />;
  if (error || !data) return <ChartError />;

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-white mb-4">Paneles Reciclados por Mes</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data.panelsByMonth}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="month" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
            labelStyle={{ color: '#fff' }}
          />
          <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### EnergyChart.tsx

```tsx
'use client';

import { useDashboardCharts } from '@/hooks/useDashboardCharts';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function EnergyChart() {
  const { data, isLoading, error } = useDashboardCharts();

  if (isLoading) return <ChartSkeleton />;
  if (error || !data) return <ChartError />;

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-white mb-4">Energía Recuperada (kWh)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data.energyByMonth}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="month" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
            labelStyle={{ color: '#fff' }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#A855F7" 
            fill="url(#energyGradient)"
          />
          <defs>
            <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#A855F7" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
            </linearGradient>
          </defs>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

## Paso 6: Componentes auxiliares

### ChartSkeleton

```tsx
function ChartSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="h-6 w-40 bg-dark-700 rounded mb-4" />
      <div className="h-[250px] bg-dark-700 rounded" />
    </div>
  );
}
```

### ChartError

```tsx
function ChartError() {
  return (
    <div className="card border border-red-500/30 bg-red-500/10">
      <p className="text-red-400 text-center py-8">Error al cargar la gráfica</p>
    </div>
  );
}
```

---

## Mapeo de Gráficas con Datos

| Gráfica | Campo API | Tipo de Gráfica |
|---------|-----------|-----------------|
| CO₂ Ahorrado | `co2ByMonth` | LineChart (Recharts) |
| Distribución Materiales | `materialDistribution` | PieChart donut (Recharts) |
| Paneles por Mes | `panelsByMonth` | BarChart (Recharts) |
| Energía Recuperada | `energyByMonth` | AreaChart (Recharts) |

---

## Notas

- Todas las gráficas usan Recharts (ya instalado en el proyecto)
- Los datos se refrescan automáticamente cada 5 minutos
- Se muestran skeletons durante la carga
- Los colores de materiales vienen del backend para consistencia
