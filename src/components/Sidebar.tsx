import React from 'react';
import { Calendar, Cloud, Info, Settings, RefreshCw, Map as MapIcon, Trash2 } from 'lucide-react';
import { PREDEFINED_WATERBODIES } from '../data/waterbodies';
import { AOI } from '../types';

interface SidebarProps {
  aoi: AOI | null;
  setAoi: (aoi: AOI | null) => void;
  dateRange: { start: string; end: string };
  setDateRange: (range: { start: string; end: string }) => void;
  cloudCover: number;
  setCloudCover: (value: number) => void;
  onRunAnalysis: () => void;
  isGEEAuthenticated: boolean;
}

export default function Sidebar({ 
  aoi,
  setAoi,
  dateRange, 
  setDateRange, 
  cloudCover, 
  setCloudCover,
  onRunAnalysis,
  isGEEAuthenticated
}: SidebarProps) {
  return (
    <aside className="w-[260px] bg-app-surface border-r border-app-border flex flex-col h-full text-app-muted shrink-0">
      <div className="p-6 space-y-8 flex-1 overflow-y-auto">
        <div className="space-y-6">
          <div className="text-[11px] font-bold text-[#64748b] uppercase tracking-[0.1em]">Location</div>
          
          <div className="space-y-2">
            <label className="text-[12px] text-app-muted flex items-center gap-2">
              <MapIcon size={12} /> Predefined Waterbodies
            </label>
            <select
              className="w-full bg-app-bg border border-app-border rounded px-3 py-2 text-[13px] text-app-text focus:outline-none focus:border-app-accent"
              onChange={(e) => {
                if (e.target.value) {
                  const wb = PREDEFINED_WATERBODIES.find(w => w.name === e.target.value);
                  if (wb) setAoi(wb.aoi);
                } else {
                  setAoi(null);
                }
              }}
              value={aoi ? PREDEFINED_WATERBODIES.find(w => JSON.stringify(w.aoi.geometry) === JSON.stringify(aoi.geometry))?.name || '' : ''}
            >
              <option value="">-- Custom Draw --</option>
              {PREDEFINED_WATERBODIES.map(wb => (
                <option key={wb.name} value={wb.name}>{wb.name}</option>
              ))}
            </select>
            {aoi && (
              <button 
                onClick={() => setAoi(null)}
                className="flex items-center gap-1 text-[11px] text-rose-500 hover:text-rose-400 mt-2 transition-colors"
              >
                <Trash2 size={12} /> Clear Selection
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="text-[11px] font-bold text-[#64748b] uppercase tracking-[0.1em]">Configuration</div>
          
          <div className="space-y-2">
            <label className="text-[12px] text-app-muted flex items-center gap-2">
              <Calendar size={12} /> Date Range
            </label>
            <div className="space-y-2">
              <input 
                type="date" 
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full bg-app-bg border border-app-border rounded px-3 py-2 text-[13px] text-app-text focus:outline-none focus:border-app-accent"
              />
              <input 
                type="date" 
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full bg-app-bg border border-app-border rounded px-3 py-2 text-[13px] text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[12px] text-app-muted flex items-center gap-2">
              <Cloud size={12} /> Cloud Threshold ({cloudCover}%)
            </label>
            <div className="h-1 bg-app-border rounded-full relative my-4">
              <div 
                className="absolute h-full bg-app-accent rounded-full" 
                style={{ width: `${cloudCover}%` }}
              ></div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={cloudCover}
                onChange={(e) => setCloudCover(parseInt(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md border border-app-border pointer-events-none"
                style={{ left: `calc(${cloudCover}% - 6px)` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-[11px] font-bold text-[#64748b] uppercase tracking-[0.1em]">Vector Layer</div>
          <div className="border-2 border-dashed border-app-border rounded-lg p-6 text-center space-y-3">
            <div className="text-[11px] text-[#64748b]">Drop .shp, .json or .gpkg</div>
            <button className="w-full py-2.5 bg-app-border hover:bg-app-border/80 text-white rounded-md font-semibold text-[13px] transition-all">
              Browse Files
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-app-border">
        <button 
          onClick={onRunAnalysis}
          disabled={!isGEEAuthenticated}
          className="w-full py-3 bg-app-accent hover:bg-app-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md font-semibold text-[13px] transition-all shadow-lg shadow-app-accent/20 flex items-center justify-center gap-2"
        >
          <RefreshCw size={16} />
          Run Water Quality Analysis
        </button>
        <div className="mt-6 flex items-center justify-between text-[10px] font-mono opacity-50">
          <span>v1.0.0</span>
          <div className="flex gap-2">
            <Settings size={14} className="cursor-pointer hover:text-white" />
            <Info size={14} className="cursor-pointer hover:text-white" />
          </div>
        </div>
      </div>
    </aside>
  );
}
