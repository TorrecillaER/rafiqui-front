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
