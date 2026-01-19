'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useDownloadCertificate } from '@/hooks/useDownloadCertificate';
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
  Database,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { userRole, user } = useAuthStore();
  const { 
    esgMetrics, 
    monthlyData, 
    materialDistribution, 
    isLoading, 
    error, 
    isUsingMockData,
    refetch 
  } = useDashboardData();
  
  const { 
    downloadCertificate, 
    downloadFullReport,
    isDownloading, 
    isDownloadingReport,
    error: downloadError 
  } = useDownloadCertificate();

  const handleDownloadCertificate = async () => {
    try {
      await downloadCertificate(user?.id);
    } catch (err) {
      console.error('Failed to download certificate');
    }
  };

  const handleDownloadFullReport = async () => {
    try {
      await downloadFullReport();
    } catch (err) {
      console.error('Failed to download full report');
    }
  };

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
            <MetricsCards />
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
            <CO2Chart />
            <MaterialsDistributionChart />
            <PanelsRecycledChart />
            <EnergyChart />
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
                <button 
                  onClick={handleDownloadCertificate}
                  disabled={isDownloading}
                  className="btn-accent flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Download size={18} />
                      Descargar Certificado ESG
                    </>
                  )}
                </button>
                <button 
                  onClick={handleDownloadFullReport}
                  disabled={isDownloadingReport}
                  className="btn-outline flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloadingReport ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Generando Reporte...
                    </>
                  ) : (
                    <>
                      <FileText size={18} />
                      Ver Reporte Completo
                    </>
                  )}
                </button>
              </div>

              {downloadError && (
                <p className="mt-2 text-sm text-red-400">{downloadError}</p>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
