import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Legend } from 'recharts';
import { Activity, AlertTriangle, Droplets, TrendingUp, Calendar, Info, Leaf } from 'lucide-react';
import { WaterQualityData, AnalysisStats } from '../types';
import { cn } from '../lib/utils';

interface DashboardProps {
  data: WaterQualityData[];
  stats: AnalysisStats;
}

export default function Dashboard({ data, stats }: DashboardProps) {
  const latest = data[data.length - 1];

  const getTurbidityStatusColor = (status: string) => {
    switch (status) {
      case 'Clear': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'Moderate': return 'text-app-accent bg-app-accent/10 border-app-accent/20';
      case 'Turbid': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'Very Turbid': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      default: return 'text-app-muted bg-app-muted/10 border-app-muted/20';
    }
  };

  const getChlorophyllStatusColor = (status: string) => {
    switch (status) {
      case 'Low': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'Moderate': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'High': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      default: return 'text-app-muted bg-app-muted/10 border-app-muted/20';
    }
  };

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full bg-app-bg">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-app-text tracking-tight uppercase">Water Quality Dashboard</h2>
          <p className="text-app-muted text-sm mt-1">Real-time turbidity and chlorophyll analysis</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest font-bold text-[#64748b]">Last Updated</p>
          <p className="text-app-text font-mono text-sm">{latest?.date || 'N/A'}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Current Turbidity" 
          value={latest?.turbidity || 0} 
          unit="NTU" 
          icon={Droplets}
          status={latest?.turbidityStatus}
          statusColor={getTurbidityStatusColor(latest?.turbidityStatus || '')}
        />
        <MetricCard 
          title="Current Chlorophyll" 
          value={latest?.chlorophyll || 0} 
          unit="Index" 
          icon={Leaf}
          status={latest?.chlorophyllStatus}
          statusColor={getChlorophyllStatusColor(latest?.chlorophyllStatus || '')}
        />
        <MetricCard 
          title="Mean Turbidity" 
          value={stats.turbidity.mean} 
          unit="NTU" 
          icon={Activity}
        />
        <MetricCard 
          title="Anomalies" 
          value={data.filter(d => d.anomaly).length} 
          unit="Events" 
          icon={AlertTriangle}
          isWarning={data.filter(d => d.anomaly).length > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-app-surface border border-app-border rounded-lg p-6 shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[11px] font-bold text-[#64748b] uppercase tracking-[0.1em] flex items-center gap-2">
              <TrendingUp size={14} className="text-app-accent" />
              Water Quality Time Series
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorTurbidity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorChlorophyll" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => val.split('-').slice(1).join('/')}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '4px', fontSize: '12px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#8E9299' }} />
                <Area type="monotone" dataKey="turbidity" name="Turbidity (NTU)" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorTurbidity)" strokeWidth={2} />
                <Area type="monotone" dataKey="chlorophyll" name="Chlorophyll Index" stroke="#22c55e" fillOpacity={1} fill="url(#colorChlorophyll)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-app-surface border border-app-border rounded-lg p-6 shadow-xl">
          <h3 className="text-[11px] font-bold text-[#64748b] uppercase tracking-[0.1em] mb-6 flex items-center gap-2">
            <Info size={14} className="text-app-accent" />
            Statistical Summary
          </h3>
          <div className="space-y-4">
            <StatRow label="Median Turbidity" value={stats.turbidity.median} unit="NTU" />
            <StatRow label="Max Turbidity" value={stats.turbidity.max} unit="NTU" />
            <StatRow label="Median Chlorophyll" value={stats.chlorophyll.median} unit="Idx" />
            <StatRow label="Max Chlorophyll" value={stats.chlorophyll.max} unit="Idx" />
            <StatRow label="Total Samples" value={stats.count} unit="" />
            
            <div className="pt-6 border-t border-app-border mt-6">
              <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-[0.1em] mb-4">Turbidity Status</p>
              <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-app-bg">
                <div className="bg-emerald-500" style={{ width: '40%' }}></div>
                <div className="bg-app-accent" style={{ width: '30%' }}></div>
                <div className="bg-amber-500" style={{ width: '20%' }}></div>
                <div className="bg-rose-500" style={{ width: '10%' }}></div>
              </div>
              <div className="grid grid-cols-2 gap-y-3 mt-4">
                <StatusLegend label="Clear" color="bg-emerald-500" />
                <StatusLegend label="Moderate" color="bg-app-accent" />
                <StatusLegend label="Turbid" color="bg-amber-500" />
                <StatusLegend label="Very Turbid" color="bg-rose-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, unit, icon: Icon, status, statusColor }: any) {
  return (
    <div className="bg-app-surface border border-app-border rounded-lg p-6 shadow-xl">
      <div className="text-[12px] text-app-muted mb-1">{title}</div>
      <div className="flex items-baseline gap-2">
        <h4 className="text-[28px] font-bold text-app-text">{value}</h4>
        <span className="text-[14px] text-app-muted">{unit}</span>
      </div>
      {status && (
        <div className={cn("mt-3 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full inline-block", statusColor)}>
          Condition: {status}
        </div>
      )}
    </div>
  );
}

function StatRow({ label, value, unit }: any) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-app-bg last:border-0">
      <span className="text-[12px] text-app-muted">{label}</span>
      <span className="text-[13px] text-app-text font-bold">{value} <span className="text-[10px] text-app-muted font-normal ml-1">{unit}</span></span>
    </div>
  );
}

function StatusLegend({ label, color }: any) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("w-2.5 h-2.5 rounded-sm", color)}></div>
      <span className="text-[11px] text-app-muted">{label}</span>
    </div>
  );
}
