---
description: Módulo de Estadísticas para la API
---

# Conectar Dashboard con Backend

Este workflow conecta el dashboard ESG con los endpoints reales de estadísticas.

## Contexto

- **Frontend**: Next.js en `rafiqui-front`
- **Backend**: NestJS en `rafiqui-back` (puerto 4000)
- **Endpoints**:
  - `GET /statistics/dashboard` - Todas las estadísticas
  - `GET /statistics/esg` - Métricas ESG
  - `GET /statistics/monthly` - Datos mensuales

## Pasos

### 1. Agregar funciones de API para estadísticas

Actualizar `src/lib/api.ts` agregando:

```typescript
// ... código existente ...

// Statistics API Types
export interface ESGMetrics {
  co2Saved: number;
  treesEquivalent: number;
  energySaved: number;
  waterSaved: number;
  panelsRecycled: number;
  panelsReused: number;
  panelsRecycledMaterial: number;
}

export interface MonthlyData {
  month: string;
  co2: number;
  panels: number;
  energy: number;
}

export interface MaterialDistribution {
  name: string;
  value: number;
  color: string;
}

export interface DashboardStats {
  esgMetrics: ESGMetrics;
  monthlyData: MonthlyData[];
  materialDistribution: MaterialDistribution[];
}

export interface CollectionStats {
  total: number;
  pending: number;
  completed: number;
  inProgress: number;
}

// Statistics API
export const statisticsApi = {
  getDashboard: () =>
    apiRequest<DashboardStats>('/statistics/dashboard'),

  getESGMetrics: () =>
    apiRequest<ESGMetrics>('/statistics/esg'),

  getMonthlyData: () =>
    apiRequest<MonthlyData[]>('/statistics/monthly'),

  getMaterialDistribution: () =>
    apiRequest<MaterialDistribution[]>('/statistics/materials'),

  getCollectionStats: () =>
    apiRequest<CollectionStats>('/statistics/collections'),
};
```

### 2. Crear hook para dashboard

Crear `src/hooks/useDashboardData.ts`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { statisticsApi, DashboardStats, ESGMetrics, MonthlyData, MaterialDistribution } from '@/lib/api';
import { esgMetrics as mockESG, monthlyData as mockMonthly, impactDistribution as mockDistribution } from '@/data/dashboardData';

interface UseDashboardDataReturn {
  esgMetrics: ESGMetrics;
  monthlyData: MonthlyData[];
  materialDistribution: MaterialDistribution[];
  isLoading: boolean;
  error: string | null;
  isUsingMockData: boolean;
  refetch: () => Promise<void>;
}

// Transformar datos mock al formato de la API
const transformMockESG = (): ESGMetrics => ({
  co2Saved: mockESG.co2Saved,
  treesEquivalent: mockESG.treesEquivalent,
  energySaved: mockESG.energySaved,
  waterSaved: mockESG.waterSaved,
  panelsRecycled: mockESG.panelsRecycled,
  panelsReused: Math.round(mockESG.panelsRecycled * 0.6),
  panelsRecycledMaterial: Math.round(mockESG.panelsRecycled * 0.4),
});

export function useDashboardData(): UseDashboardDataReturn {
  const [esgMetrics, setEsgMetrics] = useState<ESGMetrics>(transformMockESG());
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>(mockMonthly);
  const [materialDistribution, setMaterialDistribution] = useState<MaterialDistribution[]>(mockDistribution);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingMockData, setIsUsingMockData] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await statisticsApi.getDashboard();

      if (response.data) {
        setEsgMetrics(response.data.esgMetrics);
        setMonthlyData(response.data.monthlyData);
        setMaterialDistribution(response.data.materialDistribution);
        setIsUsingMockData(false);
      } else if (response.error) {
        console.warn('Using mock data due to API error:', response.error);
        setError(response.error);
        setIsUsingMockData(true);
        // Mantener datos mock
        setEsgMetrics(transformMockESG());
        setMonthlyData(mockMonthly);
        setMaterialDistribution(mockDistribution);
      }
    } catch (err) {
      console.warn('Using mock data due to fetch error');
      setError('Error al conectar con el servidor');
      setIsUsingMockData(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    esgMetrics,
    monthlyData,
    materialDistribution,
    isLoading,
    error,
    isUsingMockData,
    refetch: fetchData,
  };
}
```

### 3. Actualizar componente de métricas

Modificar `src/components/dashboard/MetricsCards.tsx`:

```typescript
'use client';

import { motion } from 'framer-motion';
import { Leaf, TreePine, Zap, Droplets, SunMedium, Recycle, CheckCircle } from 'lucide-react';
import type { ESGMetrics } from '@/lib/api';

interface MetricsCardsProps {
  metrics: ESGMetrics;
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
  const metricItems = [
    {
      label: 'CO₂ Ahorrado',
      value: metrics.co2Saved,
      unit: 'kg',
      icon: <Leaf size={24} />,
      color: 'primary',
      description: `Equivalente a ${Math.round(metrics.co2Saved / 250)} vuelos CDMX-NYC`,
    },
    {
      label: 'Árboles Equivalentes',
      value: metrics.treesEquivalent,
      unit: '',
      icon: <TreePine size={24} />,
      color: 'green',
      description: 'Plantados durante 10 años',
    },
    {
      label: 'Energía Recuperada',
      value: metrics.energySaved,
      unit: 'kWh',
      icon: <Zap size={24} />,
      color: 'amber',
      description: `Alimenta ${Math.round(metrics.energySaved / 2500)} hogares por 1 año`,
    },
    {
      label: 'Agua Ahorrada',
      value: metrics.waterSaved,
      unit: 'L',
      icon: <Droplets size={24} />,
      color: 'cyan',
      description: 'En procesos de manufactura',
    },
    {
      label: 'Paneles Procesados',
      value: metrics.panelsRecycled,
      unit: '',
      icon: <SunMedium size={24} />,
      color: 'accent',
      description: `${metrics.panelsReused} reusados, ${metrics.panelsRecycledMaterial} reciclados`,
    },
  ];

  const colorClasses = {
    primary: 'bg-primary-500/10 text-primary-400 border-primary-500/30',
    green: 'bg-green-500/10 text-green-400 border-green-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    accent: 'bg-accent-500/10 text-accent-400 border-accent-500/30',
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {metricItems.map((metric, index) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className={`card border ${colorClasses[metric.color as keyof typeof colorClasses]}`}
        >
          <div className={`inline-flex p-2 rounded-lg mb-3 ${colorClasses[metric.color as keyof typeof colorClasses]}`}>
            {metric.icon}
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            {metric.value.toLocaleString()}
            {metric.unit && <span className="text-sm text-dark-400 ml-1">{metric.unit}</span>}
          </p>
          <p className="text-sm text-dark-400 mb-2">{metric.label}</p>
          <p className="text-xs text-dark-500">{metric.description}</p>
        </motion.div>
      ))}
    </div>
  );
}
```

### 4. Actualizar componentes de gráficas

Modificar `src/components/dashboard/ESGCharts.tsx`:

```typescript
'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import type { MonthlyData, MaterialDistribution } from '@/lib/api';

interface ChartProps {
  data: MonthlyData[];
}

interface PieChartProps {
  data: MaterialDistribution[];
}

export function CO2Chart({ data }: ChartProps) {
  return (
    <div className="card h-80">
      <h3 className="text-lg font-semibold text-white mb-4">CO₂ Ahorrado (kg/mes)</h3>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
          <YAxis stroke="#64748B" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#F8FAFC' }}
          />
          <Area
            type="monotone"
            dataKey="co2"
            stroke="#10B981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorCo2)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MaterialsDistributionChart({ data }: PieChartProps) {
  return (
    <div className="card h-80">
      <h3 className="text-lg font-semibold text-white mb-4">Distribución de Materiales</h3>
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '8px',
            }}
            formatter={(value: number) => [`${value}%`, 'Porcentaje']}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span style={{ color: '#94A3B8' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PanelsRecycledChart({ data }: ChartProps) {
  return (
    <div className="card h-80">
      <h3 className="text-lg font-semibold text-white mb-4">Paneles Reciclados por Mes</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
          <YAxis stroke="#64748B" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#F8FAFC' }}
          />
          <Bar dataKey="panels" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function EnergyChart({ data }: ChartProps) {
  return (
    <div className="card h-80">
      <h3 className="text-lg font-semibold text-white mb-4">Energía Recuperada (kWh)</h3>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
          <YAxis stroke="#64748B" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#F8FAFC' }}
          />
          <Area
            type="monotone"
            dataKey="energy"
            stroke="#8B5CF6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorEnergy)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### 5. Actualizar página de dashboard

Modificar `src/app/dashboard/page.tsx`:

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { useDashboardData } from '@/hooks/useDashboardData';
import { MetricsCards } from '@/components/dashboard/MetricsCards';
import {
  CO2Chart,
  MaterialsDistributionChart,
  PanelsRecycledChart,
  EnergyChart,
} from '@/components/dashboard/ESGCharts';
import { AIStories } from '@/components/dashboard/AIStories';
import {
  LayoutDashboard,
  Download,
  Calendar,
  TrendingUp,
  Award,
  FileText,
  Loader2,
  RefreshCw,
  AlertCircle,
  Database,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { userRole, user, isAuthenticated } = useAuthStore();
  const { 
    esgMetrics, 
    monthlyData, 
    materialDistribution, 
    isLoading, 
    error, 
    isUsingMockData,
    refetch 
  } = useDashboardData();

  // Redirect if not authenticated
  useEffect(() => {
    if (userRole === 'GUEST') {
      router.push('/');
    }
  }, [userRole, router]);

  if (userRole === 'GUEST') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-dark-400">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary-500/10 rounded-lg">
                <LayoutDashboard className="text-primary-400" size={24} />
              </div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-white">
                Dashboard de Impacto
              </h1>
            </div>
            <p className="text-dark-400">
              Bienvenido, <span className="text-white">{user?.name}</span> • 
              <span className="text-primary-400 ml-1 capitalize">{userRole.toLowerCase()}</span>
            </p>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={refetch}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-dark-700 text-dark-300 hover:text-white rounded-xl transition-colors"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-dark-700 text-dark-300 hover:text-white rounded-xl transition-colors">
              <Calendar size={18} />
              <span className="hidden sm:inline">Este Año</span>
            </button>
            <button className="flex items-center gap-2 btn-primary">
              <Download size={18} />
              <span className="hidden sm:inline">Exportar Reporte</span>
            </button>
          </div>
        </motion.div>

        {/* Data Source Indicator */}
        {isUsingMockData && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3"
          >
            <Database className="text-amber-400" size={20} />
            <div>
              <p className="text-amber-400 font-medium">Mostrando datos de demostración</p>
              <p className="text-dark-400 text-sm">
                {error || 'Conecta el backend para ver datos reales'}
              </p>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-primary-400" size={32} />
            <span className="ml-3 text-dark-400">Cargando estadísticas...</span>
          </div>
        )}

        {/* Metrics Cards */}
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <MetricsCards metrics={esgMetrics} />
          </motion.div>
        )}

        {/* Charts Grid */}
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-2 gap-6 mb-8"
          >
            <CO2Chart data={monthlyData} />
            <MaterialsDistributionChart data={materialDistribution} />
            <PanelsRecycledChart data={monthlyData} />
            <EnergyChart data={monthlyData} />
          </motion.div>
        )}

        {/* AI Stories */}
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <AIStories />
          </motion.div>
        )}

        {/* Partner Benefits (only for PARTNER) */}
        {userRole === 'PARTNER' && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="card bg-gradient-to-br from-dark-800 to-dark-900 border-accent-500/30">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-accent-500/10 rounded-lg">
                  <Award className="text-accent-400" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Beneficios de Socio</h3>
                  <p className="text-dark-400 text-sm">Acceso exclusivo para partners</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-4 bg-dark-700/50 rounded-xl">
                  <FileText className="text-accent-400 mb-3" size={24} />
                  <h4 className="font-medium text-white mb-1">Certificación ESG</h4>
                  <p className="text-dark-400 text-sm">
                    Reportes verificados para tus informes de sostenibilidad corporativa.
                  </p>
                </div>
                <div className="p-4 bg-dark-700/50 rounded-xl">
                  <TrendingUp className="text-accent-400 mb-3" size={24} />
                  <h4 className="font-medium text-white mb-1">Trazabilidad Completa</h4>
                  <p className="text-dark-400 text-sm">
                    Seguimiento blockchain de cada panel desde la recolección.
                  </p>
                </div>
                <div className="p-4 bg-dark-700/50 rounded-xl">
                  <Award className="text-accent-400 mb-3" size={24} />
                  <h4 className="font-medium text-white mb-1">Impacto Medible</h4>
                  <p className="text-dark-400 text-sm">
                    Métricas en tiempo real de tu contribución ambiental.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-dark-600 flex flex-col sm:flex-row gap-4">
                <button className="btn-accent flex items-center justify-center gap-2">
                  <Download size={18} />
                  Descargar Certificado ESG
                </button>
                <button className="btn-outline flex items-center justify-center gap-2">
                  <FileText size={18} />
                  Ver Reporte Completo
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
```

// turbo
### 6. Verificar conexión

```bash
# Terminal 1: Backend
cd rafiqui-back && npm run start:dev

# Terminal 2: Frontend
cd rafiqui-front && npm run dev
```

## Verificación Final

- [ ] `api.ts` actualizado con funciones de estadísticas
- [ ] `useDashboardData.ts` hook creado
- [ ] `MetricsCards.tsx` actualizado para recibir props
- [ ] `ESGCharts.tsx` actualizado para recibir datos como props
- [ ] `page.tsx` de dashboard actualizado
- [ ] Dashboard muestra datos del backend cuando está disponible
- [ ] Fallback a datos mock si el backend falla
- [ ] Indicador visual cuando se usan datos mock
- [ ] Botón de actualizar funciona
- [ ] Gráficas se renderizan con datos reales

## Resumen de Endpoints Utilizados

| Endpoint | Uso |
|----------|-----|
| `GET /statistics/dashboard` | Todas las estadísticas del dashboard |
| `GET /statistics/esg` | Métricas ESG individuales |
| `GET /statistics/monthly` | Datos para gráficas mensuales |
| `GET /statistics/materials` | Distribución de materiales |

## Flujo de Datos

```
Backend (NestJS)                    Frontend (Next.js)
─────────────────                   ──────────────────
PostgreSQL                          
    ↓                               
PrismaService                       
    ↓                               
StatisticsService                   
    ↓                               
StatisticsController ──────────────→ useDashboardData hook
    │                                       ↓
    │                               MetricsCards component
    │                               ESGCharts components
    │                               Dashboard page
```
