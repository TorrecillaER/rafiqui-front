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
        console.log('📊 Fetching dashboard charts from /dashboard/charts...');
        const response = await dashboardApi.getCharts();
        console.log('📈 Charts API Response:', response);
        
        if (response.data) {
          console.log('✅ Charts data received:', response.data);
          setData(response.data);
        } else {
          console.error('❌ No data in charts response:', response);
          setError(response.error || 'Error al cargar las gráficas');
        }
      } catch (err) {
        console.error('❌ Error fetching dashboard charts:', err);
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
