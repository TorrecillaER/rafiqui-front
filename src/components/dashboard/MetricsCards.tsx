'use client';

import { motion } from 'framer-motion';
import { Leaf, TreePine, Zap, Droplets, SunMedium, Loader2, AlertCircle } from 'lucide-react';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';

export function MetricsCards() {
  const { data: metrics, isLoading, error } = useDashboardMetrics();

  if (isLoading) {
    return <MetricsCardsSkeleton />;
  }

  if (error) {
    return <MetricsCardsError error={error} />;
  }

  if (!metrics || !metrics.co2Saved || !metrics.treesEquivalent || !metrics.energyRecovered || !metrics.waterSaved || !metrics.panelsProcessed) {
    return <MetricsCardsError error="Datos incompletos del servidor" />;
  }

  const metricItems = [
    {
      label: 'CO₂ Ahorrado',
      value: metrics.co2Saved.value,
      unit: metrics.co2Saved.unit,
      icon: <Leaf size={24} />,
      color: 'primary',
      description: `Equivalente a ${Math.round(metrics.co2Saved.value * 4)} vuelos CDMX-NYC`,
    },
    {
      label: 'Árboles Equivalentes',
      value: metrics.treesEquivalent.value,
      unit: '',
      icon: <TreePine size={24} />,
      color: 'green',
      description: metrics.treesEquivalent.description,
    },
    {
      label: 'Energía Recuperada',
      value: metrics.energyRecovered.value,
      unit: metrics.energyRecovered.unit,
      icon: <Zap size={24} />,
      color: 'amber',
      description: `Alimenta ${metrics.energyRecovered.homesPerYear} hogares por 1 año`,
    },
    {
      label: 'Agua Ahorrada',
      value: metrics.waterSaved.value,
      unit: metrics.waterSaved.unit,
      icon: <Droplets size={24} />,
      color: 'cyan',
      description: 'En procesos de manufactura',
    },
    {
      label: 'Paneles Procesados',
      value: metrics.panelsProcessed.total,
      unit: '',
      icon: <SunMedium size={24} />,
      color: 'accent',
      description: `${metrics.panelsProcessed.reused} reusados, ${metrics.panelsProcessed.recycled} reciclados`,
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

function MetricsCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="card border border-dark-700 animate-pulse">
          <div className="h-10 w-10 bg-dark-700 rounded-lg mb-3" />
          <div className="h-8 w-20 bg-dark-700 rounded mb-2" />
          <div className="h-4 w-24 bg-dark-700 rounded mb-2" />
          <div className="h-3 w-32 bg-dark-700 rounded" />
        </div>
      ))}
    </div>
  );
}

function MetricsCardsError({ error }: { error: string | null }) {
  return (
    <div className="card border border-red-500/30 bg-red-500/10">
      <div className="flex items-center gap-3 mb-4">
        <AlertCircle className="text-red-400" size={24} />
        <div>
          <h3 className="text-white font-semibold">Error al cargar las métricas</h3>
          <p className="text-red-400 text-sm">{error || 'Error desconocido'}</p>
        </div>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="btn-secondary text-sm"
      >
        Reintentar
      </button>
    </div>
  );
}
