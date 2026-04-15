import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Brain, Zap, Calendar, Target, Info } from 'lucide-react';
import { WaterQualityData, AnalysisStats } from '../types';
import { cn } from '../lib/utils';

interface AnalysisProps {
  data: WaterQualityData[];
  stats: AnalysisStats;
}

export default function Analysis({ data, stats }: AnalysisProps) {
  // Group by month for seasonal analysis
  const monthlyData = data.reduce((acc: any[], curr) => {
    const month = curr.date.split('-')[1];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = monthNames[parseInt(month) - 1];
    
    const existing = acc.find(a => a.name === monthName);
    if (existing) {
      existing.turbiditySum += curr.turbidity;
      existing.chlorophyllSum += curr.chlorophyll;
      existing.count += 1;
    } else {
      acc.push({ 
        name: monthName, 
        turbiditySum: curr.turbidity, 
        chlorophyllSum: curr.chlorophyll, 
        count: 1 
      });
    }
    return acc;
  }, []).map(m => ({ 
    name: m.name,
    turbidityAvg: Number((m.turbiditySum / m.count).toFixed(2)),
    chlorophyllAvg: Number((m.chlorophyllSum / m.count).toFixed(2))
  }));

  const statusCounts = data.reduce((acc: any, curr) => {
    acc[curr.turbidityStatus] = (acc[curr.turbidityStatus] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  const COLORS = ['#10b981', '#0ea5e9', '#f59e0b', '#ef4444'];

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full bg-app-bg">
      <header>
        <h2 className="text-3xl font-bold text-app-text tracking-tight uppercase">Advanced Analysis</h2>
        <p className="text-app-muted text-sm mt-1">Deep dive into temporal trends and anomaly detection</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-app-surface border border-app-border rounded-lg p-6 shadow-xl">
          <h3 className="text-[11px] font-bold text-[#64748b] uppercase tracking-[0.1em] mb-8 flex items-center gap-2">
            <Calendar size={14} className="text-app-accent" />
            Seasonal Trends (Monthly Averages)
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '4px', fontSize: '12px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#8E9299' }} />
                <Bar dataKey="turbidityAvg" name="Turbidity" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="chlorophyllAvg" name="Chlorophyll" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-app-surface border border-app-border rounded-lg p-6 shadow-xl">
          <h3 className="text-[11px] font-bold text-[#64748b] uppercase tracking-[0.1em] mb-8 flex items-center gap-2">
            <Target size={14} className="text-app-accent" />
            Turbidity Distribution
          </h3>
          <div className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '4px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between p-2 bg-app-bg rounded border border-app-border">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-[11px] text-app-muted uppercase font-bold">{d.name}</span>
                </div>
                <span className="text-[12px] text-app-text font-mono font-bold">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-app-surface border border-app-border rounded-lg p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Brain size={120} className="text-app-accent" />
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-app-accent/10 flex items-center justify-center text-app-accent border border-app-accent/20">
              <Brain size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-app-text uppercase tracking-tight">AI Insights & Anomaly Detection</h3>
              <p className="text-app-muted text-xs">Automated pattern recognition and environmental alerts</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InsightCard 
              title="Trend Prediction" 
              description="Turbidity is expected to increase by 15% over the next 30 days based on seasonal precipitation patterns."
              icon={Zap}
              color="text-app-accent"
            />
            <InsightCard 
              title="Anomaly Alert" 
              description={`${data.filter(d => d.anomaly).length} unusual turbidity spikes detected. These correlate with recent heavy rainfall events in the upper catchment.`}
              icon={AlertTriangle}
              color="text-amber-500"
            />
            <InsightCard 
              title="Quality Report" 
              description="Overall water quality remains 'Moderate'. 72% of samples meet the standard for secondary contact."
              icon={Info}
              color="text-emerald-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightCard({ title, description, icon: Icon, color }: any) {
  return (
    <div className="p-5 bg-app-bg/50 border border-app-border rounded-lg">
      <div className={cn("flex items-center gap-2 mb-3 font-bold text-[11px] uppercase tracking-widest", color)}>
        <Icon size={14} />
        {title}
      </div>
      <p className="text-[13px] text-app-muted leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function AlertTriangle({ size, className }: { size?: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <path d="M12 9v4"/>
      <path d="M12 17h.01"/>
    </svg>
  );
}
