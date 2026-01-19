export type HealthGrade = 'A' | 'B' | 'C';

export type PowerRange = 'LOW' | 'MEDIUM' | 'HIGH';

export interface MarketplaceGroup {
  groupId: string;
  brand: string;
  model: string;
  powerRange: string;
  avgPower: number;
  avgVoltage: number;
  healthGrade: HealthGrade;
  avgHealthPercentage: number;
  dimensions: string;
  availableCount: number;
  panelIds: string[];
  suggestedPrice?: number;
  imageUrl?: string;
}

export interface MarketplaceFilters {
  brands?: string;
  minPower?: number;
  maxPower?: number;
  powerRange?: PowerRange;
  minVoltage?: number;
  maxVoltage?: number;
  healthGrade?: HealthGrade;
  minLength?: number;
  maxLength?: number;
  minWidth?: number;
  maxWidth?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface MarketplaceResponse {
  groups: MarketplaceGroup[];
  totalPanels: number;
  totalGroups: number;
  page: number;
  limit: number;
  totalPages: number;
  availableFilters: {
    brands: string[];
    powerRanges: { min: number; max: number };
    voltageRanges: { min: number; max: number };
    healthGrades: HealthGrade[];
  };
}

export interface MarketplacePanel {
  id: string;
  qrCode: string;
  brand: string;
  model: string;
  measuredPowerWatts: number;
  measuredVoltage: number;
  healthPercentage: number;
  healthGrade: HealthGrade;
  dimensionLength: number;
  dimensionWidth: number;
  dimensionHeight: number;
  refurbishedAt: string;
  refurbishmentNotes?: string;
}
