import React from 'react';
import { Trophy, Award, CheckCircle2, RotateCcw, Zap, Sparkles, ShieldCheck } from 'lucide-react';
import { SimulationState } from '../types/simulation';

interface VictoryModalProps {
  state: SimulationState;
  onRestart: () => void;
  onContinue: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({ state, onRestart, onContinue }) => {
  if (state.missionState !== 'victory') return null;

  // Calculate astronaut rating based on crew health & performance
  const calculateRank = () => {
    if (state.crewHealth >= 85) {
      return { title: 'EXPEDITION COMMANDER // GOLD PIN', grade: 'GRADE: S (EXEMPLARY)', color: 'text-amber-300' };
    }
    if (state.crewHealth >= 60) {
      return { title: 'SENIOR HABITAT FLIGHT ENGINEER', grade: 'GRADE: A (HONORS)', color: 'text-cyan-300' };
    }
    return { title: 'JUNIOR ASTRONAUT SURVIVOR', grade: 'GRADE: B (QUALIFIED)', color: 'text-emerald-300' };
  };

  const rank = calculateRank();

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-950 border-2 border-emerald-500/80 rounded-lg max-w-lg w-full p-6 font-mono-data text-xs space-y-4 shadow-[0_0_50px_rgba(16,185,129,0.3)] select-none animate-in zoom-in-95 duration-200">
        {/* Banner */}
        <div className="flex items-center gap-3 border-b border-emerald-500/40 pb-3">
          <div className="p-2 bg-emerald-950/80 border border-emerald-500 rounded text-emerald-400">
            <Trophy className="w-7 h-7 text-amber-300 animate-bounce" />
          </div>
          <div>
            <h2 className="text-base font-bold text-emerald-400 font-hud tracking-wider">
              MISSION OBJECTIVE ACHIEVED // 30 SOLS SURVIVED
            </h2>
            <span className="text-[10px] text-emerald-300/80">
              NASA SPACE APPS CHALLENGE // MISSION COMPLETION RECORD
            </span>
          </div>
        </div>

        {/* Certification Badge */}
        <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/50 rounded flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <div>
              <div className={`font-bold ${rank.color} text-sm`}>{rank.title}</div>
              <div className="text-[10px] text-slate-400">{rank.grade}</div>
            </div>
          </div>
          <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold rounded">
            CERTIFIED
          </span>
        </div>

        {/* Mission Performance Scorecard */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded">
            <span className="text-slate-400 block text-[10px]">SOLS ENDURED</span>
            <span className="text-emerald-300 font-bold text-base">30 / 30 SOLS</span>
          </div>

          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded">
            <span className="text-slate-400 block text-[10px]">FINAL CREW HEALTH</span>
            <span className="text-emerald-300 font-bold text-base">{state.crewHealth.toFixed(0)}%</span>
          </div>

          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded">
            <span className="text-slate-400 block text-[10px]">TOTAL POWER GENERATED</span>
            <span className="text-amber-300 font-bold text-base">
              {state.stats.totalEnergyGenerated.toFixed(0)} kWh
            </span>
          </div>

          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded">
            <span className="text-slate-400 block text-[10px]">TOTAL DUST MITIGATED</span>
            <span className="text-cyan-300 font-bold text-base">
              {state.stats.totalDustCleared}% Cleared
            </span>
          </div>
        </div>

        {/* Commendation citation */}
        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded text-[11px] text-slate-300 space-y-1">
          <span className="text-cyan-400 font-semibold uppercase block">Flight Director Commendation:</span>
          <p>
            Congratulations, Commander! You skillfully balanced thermal heating demands against nighttime lows, weathered severe dust storms without losing habitat pressurization, and successfully maintained life support across an entire Martian month. Your data will shape future human exploration missions to Mars!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex justify-end gap-2">
          <button
            onClick={onContinue}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold cursor-pointer transition-colors"
          >
            EXTENDED EXPLORATION
          </button>
          <button
            onClick={onRestart}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-lg"
          >
            <RotateCcw className="w-4 h-4" />
            <span>NEW MISSION RUN</span>
          </button>
        </div>
      </div>
    </div>
  );
};
