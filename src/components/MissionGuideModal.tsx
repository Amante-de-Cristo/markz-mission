import React from 'react';
import { BookOpen, Thermometer, Sun, Zap, Shield, HeartPulse, CheckCircle2, Award, X } from 'lucide-react';

interface MissionGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MissionGuideModal: React.FC<MissionGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-cyan-500/50 rounded-lg max-w-2xl w-full max-h-[88vh] flex flex-col font-mono-data text-xs shadow-2xl select-none">
        {/* Modal Header */}
        <div className="p-4 border-b border-cyan-500/30 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-sm text-cyan-300 font-hud">
              JUNIOR ASTRONAUT MISSION TRAINER // FLIGHT MANUAL
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Handbook Content */}
        <div className="flex-1 overflow-y-auto hud-scrollbar p-5 space-y-4 text-slate-300 leading-relaxed">
          {/* Objective */}
          <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded">
            <h3 className="font-bold text-cyan-300 uppercase mb-1 flex items-center gap-1.5 text-xs">
              <Award className="w-3.5 h-3.5 text-cyan-400" />
              Primary Mission Directive (30 Sols)
            </h3>
            <p className="text-[11px] text-slate-300">
              Welcome Junior Flight Director to the <strong>Ares Shield Mars Habitat</strong> at Gale Crater. Your mission is to maintain thermal equilibrium, manage power balance across solar arrays and RTG systems, mitigate Martian dust storms, and ensure crew survival across <strong>30 consecutive Martian Sols</strong>.
            </p>
          </div>

          {/* Section 1: Martian Thermal Dynamics */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded space-y-1.5">
            <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-amber-400" />
              1. Martian Thermal Mechanics: Q_heat = k · (20°C - T_ambient)
            </h4>
            <p className="text-[11px] text-slate-300">
              Mars has an ultra-thin atmosphere (6.1 hPa, less than 1% of Earth's pressure), resulting in extreme diurnal temperature swings from <strong>-20°C at noon down to -85°C before dawn</strong>.
            </p>
            <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-1 pl-1">
              <li>Target Habitat Temperature is <strong>+20.0°C</strong>.</li>
              <li>Required heating scales with cold: Q_heat = 0.5 × (20°C - T_ambient). At -85°C, you need <strong>52.5 kW</strong> of heating power.</li>
              <li>If allocated thermal power is less than $Q_{'{'}heat{'}'}$, habitat temperature drops at <strong>5°C per hour</strong>.</li>
              <li><strong>CRITICAL HAZARD:</strong> If habitat temp remains below <strong>-10°C for &gt;6 consecutive hours</strong>, hypothermia triggers mission failure.</li>
            </ul>
          </div>

          {/* Section 2: Solar Dust & Beer-Lambert Law */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded space-y-1.5">
            <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              2. Solar Power & Atmospheric Opacity (Tau / τ)
            </h4>
            <p className="text-[11px] text-slate-300">
              Solar power generation obeys: <span className="text-amber-200">P_solar = 80 kW · e^(-τ) · (1 - Dust Layer)</span>.
            </p>
            <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-1 pl-1">
              <li>Night hours (18:00 to 06:00 LMST) yield <strong>0 kW</strong> solar power. Store enough battery reserves before dusk!</li>
              <li>Atmospheric opacity ($\tau$) rises from 0.5 (clear) up to 4.5 during global dust storms, blocking over 85% of sunlight.</li>
              <li>Dust accumulates on solar panels at <strong>5% per hour</strong> during storms. Use <strong>Deploy Dust Rovers</strong> to remove 40% dust (costs 10 kWh).</li>
            </ul>
          </div>

          {/* Section 3: RTG & Battery Grid */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded space-y-1.5">
            <h4 className="font-bold text-emerald-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              3. RTG Generator & Battery Bank
            </h4>
            <p className="text-[11px] text-slate-300">
              The Multi-Mission Radioisotope Thermoelectric Generator (MMRTG) delivers a steady, unwavering <strong>15.0 kW baseline power</strong> 24 hours a day, unaffected by night or dust storms.
            </p>
            <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-1 pl-1">
              <li>Battery Bank capacity is <strong>100 kWh</strong>.</li>
              <li>When generation exceeds load ($P_{'{'}net{'}'} &gt; 0$), the battery charges.</li>
              <li>When generation falls short, battery drains. If battery reaches <strong>0.0 kWh</strong>, grid brownout occurs, cutting life support and heating!</li>
            </ul>
          </div>

          {/* Section 4: Life Support & Hibernation */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded space-y-1.5">
            <h4 className="font-bold text-cyan-300 flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-cyan-400" />
              4. ECLSS Life Support & Hibernation Mode
            </h4>
            <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-1 pl-1">
              <li>Standard ECLSS requires <strong>25.0 kW</strong> for oxygen generation and carbon dioxide scrubbing.</li>
              <li><strong>Hibernation Mode:</strong> Cuts ECLSS load by 50% down to <strong>12.5 kW</strong>, critical to survive severe multi-sol storms. Use caution: prolonged hibernation gradually degrades crew morale and health!</li>
              <li>If life support remains unpowered for <strong>&gt;4 hours</strong> at 0 kWh battery, atmosphere failure ends the mission.</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-cyan-500/30 flex justify-end bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold cursor-pointer transition-colors shadow-lg"
          >
            Acknowledge & Return to Station
          </button>
        </div>
      </div>
    </div>
  );
};
