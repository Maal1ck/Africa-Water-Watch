import { AOI, WaterQualityData } from '../types';

export class GEEService {
  static async getAuthUrl(): Promise<string> {
    const response = await fetch('/api/auth/url');
    if (!response.ok) throw new Error('Failed to get auth URL');
    const { url } = await response.json();
    return url;
  }

  static async getAuthStatus(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/status');
      if (!response.ok) return false;
      const { isAuthenticated } = await response.json();
      return isAuthenticated;
    } catch (error) {
      console.error('Failed to check auth status:', error);
      return false;
    }
  }

  static async logout(): Promise<void> {
    await fetch('/api/auth/logout', { method: 'POST' });
  }

  static async analyzeWaterQuality(
    aoi: AOI, 
    dateRange: { start: string; end: string }, 
    cloudCover: number
  ): Promise<WaterQualityData[]> {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aoi, dateRange, cloudCover })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Analysis failed');
    }

    return response.json();
  }

  static async getMapLayer(
    aoi: AOI,
    dateRange: { start: string; end: string },
    cloudCover: number,
    layerType: 'turbidity' | 'chlorophyll'
  ): Promise<string> {
    const response = await fetch('/api/map-layer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aoi, dateRange, cloudCover, layerType })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get map layer');
    }

    const { urlFormat } = await response.json();
    return urlFormat;
  }
}
