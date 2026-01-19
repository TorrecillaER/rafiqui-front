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
import { useDashboardCharts } from '@/hooks/useDashboardCharts';
import { Loader2, AlertCircle } from 'lucide-react';

function ChartSkeleton() {
  return (
    <div className="card h-80 flex items-center justify-center">
      <Loader2 className="animate-spin text-primary-400" size={32} />
    </div>
  );
}

function ChartError({ title }: { title: string }) {
  return (
    <div className="card h-80 flex flex-col items-center justify-center">
      <AlertCircle className="text-red-400 mb-2" size={32} />
      <p className="text-red-400 text-sm">{title}</p>
      <p className="text-dark-400 text-xs mt-1">Error al cargar datos</p>
    </div>
  );
}

export function CO2Chart() {
  const { data, isLoading, error } = useDashboardCharts();

  if (isLoading) return <ChartSkeleton />;
  if (error || !data) return <ChartError title="CO₂ Ahorrado" />;
  return (
    <div className="card h-80">
      <h3 className="text-lg font-semibold text-white mb-4">CO₂ Ahorrado (kg/mes)</h3>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data.co2ByMonth}>
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
            dataKey="value"
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
  const { data, isLoading, error } = useDashboardCharts();

  if (isLoading) return <ChartSkeleton />;
  if (error || !data) return <ChartError title="Distribución de Materiales" />;

  return (
    <div className="card h-80">
      <h3 className="text-lg font-semibold text-white mb-4">Distribución de Materiales</h3>
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie
            data={data.materialDistribution as any[]}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={5}
            dataKey="value"
          >
            {data.materialDistribution.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '8px',
            }}
            formatter={(value: any) => [`${value}%`, 'Porcentaje']}
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
  const { data, isLoading, error } = useDashboardCharts();

  if (isLoading) return <ChartSkeleton />;
  if (error || !data) return <ChartError title="Paneles Reciclados" />;

  return (
    <div className="card h-80">
      <h3 className="text-lg font-semibold text-white mb-4">Paneles Reciclados por Mes</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data.panelsByMonth}>
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
          <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function EnergyChart() {
  const { data, isLoading, error } = useDashboardCharts();

  if (isLoading) return <ChartSkeleton />;
  if (error || !data) return <ChartError title="Energía Recuperada" />;

  return (
    <div className="card h-80">
      <h3 className="text-lg font-semibold text-white mb-4">Energía Recuperada (kWh)</h3>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data.energyByMonth}>
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
            dataKey="value"
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
