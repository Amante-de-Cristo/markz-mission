import React from 'react';
import { AlertOctagon, RotateCcw, Activity, Thermometer, Zap, ShieldAlert } from 'lucide-react';
import { SimulationState } from '../types/simulation';

interface GameOverModalProps {
  state: SimulationState;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ state, onRestart }) => {
  if (state.missionState !== 'defeat') return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-950 border-2 border-red-500/80 rounded-lg max-w-lg w-full p-6 font-mono-data text-xs space-y-4 shadow-[0_0_50px_rgba(239,68,68,0.3)] select-none animate-in zoom-in-95 duration-200">
        {/* Banner */}
        <div className="flex items-center gap-3 border-b border-red-500/40 pb-3">
          <div className="p-2 bg-red-950/80 border border-red-500 rounded text-red-400">
            <AlertOctagon className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-red-400 font-hud tracking-wider">
              MISSION CRITICAL FAILURE // HABITAT EVACUATION
            </h2>
            <span className="text-[10px] text-red-300/80">
              NASA MISSION ARCHIVE REPORT // SOL {state.sol}
            </span>
          </div>
        </div>

        {/* Cause of Failure Breakdown */}
        <div className="p-3.5 bg-red-950/40 border border-red-500/50 rounded space-y-2">
          <span className="text-red-400 font-bold uppercase text-[11px] block">
            OFFICIAL INCIDENT INVESTIGATION:
          </span>
          <p className="text-slate-200 text-xs leading-relaxed font-semibold">
            {state.defeatReason || 'Habitat environmental containment breached.'}
          </p>
        </div>

        {/* Telemetry Snapshot at Failure */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2 bg-slate-900 border border-slate-800 rounded">
            <span className="text-slate-400 block text-[10px]">SOLS SURVIVED</span>
            <span className="text-cyan-300 font-bold text-base">
              Sol {state.sol} <span className="text-xs text-slate-500 font-normal">/ 30</span>
            </span>
          </div>

          <div className="p-2 bg-slate-900 border border-slate-800 rounded">
            <span className="text-slate-400 block text-[10px]">FINAL HABITAT TEMP</span>
            <span className="text-red-400 font-bold text-base">
              {state.habitatTemp >= 0 ? `+${state.habitatTemp.toFixed(1)}` : state.habitatTemp.toFixed(1)}°C
            </span>
          </div>

          <div className="p-2 bg-slate-900 border border-slate-800 rounded">
            <span className="text-slate-400 block text-[10px]">FINAL BATTERY RESERVE</span>
            <span className="text-amber-300 font-bold text-base">
              {state.batteryStored.toFixed(1)} kWh
            </span>
          </div>

          <div className="p-2 bg-slate-900 border border-slate-800 rounded">
            <span className="text-slate-400 block text-[10px]">FINAL CREW VITALS</span>
            <span className="text-red-400 font-bold text-base">
              {state.crewHealth.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Debrief Recommendation for Trainee */}
        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded text-[11px] text-slate-300 space-y-1">
          <span className="text-cyan-400 font-semibold uppercase block">Flight Director Guidance:</span>
          <p>
            {state.defeatReason.includes('HYPOTHERMIA')
              ? 'Recommendation: Prioritize thermal heating during Mars night (18:00 to 06:00 LMST). When ambient temp hits -85°C, heating demand peaks at ~52 kW. Ensure battery reserves are banked during daytime solar peaks.'
              : state.defeatReason.includes('ECLSS')
              ? 'Recommendation: When battery approaches 0 kWh, switch ECLSS to Hibernation Mode immediately to halve power draw down to 12.5 kW, and deploy rovers to clean solar panels to restore power collection.'
              : 'Recommendation: Monitor crew vitals closely. Subzero habitat conditions rapidly erode crew health. Keep heating grid calibrated to match demand.'}
          </p>
        </div>

        {/* Restart Action */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onRestart}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-lg"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART MISSION (SOL 01)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
