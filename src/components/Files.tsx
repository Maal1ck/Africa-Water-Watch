import React, { useRef } from 'react';
import { Upload, Download, FileJson, FileSpreadsheet, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { WaterQualityData, AOI } from '../types';
import { cn } from '../lib/utils';

interface FilesProps {
  data: WaterQualityData[];
  aoi: AOI | null;
  setAoi: (aoi: AOI | null) => void;
}

export default function Files({ data, aoi, setAoi }: FilesProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadCSV = () => {
    const headers = ['Date', 'Turbidity (NTU)', 'Turbidity Status', 'Chlorophyll Index', 'Chlorophyll Status', 'Anomaly'];
    const csvContent = [
      headers.join(','),
      ...data.map(d => `${d.date},${d.turbidity},${d.turbidityStatus},${d.chlorophyll},${d.chlorophyllStatus},${d.anomaly || false}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `water_quality_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const downloadGeoJSON = () => {
    if (!aoi) return;
    const blob = new Blob([JSON.stringify(aoi)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aoi_boundary_${new Date().toISOString().split('T')[0]}.geojson`;
    a.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.type === 'Feature' || json.type === 'FeatureCollection') {
          const feature = json.type === 'FeatureCollection' ? json.features[0] : json;
          setAoi(feature);
        }
      } catch (err) {
        console.error('Failed to parse GeoJSON', err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full bg-app-bg">
      <header>
        <h2 className="text-3xl font-bold text-app-text tracking-tight uppercase">Data Management</h2>
        <p className="text-app-muted text-sm mt-1">Import vector boundaries and export analysis results</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-app-surface border border-app-border rounded-lg p-8 shadow-xl flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-app-accent/10 rounded-full flex items-center justify-center text-app-accent mb-6">
            <Upload size={32} />
          </div>
          <h3 className="text-app-text font-bold uppercase tracking-tight mb-2">Upload Vector File</h3>
          <p className="text-sm text-app-muted mb-8 max-w-xs leading-relaxed">
            Support for GeoJSON files. Upload your area of interest to begin analysis.
          </p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".geojson,.json" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 bg-app-accent hover:bg-app-accent/90 text-white rounded-md font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-app-accent/20"
          >
            <Upload size={16} />
            Choose File
          </button>
        </div>

        <div className="bg-app-surface border border-app-border rounded-lg p-8 shadow-xl">
          <h3 className="text-[11px] font-bold text-[#64748b] uppercase tracking-[0.1em] mb-6">Export Results</h3>
          <div className="space-y-4">
            <ExportButton 
              title="Water Quality Time Series" 
              description="Download historical data in CSV format"
              icon={FileSpreadsheet}
              onClick={downloadCSV}
              disabled={data.length === 0}
            />
            <ExportButton 
              title="AOI Boundary" 
              description="Download current area boundary as GeoJSON"
              icon={FileJson}
              onClick={downloadGeoJSON}
              disabled={!aoi}
            />
          </div>
        </div>
      </div>

      <div className="bg-app-surface border border-app-border rounded-lg p-6 shadow-xl">
        <h3 className="text-[11px] font-bold text-[#64748b] uppercase tracking-[0.1em] mb-6">Active Boundary Status</h3>
        {aoi ? (
          <div className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="text-emerald-500">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-app-text font-bold text-sm uppercase tracking-tight">Boundary Loaded Successfully</p>
                <p className="text-[10px] text-app-muted font-mono">Type: {aoi.geometry.type} | Area: {(aoi.properties.area || 0).toFixed(2)} m²</p>
              </div>
            </div>
            <button 
              onClick={() => setAoi(null)}
              className="p-2 text-app-muted hover:text-rose-500 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4 p-4 bg-app-bg border border-app-border rounded-lg">
            <div className="text-amber-500">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-app-text font-bold text-sm uppercase tracking-tight">No Active Boundary</p>
              <p className="text-xs text-app-muted">Define an area on the map or upload a file to start analysis.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ExportButton({ title, description, icon: Icon, onClick, disabled }: any) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center justify-between p-4 rounded-lg border transition-all text-left group",
        disabled 
          ? "opacity-50 cursor-not-allowed border-app-border bg-app-bg/50" 
          : "border-app-border bg-app-bg hover:border-app-accent hover:shadow-lg"
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "p-2 rounded-lg transition-colors",
          disabled ? "bg-app-border text-app-muted" : "bg-app-accent/10 text-app-accent group-hover:bg-app-accent group-hover:text-white"
        )}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-app-text font-bold text-sm uppercase tracking-tight">{title}</p>
          <p className="text-[10px] text-app-muted uppercase tracking-widest">{description}</p>
        </div>
      </div>
      <Download size={18} className="text-[#64748b] group-hover:text-app-accent transition-colors" />
    </button>
  );
}
