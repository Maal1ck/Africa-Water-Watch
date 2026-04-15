import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Map from './components/Map';
import Dashboard from './components/Dashboard';
import Analysis from './components/Analysis';
import Methodology from './components/Methodology';
import Files from './components/Files';
import { GEEService } from './services/geeService';
import { WaterQualityService } from './services/turbidityService';
import { AOI, WaterQualityData, AnalysisStats } from './types';
import { format, subYears } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { LogIn, LogOut, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [aoi, setAoi] = useState<AOI | null>(null);
  const [cloudCover, setCloudCover] = useState(20);
  const [dateRange, setDateRange] = useState({
    start: format(subYears(new Date(), 1), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  const [data, setData] = useState<WaterQualityData[]>([]);
  const [mapLayerUrl, setMapLayerUrl] = useState<string | null>(null);
  const [mapLayerType, setMapLayerType] = useState<'turbidity' | 'chlorophyll'>('turbidity');
  const [isLoading, setIsLoading] = useState(false);
  const [isGEEAuthenticated, setIsGEEAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check GEE Auth Status
  const checkAuth = async () => {
    const status = await GEEService.getAuthStatus();
    setIsGEEAuthenticated(status);
  };

  useEffect(() => {
    checkAuth();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        checkAuth();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnectGEE = async () => {
    try {
      const url = await GEEService.getAuthUrl();
      window.open(url, 'gee_auth', 'width=600,height=700');
    } catch (err) {
      console.error('Failed to get auth URL', err);
    }
  };

  const handleLogout = async () => {
    await GEEService.logout();
    setIsGEEAuthenticated(false);
    setData([]);
    setMapLayerUrl(null);
  };

  const handleSetAoi = (newAoi: AOI | null) => {
    setAoi(newAoi);
    setMapLayerUrl(null);
    setData([]);
  };

  // Real GEE Analysis
  const runAnalysis = async () => {
    if (!aoi || !isGEEAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const [results, layerUrl] = await Promise.all([
        GEEService.analyzeWaterQuality(aoi, dateRange, cloudCover),
        GEEService.getMapLayer(aoi, dateRange, cloudCover, mapLayerType)
      ]);
      setData(results);
      setMapLayerUrl(layerUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger analysis when AOI changes or when manually requested
  useEffect(() => {
    if (aoi && isGEEAuthenticated) {
      runAnalysis();
    }
  }, [aoi, isGEEAuthenticated]);

  // Refetch map layer if layer type changes
  useEffect(() => {
    if (aoi && isGEEAuthenticated && data.length > 0) {
      GEEService.getMapLayer(aoi, dateRange, cloudCover, mapLayerType)
        .then(setMapLayerUrl)
        .catch(console.error);
    }
  }, [mapLayerType]);

  const stats = useMemo(() => WaterQualityService.calculateStats(data), [data]);

  const tabs = [
    { id: 'map', label: 'Map View' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'analysis', label: 'Analysis' },
    { id: 'methodology', label: 'Methodology' },
    { id: 'files', label: 'File Export' },
  ];

  return (
    <div className="flex flex-col h-screen bg-app-bg text-app-text overflow-hidden font-sans selection:bg-app-accent/30">
      <header className="h-[60px] bg-app-surface border-b border-app-border flex items-center px-6 justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-app-accent to-[#2dd4bf] shadow-lg shadow-app-accent/20"></div>
          <div className="text-lg font-bold tracking-tight text-[#e2e8f0] uppercase">
            WaterWatch Africa <span className="text-app-muted font-normal text-sm ml-2">v1.0</span>
          </div>
        </div>

        <nav className="flex gap-8 h-full">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "text-[13px] font-semibold uppercase tracking-widest transition-all relative flex items-center h-full",
                activeTab === tab.id 
                  ? "text-app-accent after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-app-accent" 
                  : "text-app-muted hover:text-app-text"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {isGEEAuthenticated ? (
            <div className="flex items-center gap-3 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">GEE Connected</span>
              <button onClick={handleLogout} className="text-app-muted hover:text-rose-500 transition-colors">
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleConnectGEE}
              className="flex items-center gap-2 px-4 py-2 bg-app-accent hover:bg-app-accent/90 text-white rounded-md text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-app-accent/20"
            >
              <LogIn size={14} />
              Connect Earth Engine
            </button>
          )}
          <div className="text-[12px] text-app-muted font-medium border-l border-app-border pl-4">
            Sentinel-2 • L2A
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          aoi={aoi}
          setAoi={handleSetAoi}
          dateRange={dateRange}
          setDateRange={setDateRange}
          cloudCover={cloudCover}
          setCloudCover={setCloudCover}
          onRunAnalysis={runAnalysis}
          isGEEAuthenticated={isGEEAuthenticated}
        />

        <main className="flex-1 relative flex flex-col min-w-0 bg-[#020617] bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[length:30px_30px]">
          <AnimatePresence mode="wait">
            {activeTab === 'map' ? (
              <motion.div 
                key="map"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0"
              >
                <Map 
                  aoi={aoi} 
                  setAoi={handleSetAoi} 
                  mapLayerUrl={mapLayerUrl} 
                  mapLayerType={mapLayerType}
                  setMapLayerType={setMapLayerType}
                />
              </motion.div>
            ) : (
              <motion.div 
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-hidden"
              >
                {activeTab === 'dashboard' && <Dashboard data={data} stats={stats} />}
                {activeTab === 'analysis' && <Analysis data={data} stats={stats} />}
                {activeTab === 'methodology' && <Methodology />}
                {activeTab === 'files' && <Files data={data} aoi={aoi} setAoi={handleSetAoi} />}
              </motion.div>
            )}
          </AnimatePresence>

          {isLoading && (
            <div className="absolute inset-0 z-[2000] bg-app-bg/60 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-app-accent border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-mono text-app-accent animate-pulse uppercase tracking-widest">Processing Satellite Data...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute bottom-6 right-6 z-[2000] bg-rose-500 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-4 border border-rose-400">
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-widest mb-1">Analysis Error</p>
                <p className="text-sm opacity-90">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-white/60 hover:text-white">
                ✕
              </button>
            </div>
          )}

          {!isGEEAuthenticated && (
            <div className="absolute inset-0 z-[1500] bg-app-bg/80 backdrop-blur-md flex items-center justify-center p-8">
              <div className="max-w-md text-center space-y-6">
                <div className="w-20 h-20 bg-app-accent/10 rounded-3xl flex items-center justify-center text-app-accent mx-auto border border-app-accent/20">
                  <LogIn size={40} strokeWidth={1.5} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-light tracking-tight">Connect Google Earth Engine</h2>
                  <p className="text-app-muted text-sm leading-relaxed">
                    To perform real-time satellite analysis of water turbidity, you need to authenticate with your Google Earth Engine account.
                  </p>
                </div>
                <button 
                  onClick={handleConnectGEE}
                  className="px-8 py-3 bg-app-accent hover:bg-app-accent/90 text-white rounded-md font-semibold transition-all shadow-lg shadow-app-accent/20"
                >
                  Connect Account
                </button>
              </div>
            </div>
          )}

          {isGEEAuthenticated && !aoi && activeTab !== 'map' && activeTab !== 'files' && (
            <div className="absolute inset-0 z-[1500] bg-app-bg/80 backdrop-blur-md flex items-center justify-center p-8">
              <div className="max-w-md text-center space-y-6">
                <div className="w-20 h-20 bg-app-accent/10 rounded-3xl flex items-center justify-center text-app-accent mx-auto border border-app-accent/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-light tracking-tight">No Active Analysis Area</h2>
                  <p className="text-app-muted text-sm leading-relaxed">
                    To view turbidity metrics and historical trends, you first need to define an area of interest on the map.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab('map')}
                  className="px-8 py-3 bg-app-accent hover:bg-app-accent/90 text-white rounded-md font-semibold transition-all shadow-lg shadow-app-accent/20"
                >
                  Go to Map
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
