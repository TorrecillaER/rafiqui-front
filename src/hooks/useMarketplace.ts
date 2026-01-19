'use client';

import { useState, useEffect, useCallback } from 'react';
import { marketplaceApi, type MarketplaceGroup, type MarketplaceFiltersParams, type MarketplaceResponse } from '@/lib/api';

interface FilterState {
  brands: string[];
  healthGrade: string | null;
  powerRange: { min: number; max: number } | null;
  voltageRange: { min: number; max: number } | null;
}

export function useMarketplace() {
  const [groups, setGroups] = useState<MarketplaceGroup[]>([]);
  const [availableFilters, setAvailableFilters] = useState<MarketplaceResponse['availableFilters'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPanels, setTotalPanels] = useState(0);
  const [totalGroups, setTotalGroups] = useState(0);

  const fetchGroups = useCallback(async (filters?: FilterState) => {
    setIsLoading(true);
    setError(null);

    try {
      const params: MarketplaceFiltersParams = {};
      
      if (filters?.brands && filters.brands.length > 0) {
        params.brands = filters.brands.join(',');
      }
      if (filters?.healthGrade) {
        params.healthGrade = filters.healthGrade as 'A' | 'B' | 'C';
      }
      if (filters?.powerRange) {
        params.minPower = filters.powerRange.min;
        params.maxPower = filters.powerRange.max;
      }

      const response = await marketplaceApi.getGroups(params);

      if (response.error) {
        setError(response.error);
        const demoGroups = getDemoGroups();
        setGroups(demoGroups);
        setAvailableFilters(getDemoFilters());
        setTotalPanels(demoGroups.reduce((sum, g) => sum + g.availableCount, 0));
        setTotalGroups(demoGroups.length);
      } else if (response.data) {
        setGroups(response.data.groups);
        setAvailableFilters(response.data.availableFilters);
        setTotalPanels(response.data.totalPanels);
        setTotalGroups(response.data.totalGroups);
      }
    } catch (err) {
      setError('Error al cargar paneles');
      const demoGroups = getDemoGroups();
      setGroups(demoGroups);
      setAvailableFilters(getDemoFilters());
      setTotalPanels(demoGroups.reduce((sum, g) => sum + g.availableCount, 0));
      setTotalGroups(demoGroups.length);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return {
    groups,
    availableFilters,
    isLoading,
    error,
    totalPanels,
    totalGroups,
    refetch: fetchGroups,
  };
}

function getDemoGroups(): MarketplaceGroup[] {
  return [
    {
      groupId: 'trina-275-325w-a-170x100',
      brand: 'Trina Solar',
      model: 'TSM-DE09.08',
      powerRange: '275-325W',
      avgPower: 300,
      avgVoltage: 38.5,
      healthGrade: 'A',
      avgHealthPercentage: 92,
      dimensions: '170x100 cm',
      availableCount: 12,
      panelIds: ['1', '2', '3'],
      suggestedPrice: 45.00,
      imageUrl: '',
    },
    {
      groupId: 'canadian-250-300w-b-165x99',
      brand: 'Canadian Solar',
      model: 'CS3W-400MS',
      powerRange: '250-300W',
      avgPower: 275,
      avgVoltage: 36.2,
      healthGrade: 'B',
      avgHealthPercentage: 80,
      dimensions: '165x99 cm',
      availableCount: 8,
      panelIds: ['4', '5'],
      suggestedPrice: 33.00,
      imageUrl: '',
    },
    {
      groupId: 'sunpower-300-350w-a-175x104',
      brand: 'SunPower',
      model: 'SPR-X21-345',
      powerRange: '300-350W',
      avgPower: 325,
      avgVoltage: 40.1,
      healthGrade: 'A',
      avgHealthPercentage: 95,
      dimensions: '175x104 cm',
      availableCount: 5,
      panelIds: ['6', '7', '8'],
      suggestedPrice: 52.00,
      imageUrl: '',
    },
  ];
}

function getDemoFilters(): MarketplaceResponse['availableFilters'] {
  return {
    brands: ['Trina Solar', 'Canadian Solar', 'SunPower'],
    powerRanges: { min: 200, max: 400 },
    voltageRanges: { min: 30, max: 50 },
    healthGrades: ['A', 'B', 'C'],
  };
}
