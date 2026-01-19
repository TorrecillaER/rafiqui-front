---
description: Crear dashboard privado con gráficas ESG e historias de IA
---

# Crear Página de Dashboard

Este workflow implementa el dashboard privado con métricas de impacto ESG y historias generadas por IA.

## Contexto

La página `/dashboard` es privada:
- Solo accesible para **DONOR** o **PARTNER**
- Si es **GUEST**, redirige a login
- Muestra gráficas de impacto ambiental (Recharts)
- Sección de "Historias Generadas por IA"

## Pasos

### 1. Crear datos mock para dashboard

Crear `src/data/dashboardData.ts`:

```typescript
import type { ESGMetrics, AIStory } from '@/types';

export const esgMetrics: ESGMetrics = {
  co2Saved: 45200, // kg
  treesEquivalent: 2260,
  energySaved: 125000, // kWh
  waterSaved: 890000, // Litros
  panelsRecycled: 2547,
};

export const monthlyData = [
  { month: 'Ene', co2: 3200, panels: 180, energy: 8500 },
  { month: 'Feb', co2: 2800, panels: 156, energy: 7200 },
  { month: 'Mar', co2: 4100, panels: 230, energy: 11000 },
  { month: 'Abr', co2: 3600, panels: 201, energy: 9800 },
  { month: 'May', co2: 4500, panels: 252, energy: 12200 },
  { month: 'Jun', co2: 5200, panels: 291, energy: 14100 },
  { month: 'Jul', co2: 4800, panels: 268, energy: 13000 },
  { month: 'Ago', co2: 5100, panels: 285, energy: 13800 },
  { month: 'Sep', co2: 4200, panels: 235, energy: 11400 },
  { month: 'Oct', co2: 3900, panels: 218, energy: 10600 },
  { month: 'Nov', co2: 4400, panels: 246, energy: 11900 },
  { month: 'Dic', co2: 3400, panels: 190, energy: 9200 },
];

export const impactDistribution = [
  { name: 'Aluminio', value: 35, color: '#94A3B8' },
  { name: 'Vidrio', value: 40, color: '#22D3EE' },
  { name: 'Silicio', value: 15, color: '#A78BFA' },
  { name: 'Cobre', value: 10, color: '#F97316' },
];

export const aiStories: AIStory[] = [
  {
    id: 'story-001',
    title: 'El Viaje de 500 Paneles',
    content: `En una pequeña comunidad de Monterrey, 500 paneles solares que alguna vez iluminaron hogares encontraron un nuevo propósito. El aluminio recuperado se transformó en marcos de bicicletas para un programa de movilidad sustentable, mientras que el vidrio purificado ahora forma parte de una instalación artística en el Museo de Arte Contemporáneo.

Cada panel contaba una historia: 15 años de servicio, miles de horas de energía limpia, y ahora, una segunda vida que continúa el legado de sostenibilidad.`,
    generatedAt: new Date('2024-01-15'),
    panelOrigin: 'Monterrey, NL',
  },
  {
    id: 'story-002',
    title: 'De Techo Industrial a Obra de Arte',
    content: `Una fábrica en Querétaro decidió renovar su sistema solar después de 20 años. Los 1,200 paneles retirados parecían destinados al olvido, pero la artista Elena Vázquez vio en ellos una oportunidad única.

Hoy, "Reflejo Solar" - una escultura de 8 metros creada con células fotovoltaicas - se exhibe en el Parque Bicentenario, recordando a los visitantes que la sostenibilidad también puede ser hermosa.`,
    generatedAt: new Date('2024-02-20'),
    panelOrigin: 'Querétaro, QRO',
  },
  {
    id: 'story-003',
    title: 'Energía que Trasciende',
    content: `Los paneles de la escuela rural "Benito Juárez" en Oaxaca funcionaron durante 12 años, educando a más de 3,000 estudiantes. Cuando llegó el momento de reemplazarlos, la comunidad quiso que su legado continuara.

El silicio recuperado ahora alimenta nuevos paneles en otra escuela rural, mientras que los materiales restantes financiaron becas para estudiantes de ingeniería ambiental. Un ciclo de educación y sostenibilidad que no termina.`,
    generatedAt: new Date('2024-03-10'),
    panelOrigin: 'Oaxaca, OAX',
  },
];

export const partnerBenefits = [
  {
    title: 'Certificación ESG',
    description: 'Reportes verificados para tus informes de sostenibilidad corporativa.',
    icon: 'certificate',
  },
  {
    title: 'Trazabilidad Completa',
    description: 'Seguimiento blockchain de cada panel desde la recolección hasta el reciclaje.',
    icon: 'link',
  },
  {
    title: 'Impacto Medible',
    description: 'Métricas en tiempo real de tu contribución ambiental.',
    icon: 'chart',
  },
];
```

### 2. Crear componentes de gráficas

Crear `src/components/dashboard/ESGCharts.tsx`:

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
import { monthlyData, impactDistribution } from '@/data/dashboardData';

export function CO2Chart() {
  return (
    <div className="card h-80">
      <h3 className="text-lg font-semibold text-white mb-4">CO₂ Ahorrado (kg/mes)</h3>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={monthlyData}>
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

export function MaterialsDistributionChart() {
  return (
    <div className="card h-80">
      <h3 className="text-lg font-semibold text-white mb-4">Distribución de Materiales</h3>
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie
            data={impactDistribution}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={5}
            dataKey="value"
          >
            {impactDistribution.map((entry, index) => (
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

export function PanelsRecycledChart() {
  return (
    <div className="card h-80">
      <h3 className="text-lg font-semibold text-white mb-4">Paneles Reciclados por Mes</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={monthlyData}>
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

export function EnergyChart() {
  return (
    <div className="card h-80">
      <h3 className="text-lg font-semibold text-white mb-4">Energía Recuperada (kWh)</h3>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={monthlyData}>
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

### 3. Crear componente de historias de IA

Crear `src/components/dashboard/AIStories.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiStories } from '@/data/dashboardData';
import { Sparkles, MapPin, Calendar, ChevronRight, BookOpen } from 'lucide-react';

export function AIStories() {
  const [selectedStory, setSelectedStory] = useState(aiStories[0]);

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-accent-500/10 rounded-lg">
          <Sparkles className="text-accent-400" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Historias Generadas por IA</h3>
          <p className="text-dark-400 text-sm">El viaje de tus paneles reciclados</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {aiStories.map((story) => (
          <button
            key={story.id}
            onClick={() => setSelectedStory(story)}
            className={`p-4 rounded-xl text-left transition-all ${
              selectedStory.id === story.id
                ? 'bg-accent-500/20 border border-accent-500/50'
                : 'bg-dark-700 border border-dark-600 hover:border-dark-500'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={14} className="text-accent-400" />
              <span className="text-xs text-dark-400">Historia</span>
            </div>
            <h4 className={`font-medium line-clamp-1 ${
              selectedStory.id === story.id ? 'text-accent-400' : 'text-white'
            }`}>
              {story.title}
            </h4>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedStory.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-6 bg-dark-700 rounded-xl"
        >
          <h4 className="text-xl font-semibold text-white mb-4">{selectedStory.title}</h4>
          
          <div className="flex flex-wrap gap-4 mb-4 text-sm">
            <span className="flex items-center gap-2 text-dark-400">
              <MapPin size={14} />
              {selectedStory.panelOrigin}
            </span>
            <span className="flex items-center gap-2 text-dark-400">
              <Calendar size={14} />
              {selectedStory.generatedAt.toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>

          <p className="text-dark-300 leading-relaxed whitespace-pre-line">
            {selectedStory.content}
          </p>

          <div className="mt-6 pt-4 border-t border-dark-600">
            <button className="flex items-center gap-2 text-accent-400 hover:text-accent-300 transition-colors text-sm font-medium">
              Generar nueva historia
              <ChevronRight size={16} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
```

### 4. Crear componente de métricas

Crear `src/components/dashboard/MetricsCards.tsx`:

```typescript
'use client';

import { motion } from 'framer-motion';
import { esgMetrics } from '@/data/dashboardData';
import { Leaf, TreePine, Zap, Droplets, SunMedium } from 'lucide-react';

const metrics = [
  {
    label: 'CO₂ Ahorrado',
    value: esgMetrics.co2Saved,
    unit: 'kg',
    icon: <Leaf size={24} />,
    color: 'primary',
    description: 'Equivalente a 180 vuelos CDMX-NYC',
  },
  {
    label: 'Árboles Equivalentes',
    value: esgMetrics.treesEquivalent,
    unit: '',
    icon: <TreePine size={24} />,
    color: 'green',
    description: 'Plantados durante 10 años',
  },
  {
    label: 'Energía Recuperada',
    value: esgMetrics.energySaved,
    unit: 'kWh',
    icon: <Zap size={24} />,
    color: 'amber',
    description: 'Alimenta 50 hogares por 1 año',
  },
  {
    label: 'Agua Ahorrada',
    value: esgMetrics.waterSaved,
    unit: 'L',
    icon: <Droplets size={24} />,
    color: 'cyan',
    description: 'En procesos de manufactura',
  },
  {
    label: 'Paneles Reciclados',
    value: esgMetrics.panelsRecycled,
    unit: '',
    icon: <SunMedium size={24} />,
    color: 'accent',
    description: 'Segunda vida garantizada',
  },
];

const colorClasses = {
  primary: 'bg-primary-500/10 text-primary-400 border-primary-500/30',
  green: 'bg-green-500/10 text-green-400 border-green-500/30',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  accent: 'bg-accent-500/10 text-accent-400 border-accent-500/30',
};

export function MetricsCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {metrics.map((metric, index) => (
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

### 5. Crear página de dashboard

Crear `src/app/dashboard/page.tsx`:

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
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
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { userRole, user, isAuthenticated } = useAuthStore();

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

        {/* Metrics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <MetricsCards />
        </motion.div>

        {/* Charts Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-2 gap-6 mb-8"
        >
          <CO2Chart />
          <MaterialsDistributionChart />
          <PanelsRecycledChart />
          <EnergyChart />
        </motion.div>

        {/* AI Stories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <AIStories />
        </motion.div>

        {/* Partner Benefits (only for PARTNER) */}
        {userRole === 'PARTNER' && (
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
### 6. Verificar compilación

```bash
npm run dev
```

## Verificación Final

- [ ] `dashboardData.ts` creado con métricas y historias
- [ ] `ESGCharts.tsx` creado con 4 gráficas (Recharts)
- [ ] `AIStories.tsx` creado con historias simuladas
- [ ] `MetricsCards.tsx` creado con tarjetas de métricas
- [ ] `page.tsx` en `/dashboard` creado
- [ ] GUEST es redirigido a home
- [ ] DONOR puede ver el dashboard
- [ ] PARTNER ve sección adicional de beneficios
- [ ] Gráficas se renderizan correctamente
- [ ] Historias de IA cambian al seleccionar
- [ ] Animaciones funcionan
- [ ] App compila sin errores

## Estructura Final del Proyecto

```
rafiqui-front/
├── src/
│   ├── app/
│   │   ├── donar/page.tsx
│   │   ├── market/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   │   └── RoleSwitcher.tsx
│   │   ├── layout/
│   │   │   └── Navbar.tsx
│   │   ├── forms/
│   │   │   └── CollectionRequestForm.tsx
│   │   ├── market/
│   │   │   ├── MaterialCard.tsx
│   │   │   └── ArtCard.tsx
│   │   └── dashboard/
│   │       ├── ESGCharts.tsx
│   │       ├── AIStories.tsx
│   │       └── MetricsCards.tsx
│   ├── store/
│   │   └── useAuthStore.ts
│   ├── data/
│   │   ├── marketData.ts
│   │   └── dashboardData.ts
│   ├── types/
│   │   └── index.ts
│   └── lib/
├── public/
├── tailwind.config.ts
└── package.json
```

## Resumen de Rutas

| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/` | Público | Landing page |
| `/donar` | Público | Formulario de recolección |
| `/market` | Híbrido | Marketplace (GUEST ve, no compra) |
| `/dashboard` | Privado | Dashboard ESG (DONOR/PARTNER) |
