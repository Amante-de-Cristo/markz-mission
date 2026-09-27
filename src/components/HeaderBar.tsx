import React from 'react';
import { 
  Play, 
  Pause, 
  FastForward, 
  StepForward, 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  RotateCcw,
  Zap,
  Thermometer,
  ShieldAlert,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { SimulationState, SimulationSpeed } from '../types/simulation';
import { sound } from '../utils/audio';

interface HeaderBarProps {
  state: SimulationState;
  onSetSpeed: (speed: SimulationSpeed) => void;
  onStepHour: () => void;
  onToggleSound: () => void;
  onOpenGuide: () => void;
  onReset: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  state,
  onSetSpeed,
  onStepHour,
  onToggleSound,
  onOpenGuide,
  onReset,
}) => {
  const hourInt = Math.floor(state.hour);
  const minuteInt = Math.round((state.hour % 1) * 60);
  const timeFormatted = `${String(hourInt).padStart(2, '0')}:${String(minuteInt).padStart(2, '0')} LMST`;

  // Crew status visual
  const getCrewBadge = () => {
    switch (state.crewStatus) {
      case 'Optimal':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-mono-data rounded">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold">CREW: OPTIMAL</span>
            <span className="text-emerald-500/70">({state.crewHealth.toFixed(0)}%)</span>
          </div>
        );
      case 'Warning':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/60 border border-amber-500/50 text-amber-400 text-xs font-mono-data rounded animate-pulse">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold">CREW: WARNING</span>
            <span className="text-amber-500/70">({state.crewHealth.toFixed(0)}%)</span>
          </div>
        );
      case 'Critical':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-950/80 border border-red-500 text-red-400 text-xs font-mono-data rounded animate-bounce">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span className="font-semibold">CREW: CRITICAL</span>
            <span className="text-red-400 font-bold">({state.crewHealth.toFixed(0)}%)</span>
          </div>
        );
    }
  };

  // Temperature color
  const getHabitatTempColor = () => {
    if (state.habitatTemp >= 16 && state.habitatTemp <= 24) return 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40';
    if (state.habitatTemp > 0) return 'text-amber-400 border-amber-500/40 bg-amber-950/40';
    return 'text-red-400 border-red-500/60 bg-red-950/60 animate-pulse';
  };

  // Battery bar color
  const batteryPct = Math.round((state.batteryStored / state.batteryMax) * 100);
  const getBatteryColor = () => {
    if (batteryPct > 40) return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40';
    if (batteryPct > 15) return 'text-amber-400 border-amber-500/40 bg-amber-950/40';
    return 'text-red-400 border-red-500/70 bg-red-950/70 animate-pulse';
  };

  return (
    <header className="h-14 border-b border-cyan-500/20 bg-slate-950/90 backdrop-blur px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & Mission Title */}
      <div className="flex items-center gap-3">
        <div className="w-2.5 h-6 bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)] rounded-xs" />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm md:text-base font-bold tracking-wider text-slate-100 font-hud uppercase">
              Ares Shield <span className="text-cyan-400">// Mars Habitat Control</span>
            </h1>
            <span className="text-[10px] tracking-widest text-slate-400 font-mono-data px-1.5 py-0.5 border border-slate-700 rounded bg-slate-900/60 hidden sm:inline-block">
              NASA SPACE APPS TRAINER
            </span>
          </div>
        </div>
      </div>

      {/* Center Clocks & Telemetry Badges */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Sol Counter */}
        <div className="px-3 py-1 bg-slate-900/80 border border-slate-700 rounded flex items-center gap-2 font-mono-data text-xs">
          <span className="text-slate-400 text-[10px] tracking-wider uppercase">MISSION</span>
          <span className="text-cyan-300 font-bold text-sm">
            SOL {String(state.sol).padStart(2, '0')}
            <span className="text-slate-500 text-xs font-normal"> / 30</span>
          </span>
        </div>

        {/* LMST Time */}
        <div className="px-3 py-1 bg-slate-900/80 border border-slate-700 rounded flex items-center gap-1.5 font-mono-data text-xs">
          <span className="text-slate-400 text-[10px] tracking-wider uppercase">LMST</span>
          <span className="text-amber-300 font-semibold">{timeFormatted}</span>
        </div>

        {/* Crew Status Badge */}
        <div className="hidden lg:block">
          {getCrewBadge()}
        </div>

        {/* Habitat Temp Badge */}
        <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 border rounded font-mono-data text-xs ${getHabitatTempColor()}`}>
          <Thermometer className="w-3.5 h-3.5" />
          <span className="text-slate-400 text-[10px]">HAB TEMP</span>
          <span className="font-bold">
            {state.habitatTemp >= 0 ? `+${state.habitatTemp.toFixed(1)}` : state.habitatTemp.toFixed(1)}°C
          </span>
        </div>

        {/* Battery Reserve Badge */}
        <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 border rounded font-mono-data text-xs ${getBatteryColor()}`}>
          <Zap className="w-3.5 h-3.5" />
          <span className="text-slate-400 text-[10px]">BATTERY</span>
          <span className="font-bold">{state.batteryStored.toFixed(0)} kWh</span>
          <span className="text-slate-400 text-[10px]">({batteryPct}%)</span>
        </div>
      </div>

      {/* Right Controls: Speed, Manual Step, Audio, Guide */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* Speed Controls */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded p-0.5">
          <button
            onClick={() => {
              sound.playClick(state.soundEnabled);
              onSetSpeed(0);
            }}
            title="Pause simulation"
            className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
              state.speed === 0
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Pause className="w-3 h-3" />
            <span className="hidden sm:inline text-[11px] font-mono-data">PAUSE</span>
          </button>

          <button
            onClick={() => {
              sound.playClick(state.soundEnabled);
              onSetSpeed(1);
            }}
            title="Normal Speed (1s = 1 Mars Hour)"
            className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
              state.speed === 1
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="w-3 h-3" />
            <span className="text-[11px] font-mono-data">1x</span>
          </button>

          <button
            onClick={() => {
              sound.playClick(state.soundEnabled);
              onSetSpeed(2);
            }}
            title="Fast Forward (0.5s = 1 Mars Hour)"
            className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
              state.speed === 2
                ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/60 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FastForward className="w-3 h-3" />
            <span className="text-[11px] font-mono-data">2x</span>
          </button>
        </div>

        {/* Step 1 Hour Button */}
        <button
          onClick={() => {
            sound.playClick(state.soundEnabled);
            onStepHour();
          }}
          title="Advance 1 Mars Hour"
          className="p-1.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 rounded transition-colors"
        >
          <StepForward className="w-3.5 h-3.5" />
        </button>

        {/* Sound Mute Toggle */}
        <button
          onClick={() => {
            sound.playClick(!state.soundEnabled);
            onToggleSound();
          }}
          title={state.soundEnabled ? 'Mute HUD Audio' : 'Enable HUD Audio'}
          className={`p-1.5 rounded transition-colors ${
            state.soundEnabled
              ? 'bg-slate-900 border border-slate-800 text-cyan-400 hover:border-cyan-500/40'
              : 'bg-slate-900 border border-slate-800 text-slate-600 hover:text-slate-400'
          }`}
        >
          {state.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>

        {/* Mission Guide Manual */}
        <button
          onClick={() => {
            sound.playClick(state.soundEnabled);
            onOpenGuide();
          }}
          title="Mission Manual & Physics Guide"
          className="px-2.5 py-1.5 bg-cyan-950/50 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-900/60 rounded text-xs font-mono-data flex items-center gap-1 transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">TRAINER GUIDE</span>
        </button>

        {/* Reset Simulation */}
        <button
          onClick={() => {
            sound.playClick(state.soundEnabled);
            if (window.confirm('Reset mission simulation to Sol 01?')) {
              onReset();
            }
          }}
          title="Restart Mission Simulation"
          className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/40 rounded transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
