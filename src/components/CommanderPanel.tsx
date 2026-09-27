import React, { useState } from 'react';
import { 
  Sliders, 
  Flame, 
  HeartPulse, 
  Cpu, 
  Truck, 
  Moon, 
  Database, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { SimulationState } from '../types/simulation';
import { sound } from '../utils/audio';

interface CommanderPanelProps {
  state: SimulationState;
  onSetThermal: (power: number) => void;
  onSetEclss: (power: number) => void;
  onSetAux: (power: number) => void;
  onDeployRovers: () => void;
  onToggleHibernation: () => void;
  onSelectNasaDataset: (mode: 'live_sim' | 'curiosity_rems' | 'perseverance_meda') => void;
}

export const CommanderPanel: React.FC<CommanderPanelProps> = ({
  state,
  onSetThermal,
  onSetEclss,
  onSetAux,
  onDeployRovers,
  onToggleHibernation,
  onSelectNasaDataset,
}) => {
  const [showNasaModal, setShowNasaModal] = useState(false);

  // Can deploy rovers?
  const canDeployRovers = !state.dustRoversActive && state.batteryStored >= 10;

  // Auto calibrate thermal to match demand
  const handleMatchThermalDemand = () => {
    sound.playClick(state.soundEnabled);
    onSetThermal(state.qHeatRequired);
  };

  // Preset: Eco Mode
  const handleEcoMode = () => {
    sound.playClick(state.soundEnabled);
    onSetThermal(Math.max(10, state.qHeatRequired * 0.7));
    onSetEclss(state.hibernationMode ? 12.5 : 20);
    onSetAux(2);
  };

  // Preset: Max Heat
  const handleMaxHeat = () => {
    sound.playClick(state.soundEnabled);
    onSetThermal(Math.min(70, state.qHeatRequired + 10));
    onSetAux(5);
  };

  return (
    <aside className="w-84 h-full flex flex-col bg-slate-950/70 border-l border-cyan-500/20 text-slate-200 select-none overflow-y-auto hud-scrollbar p-3 space-y-3">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
        <div className="flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold tracking-wider text-cyan-300 font-hud">
            COMMANDER CONTROL PANEL
          </span>
        </div>
        <span className="text-[10px] font-mono-data text-emerald-400 px-1.5 py-0.5 bg-emerald-950/60 border border-emerald-500/30 rounded">
          AUTH: FLIGHT DIR
        </span>
      </div>

      {/* POWER BALANCE SUMMARY HUD */}
      <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded font-mono-data text-xs space-y-2">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-400 uppercase tracking-wider">GRID POWER BALANCE</span>
          <span className={`font-bold ${state.pNet >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            NET {state.pNet >= 0 ? `+${state.pNet.toFixed(1)}` : state.pNet.toFixed(1)} kW
          </span>
        </div>

        {/* Visual generation vs consumption bar */}
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="p-1.5 bg-slate-950/60 rounded border border-amber-500/30">
            <span className="text-slate-400 block">TOTAL SUPPLY</span>
            <span className="text-amber-300 font-bold text-sm">{state.pTotal.toFixed(1)} kW</span>
            <span className="text-[9px] text-slate-500 block">Solar ({state.pSolar.toFixed(1)}) + RTG (15)</span>
          </div>
          <div className="p-1.5 bg-slate-950/60 rounded border border-cyan-500/30">
            <span className="text-slate-400 block">TOTAL LOAD</span>
            <span className="text-cyan-300 font-bold text-sm">{state.pLoad.toFixed(1)} kW</span>
            <span className="text-[9px] text-slate-500 block">Heat + ECLSS + Aux</span>
          </div>
        </div>

        {/* Battery flow indicator */}
        <div className="flex items-center justify-between text-[10px] pt-0.5">
          <span className="text-slate-400">Battery Status ({state.batteryStored.toFixed(1)} / 100 kWh):</span>
          <span className={state.pNet >= 0 ? 'text-emerald-400' : state.batteryStored === 0 ? 'text-red-500 font-bold' : 'text-amber-400'}>
            {state.pNet >= 0 ? '▲ CHARGING' : state.batteryStored === 0 ? '✖ DEPLETED' : '▼ DRAINING'}
          </span>
        </div>
      </div>

      {/* SECTION: RESOURCE ALLOCATION SLIDERS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-[11px] font-mono-data text-slate-400 border-b border-slate-800 pb-1">
          <span>RESOURCE ALLOCATION</span>
          <div className="flex gap-1.5">
            <button
              onClick={handleEcoMode}
              className="text-[9px] px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
            >
              ECO
            </button>
            <button
              onClick={handleMaxHeat}
              className="text-[9px] px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
            >
              WARM
            </button>
          </div>
        </div>

        {/* SLIDER 1: Thermal Heating Grid */}
        <div className="p-2.5 bg-slate-900/50 border border-slate-800/80 rounded space-y-1.5">
          <div className="flex items-center justify-between font-mono-data text-xs">
            <div className="flex items-center gap-1.5 text-amber-400">
              <Flame className="w-3.5 h-3.5" />
              <span className="font-semibold text-slate-200">Thermal Heating Grid</span>
            </div>
            <span className="font-bold text-amber-300">{state.pThermalAllocated.toFixed(1)} kW</span>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono-data text-slate-400">
            <span>
              Required <span className="text-slate-500">(Q<span className="text-[8px]">heat</span> = k·ΔT)</span>:
            </span>
            <span className="text-cyan-300 font-semibold">{state.qHeatRequired.toFixed(1)} kW</span>
          </div>

          <input
            type="range"
            min="0"
            max="70"
            step="0.5"
            value={state.pThermalAllocated}
            onChange={(e) => onSetThermal(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />

          <div className="flex justify-between items-center text-[9px] font-mono-data text-slate-500 pt-0.5">
            <span>0 kW (Off)</span>
            <button
              onClick={handleMatchThermalDemand}
              className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
            >
              [ Match Demand ({state.qHeatRequired.toFixed(1)} kW) ]
            </button>
            <span>70 kW</span>
          </div>
        </div>

        {/* SLIDER 2: ECLSS Life Support */}
        <div className="p-2.5 bg-slate-900/50 border border-slate-800/80 rounded space-y-1.5">
          <div className="flex items-center justify-between font-mono-data text-xs">
            <div className="flex items-center gap-1.5 text-cyan-400">
              <HeartPulse className="w-3.5 h-3.5" />
              <span className="font-semibold text-slate-200">ECLSS Life Support</span>
            </div>
            <span className="font-bold text-cyan-300">{state.pEclssAllocated.toFixed(1)} kW</span>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono-data text-slate-400">
            <span>Nominal Baseline:</span>
            <span className={state.hibernationMode ? 'text-amber-400' : 'text-emerald-400 font-semibold'}>
              {state.hibernationMode ? '12.5 kW (HIBERNATION)' : '25.0 kW (STANDARD)'}
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="40"
            step="0.5"
            value={state.pEclssAllocated}
            onChange={(e) => onSetEclss(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />

          <div className="flex justify-between text-[9px] font-mono-data text-slate-500 pt-0.5">
            <span>0 kW (Hazard)</span>
            <span>25 kW Baseline</span>
            <span>40 kW (Max Oxygen)</span>
          </div>
        </div>

        {/* SLIDER 3: Auxiliary Operations */}
        <div className="p-2.5 bg-slate-900/50 border border-slate-800/80 rounded space-y-1.5">
          <div className="flex items-center justify-between font-mono-data text-xs">
            <div className="flex items-center gap-1.5 text-indigo-400">
              <Cpu className="w-3.5 h-3.5" />
              <span className="font-semibold text-slate-200">Auxiliary Operations</span>
            </div>
            <span className="font-bold text-indigo-300">{state.pAuxAllocated.toFixed(1)} kW</span>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono-data text-slate-400">
            <span>Rover & Lab Systems:</span>
            <span>Science payload + comms</span>
          </div>

          <input
            type="range"
            min="0"
            max="30"
            step="0.5"
            value={state.pAuxAllocated}
            onChange={(e) => onSetAux(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
          />

          <div className="flex justify-between text-[9px] font-mono-data text-slate-500 pt-0.5">
            <span>0 kW</span>
            <span>15 kW</span>
            <span>30 kW</span>
          </div>
        </div>
      </div>

      {/* SECTION: STRATEGIC MISSION ACTIONS */}
      <div className="space-y-2 pt-1 border-t border-slate-800">
        <span className="text-[11px] font-mono-data text-slate-400 uppercase tracking-wider block">
          TACTICAL ACTIONS
        </span>

        {/* Action 1: Deploy Dust Rovers */}
        <button
          onClick={() => {
            sound.playRoverDeploy(state.soundEnabled);
            onDeployRovers();
          }}
          disabled={!canDeployRovers}
          className={`w-full p-2.5 rounded font-mono-data text-xs flex items-center justify-between border transition-all ${
            state.dustRoversActive
              ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300 cursor-not-allowed'
              : canDeployRovers
              ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 hover:border-cyan-400 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.15)]'
              : 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center gap-2 text-left">
            <Truck className={`w-4 h-4 ${state.dustRoversActive ? 'animate-bounce text-cyan-400' : ''}`} />
            <div>
              <div className="font-bold">
                {state.dustRoversActive
                  ? `ROVERS SWEEPING (${state.dustRoversHoursRemaining}h remaining)`
                  : 'DEPLOY DUST ROVERS'}
              </div>
              <div className="text-[10px] text-slate-400">
                -10 kWh Battery · Cleans 40% Panel Dust
              </div>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 opacity-60" />
        </button>

        {/* Action 2: Activate / Deactivate Hibernation Mode */}
        <button
          onClick={() => {
            sound.playClick(state.soundEnabled);
            onToggleHibernation();
          }}
          className={`w-full p-2.5 rounded font-mono-data text-xs flex items-center justify-between border transition-all cursor-pointer ${
            state.hibernationMode
              ? 'bg-amber-950/60 border-amber-500/70 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
              : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center gap-2 text-left">
            <Moon className={`w-4 h-4 ${state.hibernationMode ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
            <div>
              <div className="font-bold">
                {state.hibernationMode ? 'HIBERNATION ACTIVE (50% ECLSS)' : 'ACTIVATE HIBERNATION'}
              </div>
              <div className="text-[10px] text-slate-400">
                {state.hibernationMode
                  ? 'Conserves power · Morale & Health decaying'
                  : 'Reduces ECLSS to 12.5 kW · Saves battery'}
              </div>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${state.hibernationMode ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-slate-800 text-slate-400'}`}>
            {state.hibernationMode ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* Action 3: Sync Real NASA Telemetry */}
        <button
          onClick={() => {
            sound.playClick(state.soundEnabled);
            setShowNasaModal(true);
          }}
          className="w-full p-2.5 rounded font-mono-data text-xs flex items-center justify-between bg-slate-900/60 border border-slate-800 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2 text-left">
            <Database className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="font-bold">SYNC REAL NASA TELEMETRY</div>
              <div className="text-[10px] text-slate-400">
                {state.nasaDatasetMode === 'curiosity_rems'
                  ? 'Current: Gale Crater (Curiosity REMS)'
                  : state.nasaDatasetMode === 'perseverance_meda'
                  ? 'Current: Jezero Sol 215 Dust Storm'
                  : 'Current: Dynamic Live Simulation'}
              </div>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 opacity-60" />
        </button>
      </div>

      {/* NASA DATASET SELECTION MODAL */}
      {showNasaModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-lg max-w-md w-full p-4 font-mono-data text-xs space-y-3 shadow-2xl">
            <div className="flex justify-between items-center border-b border-cyan-500/30 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-cyan-300 text-sm">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>NASA HISTORICAL TELEMETRY SYNC</span>
              </div>
              <button
                onClick={() => setShowNasaModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-300 text-[11px] leading-relaxed">
              Synchronize the simulation engine directly with verified meteorological data streams collected by NASA Mars Exploration rovers:
            </p>

            <div className="space-y-2">
              {/* Option 1: Live Simulation */}
              <button
                onClick={() => {
                  sound.playClick(state.soundEnabled);
                  onSelectNasaDataset('live_sim');
                  setShowNasaModal(false);
                }}
                className={`w-full p-2.5 text-left rounded border transition-colors cursor-pointer ${
                  state.nasaDatasetMode === 'live_sim'
                    ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>1. Live Dynamic Simulator (Standard Mode)</span>
                  {state.nasaDatasetMode === 'live_sim' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Autonomous physics engine with stochastic dust devils and unpredictable storm fronts.
                </div>
              </button>

              {/* Option 2: Curiosity REMS */}
              <button
                onClick={() => {
                  sound.playClick(state.soundEnabled);
                  onSelectNasaDataset('curiosity_rems');
                  setShowNasaModal(false);
                }}
                className={`w-full p-2.5 text-left rounded border transition-colors cursor-pointer ${
                  state.nasaDatasetMode === 'curiosity_rems'
                    ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>2. Curiosity REMS (Gale Crater Telemetry)</span>
                  {state.nasaDatasetMode === 'curiosity_rems' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  High diurnal temperature swings (-85°C to -20°C), atmospheric tau 0.58-0.85, 7.3 hPa surface pressure.
                </div>
              </button>

              {/* Option 3: Perseverance MEDA */}
              <button
                onClick={() => {
                  sound.playClick(state.soundEnabled);
                  onSelectNasaDataset('perseverance_meda');
                  setShowNasaModal(false);
                }}
                className={`w-full p-2.5 text-left rounded border transition-colors cursor-pointer ${
                  state.nasaDatasetMode === 'perseverance_meda'
                    ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>3. Perseverance MEDA (Sol 215 Dust Storm)</span>
                  {state.nasaDatasetMode === 'perseverance_meda' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Severe regional storm event in Jezero Crater where opacity surged to tau 4.45, dimming solar irradiance by 80%.
                </div>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowNasaModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
