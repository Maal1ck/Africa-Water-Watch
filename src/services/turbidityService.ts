import { WaterQualityData, AnalysisStats, TurbidityStatus, ChlorophyllStatus, MetricStats } from '../types';

export class WaterQualityService {
  static getTurbidityStatus(value: number): TurbidityStatus {
    if (value < 20) return 'Clear';
    if (value < 40) return 'Moderate';
    if (value < 60) return 'Turbid';
    return 'Very Turbid';
  }

  static getChlorophyllStatus(value: number): ChlorophyllStatus {
    if (value < 45) return 'Low';
    if (value < 60) return 'Moderate';
    return 'High';
  }

  private static calculateMetricStats(values: number[]): MetricStats {
    if (values.length === 0) {
      return { mean: 0, median: 0, stdDev: 0, min: 0, max: 0 };
    }
    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const mean = sum / sorted.length;
    
    const median = sorted.length % 2 === 0 
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    const variance = sorted.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / sorted.length;
    const stdDev = Math.sqrt(variance);

    return {
      mean: Number(mean.toFixed(2)),
      median: Number(median.toFixed(2)),
      stdDev: Number(stdDev.toFixed(2)),
      min: Number(sorted[0].toFixed(2)),
      max: Number(sorted[sorted.length - 1].toFixed(2))
    };
  }

  static calculateStats(data: WaterQualityData[]): AnalysisStats {
    if (data.length === 0) {
      return {
        turbidity: { mean: 0, median: 0, stdDev: 0, min: 0, max: 0 },
        chlorophyll: { mean: 0, median: 0, stdDev: 0, min: 0, max: 0 },
        surfaceArea: { mean: 0, median: 0, stdDev: 0, min: 0, max: 0 },
        count: 0
      };
    }

    return {
      turbidity: this.calculateMetricStats(data.map(d => d.turbidity)),
      chlorophyll: this.calculateMetricStats(data.map(d => d.chlorophyll)),
      surfaceArea: this.calculateMetricStats(data.map(d => d.surfaceArea || 0)),
      count: data.length
    };
  }
}
