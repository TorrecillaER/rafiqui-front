import { useState, useEffect } from 'react';
import { dashboardApi, DashboardMetrics } from '@/lib/api';

export function useDashboardMetrics() {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log('🔍 Fetching dashboard metrics from /statistics/dashboard...');
        const response = await dashboardApi.getMetrics();
        console.log('📊 Dashboard API Response:', response);
        
        if (response.data) {
          console.log('✅ Metrics data received:', response.data);
          setData(response.data);
        } else {
          console.error('❌ No data in response:', response);
          setError(response.error || 'Error al cargar las métricas');
        }
      } catch (err) {
        console.error('❌ Error fetching dashboard metrics:', err);
        setError('Error al conectar con el servidor');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();

    // Refrescar cada 5 minutos
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return { data, isLoading, error };
}
