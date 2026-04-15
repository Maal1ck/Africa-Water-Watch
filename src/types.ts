export type TurbidityStatus = 'Clear' | 'Moderate' | 'Turbid' | 'Very Turbid';
export type ChlorophyllStatus = 'Low' | 'Moderate' | 'High';

export interface WaterQualityData {
  date: string;
  turbidity: number;
  chlorophyll: number;
  surfaceArea: number; // in hectares
  turbidityStatus: TurbidityStatus;
  chlorophyllStatus: ChlorophyllStatus;
  anomaly?: boolean;
}

export interface AOI {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: any[];
  };
  properties: {
    name?: string;
    area?: number;
  };
}

export interface MetricStats {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
}

export interface AnalysisStats {
  turbidity: MetricStats;
  chlorophyll: MetricStats;
  surfaceArea: MetricStats;
  count: number;
}
