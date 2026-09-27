import React from 'react';
import { 
  Sun, 
  Wind, 
  ThermometerSnowflake, 
  Gauge, 
  Radio, 
  Compass, 
  CloudRain, 
  AlertTriangle,
  TrendingDown
} from 'lucide-react';
import { SimulationState, HistoryDataPoint } from '../types/simulation';

interface EnvironmentalPanelProps {
  state: SimulationState;
  history: HistoryDataPoint[];
}

export const EnvironmentalPanel: React.FC<EnvironmentalPanelProps> = ({ state, history }) => {
  // Ambient temperature normalized (-85 to -20)
  const tempClamped = Math.max(-85, Math.min(-20, state.ambientTemp));
  const tempPercent = Math.round(((tempClamped - (-85)) / ((-20) - (-85))) * 100);

  // Atmospheric Opacity Tau normalized (0.5 to 4.5)
  const tauClamped = Math.max(0.5, Math.min(4.5, state.tau));
  const tauPercent = Math.round(((tauClamped - 0.5) / (4.5 - 0.5)) * 100);

  // Panel Dust layer percentage
  const dustPct = Math.round(state.solarDustLayer * 100);

  // Determine Tau severity level
  const getTauSeverity = (tau: number) => {
    if (tau < 1.0) return { label: 'CLEAR SKY', color: 'text-emerald-400', border: 'border-emerald-500/30' };
    if (tau < 2.0) return { label: 'HAZY DUST', color: 'text-amber-400', border: 'border-amber-500/30' };
    if (tau < 3.5) return { label: 'REGIONAL STORM', color: 'text-orange-400', border: 'border-orange-500/40' };
    return { label: 'GLOBAL STORM EVENT', color: 'text-red-400', border: 'border-red-500/60' };
  };

  const tauStatus = getTauSeverity(state.tau);

  // SVG sparkline path for temperature
  const generateSparkline = (dataKey: 'ambientTemp' | 'tau' | 'pSolar', minVal: number, maxVal: number) => {
    if (history.length < 2) return '';
    const width = 240;
    const height = 36;
    const padding = 2;
    const pts = history.map((pt, index) => {
      const x = padding + (index / (history.length - 1)) * (width - 2 * padding);
      const val = pt[dataKey];
      const normalized = Math.max(0, Math.min(1, (val - minVal) / (maxVal - minVal || 1)));
      const y = height - padding - normalized * (height - 2 * padding);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return pts.join(' ');
  };

  const tempPoints = generateSparkline('ambientTemp', -85, -20);
  const tauPoints = generateSparkline('tau', 0.5, 4.5);
  const solarPoints = generateSparkline('pSolar', 0, 80);

  return (
    <aside className="w-80 h-full flex flex-col bg-slate-950/70 border-r border-cyan-500/20 text-slate-200 select-none overflow-y-auto hud-scrollbar p-3 space-y-3">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
        <div className="flex items-center gap-1.5">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-xs font-bold tracking-wider text-cyan-300 font-hud">
            ENVIRONMENTAL TELEMETRY
          </span>
        </div>
        <span className="text-[10px] font-mono-data text-slate-400 px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded">
          {state.nasaDatasetMode === 'curiosity_rems'
            ? 'CURIOSITY REMS'
            : state.nasaDatasetMode === 'perseverance_meda'
            ? 'PERSEVERANCE MEDA'
            : 'LIVE MARS FEED'}
        </span>
      </div>

      {/* METRIC 1: Ambient Air Temperature (T_ambient) */}
      <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded relative overflow-hidden group hover:border-cyan-500/40 transition-colors">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 uppercase tracking-wider font-mono-data">
              <ThermometerSnowflake className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ambient Air Temp (T<span className="text-[9px]">amb</span>)</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono-data text-cyan-300">
                {state.ambientTemp.toFixed(1)}
              </span>
              <span className="text-xs font-mono-data text-slate-400">°C</span>
              <span className="text-[10px] font-mono-data text-slate-500">
                ({(state.ambientTemp * 1.8 + 32).toFixed(1)}°F)
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono-data text-slate-400 uppercase block">SWING BOUNDS</span>
            <span className="text-[11px] font-mono-data text-slate-300">-85°C ··· -20°C</span>
          </div>
        </div>

        {/* Temperature range bar */}
        <div className="mt-2.5">
          <div className="flex justify-between text-[9px] font-mono-data text-slate-500 mb-1">
            <span>MIDNIGHT (-85°C)</span>
            <span>MIDDAY (-20°C)</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden relative">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-amber-400 rounded-full transition-all duration-300"
              style={{ width: `${tempPercent}%` }}
            />
          </div>
        </div>

        {/* Sparkline trend */}
        {tempPoints && (
          <div className="mt-2 pt-1 border-t border-slate-800/50">
            <div className="flex justify-between items-center text-[9px] font-mono-data text-slate-500 mb-0.5">
              <span>SOL HISTORICAL TREND</span>
              <span className="text-cyan-400/80">REMS SENSOR 1</span>
            </div>
            <svg className="w-full h-8 overflow-visible" viewBox="0 0 240 36">
              <polyline
                fill="none"
                stroke="#06b6d4"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={tempPoints}
              />
            </svg>
          </div>
        )}
      </div>

      {/* METRIC 2: Atmospheric Opacity (Tau / τ) */}
      <div className={`p-3 bg-slate-900/60 border ${tauStatus.border} rounded relative overflow-hidden group transition-colors`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 uppercase tracking-wider font-mono-data">
              <Wind className="w-3.5 h-3.5 text-amber-400" />
              <span>Atmospheric Opacity (τ)</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-bold font-mono-data ${tauStatus.color}`}>
                {state.tau.toFixed(2)}
              </span>
              <span className="text-xs font-mono-data text-slate-400">Tau</span>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-[10px] font-mono-data font-semibold ${tauStatus.color} px-1.5 py-0.5 bg-slate-950/80 border border-slate-800 rounded`}>
              {tauStatus.label}
            </span>
          </div>
        </div>

        {/* Opacity Bar */}
        <div className="mt-2.5">
          <div className="flex justify-between text-[9px] font-mono-data text-slate-500 mb-1">
            <span>CLEAR (0.5)</span>
            <span>STORM (4.5)</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden relative">
            <div 
              className={`h-full transition-all duration-300 ${
                state.tau > 3.0 ? 'bg-red-500' : state.tau > 1.5 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${tauPercent}%` }}
            />
          </div>
        </div>

        {/* Beer-Lambert Extinction indicator */}
        <div className="mt-2 pt-1 border-t border-slate-800/50 flex items-center justify-between text-[10px] font-mono-data text-slate-400">
          <span>Direct Sunlight Attenuation:</span>
          <span className="text-amber-300 font-semibold">
            {((1 - Math.exp(-state.tau)) * 100).toFixed(0)}% blocked
          </span>
        </div>

        {/* Tau Sparkline */}
        {tauPoints && (
          <div className="mt-1">
            <svg className="w-full h-7 overflow-visible" viewBox="0 0 240 36">
              <polyline
                fill="none"
                stroke={state.tau > 2.0 ? '#f97316' : '#10b981'}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={tauPoints}
              />
            </svg>
          </div>
        )}
      </div>

      {/* METRIC 3: Solar Array Efficiency Index */}
      <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded relative overflow-hidden group hover:border-cyan-500/40 transition-colors">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 uppercase tracking-wider font-mono-data">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Solar Efficiency Index</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-bold font-mono-data ${
                state.solarEfficiency > 40 ? 'text-emerald-400' : state.solarEfficiency > 15 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {state.solarEfficiency.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono-data text-slate-400 uppercase block">OUTPUT</span>
            <span className="text-[12px] font-mono-data font-bold text-amber-300">
              {state.pSolar.toFixed(1)} <span className="text-[9px] font-normal text-slate-400">/ 80 kW</span>
            </span>
          </div>
        </div>

        {/* Dust Layer Sub-Gauge */}
        <div className="mt-2.5 p-2 bg-slate-950/60 rounded border border-slate-800/80 space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-mono-data">
            <span className="text-slate-400">Panel Dust Coating:</span>
            <span className={`font-semibold ${dustPct > 50 ? 'text-red-400' : dustPct > 20 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {dustPct}% covered
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${dustPct > 50 ? 'bg-red-500' : 'bg-amber-600'}`}
              style={{ width: `${dustPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono-data text-slate-500">
            <span>Clean (0%)</span>
            <span>Critical Degradation (100%)</span>
          </div>
        </div>

        {/* Solar Generation History */}
        {solarPoints && (
          <div className="mt-2 pt-1 border-t border-slate-800/50">
            <div className="flex justify-between items-center text-[9px] font-mono-data text-slate-500 mb-0.5">
              <span>SOLAR OUTPUT (KW)</span>
              <span className="text-amber-400/80">DIURNAL CURVE</span>
            </div>
            <svg className="w-full h-8 overflow-visible" viewBox="0 0 240 36">
              <polyline
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={solarPoints}
              />
            </svg>
          </div>
        )}
      </div>

      {/* Planetary Environment Data Box */}
      <div className="p-2.5 bg-slate-900/40 border border-slate-800/60 rounded space-y-1.5 text-[10px] font-mono-data">
        <div className="text-slate-400 uppercase tracking-wider flex items-center gap-1 font-semibold text-[11px] pb-1 border-b border-slate-800">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>MARS SURFACE ENVIRONMENT</span>
        </div>
        <div className="flex justify-between text-slate-300">
          <span className="text-slate-500">Site Coordinates:</span>
          <span>4.59° S, 137.44° E (Gale)</span>
        </div>
        <div className="flex justify-between text-slate-300">
          <span className="text-slate-500">Atmospheric Pressure:</span>
          <span>6.12 hPa (95.3% CO₂)</span>
        </div>
        <div className="flex justify-between text-slate-300">
          <span className="text-slate-500">Surface Gravity:</span>
          <span>0.38 g (3.72 m/s²)</span>
        </div>
        <div className="flex justify-between text-slate-300">
          <span className="text-slate-500">Day/Night Cycle:</span>
          <span className={state.hour >= 6 && state.hour < 18 ? 'text-amber-400' : 'text-cyan-400'}>
            {state.hour >= 6 && state.hour < 18 ? 'Daylight (06-18)' : 'Night (18-06)'}
          </span>
        </div>
      </div>

      {/* Active Storm Banner if running */}
      {state.dustStormActive && (
        <div className="p-2.5 bg-red-950/60 border border-red-500/60 rounded text-red-200 text-xs font-mono-data space-y-1 animate-pulse">
          <div className="flex items-center gap-1.5 font-bold text-red-400">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>{state.dustStormSeverity.toUpperCase()} DUST STORM ACTIVE</span>
          </div>
          <p className="text-[10px] text-red-300/90 leading-tight">
            Wind velocity 28 m/s. Dust accumulation rate: +5.0% / hour. Solar array generation heavily compromised.
          </p>
          <div className="text-[10px] text-red-400 font-semibold pt-0.5">
            Estimated duration remaining: {state.dustStormHoursRemaining}h
          </div>
        </div>
      )}
    </aside>
  );
};
