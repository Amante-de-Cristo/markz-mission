import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  SimulationState, 
  SimulationSpeed, 
  HistoryDataPoint, 
  TelemetryLog, 
  SubsystemType 
} from './types/simulation';
import { 
  getInitialSimulationState, 
  advanceSimulationOneHour, 
  BASELINE_ECLSS_POWER,
  HIBERNATION_ECLSS_POWER,
  ROVER_BATTERY_COST,
  ROVER_CLEAN_DURATION_HOURS
} from './utils/physics';
import { sound } from './utils/audio';
import { HeaderBar } from './components/HeaderBar';
import { EnvironmentalPanel } from './components/EnvironmentalPanel';
import { MarsBaseCanvas } from './components/MarsBaseCanvas';
import { CommanderPanel } from './components/CommanderPanel';
import { BottomConsole } from './components/BottomConsole';
import { MissionGuideModal } from './components/MissionGuideModal';
import { GameOverModal } from './components/GameOverModal';
import { VictoryModal } from './components/VictoryModal';

export default function App() {
  const [state, setState] = useState<SimulationState>(() => getInitialSimulationState());
  const [history, setHistory] = useState<HistoryDataPoint[]>([]);
  const [logs, setLogs] = useState<TelemetryLog[]>(() => [
    {
      id: 'init-1',
      sol: 1,
      timeStr: '12:00 LMST',
      category: 'SYSTEM',
      level: 'info',
      message: 'ARES SHIELD MISSION TRAINER INITIALIZED. Subsystems verified at Gale Crater.',
    },
    {
      id: 'init-2',
      sol: 1,
      timeStr: '12:00 LMST',
      category: 'POWER',
      level: 'info',
      message: 'MMRTG radioisotope generator delivering steady 15.0 kW baseline. Photovoltaic grid online.',
    },
    {
      id: 'init-3',
      sol: 1,
      timeStr: '12:00 LMST',
      category: 'THERMAL',
      level: 'info',
      message: 'Habitat thermal grid calibrated at +20.0°C. Target equilibrium sustained.',
    },
  ]);

  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Audio trigger helper
  const handleAudioTrigger = useCallback((type: 'warning' | 'critical' | 'rover' | 'victory') => {
    if (!state.soundEnabled) return;
    if (type === 'warning') sound.playWarning(true);
    else if (type === 'critical') sound.playCriticalAlarm(true);
    else if (type === 'rover') sound.playRoverDeploy(true);
    else if (type === 'victory') sound.playVictory(true);
  }, [state.soundEnabled]);

  // Audio storm ambience update
  useEffect(() => {
    sound.updateStormAmbience(state.dustStormActive, state.tau, state.soundEnabled);
  }, [state.dustStormActive, state.tau, state.soundEnabled]);

  // Record history point
  const recordHistory = useCallback((curr: SimulationState) => {
    const timeFormatted = `${String(Math.floor(curr.hour)).padStart(2, '0')}:00`;
    setHistory((prev) => {
      const next = [
        ...prev,
        {
          timeLabel: timeFormatted,
          ambientTemp: curr.ambientTemp,
          habitatTemp: curr.habitatTemp,
          tau: curr.tau,
          pSolar: curr.pSolar,
          pLoad: curr.pLoad,
          battery: curr.batteryStored,
          dustLayer: curr.solarDustLayer,
        },
      ];
      // Keep last 30 hours of telemetry
      return next.slice(-30);
    });
  }, []);

  // Tick simulation once
  const tick = useCallback(() => {
    setState((prev) => {
      if (prev.missionState !== 'running') return prev;
      const { nextState, newLogs } = advanceSimulationOneHour(prev, handleAudioTrigger);
      if (newLogs.length > 0) {
        setLogs((currentLogs) => [...currentLogs, ...newLogs].slice(-150));
      }
      recordHistory(nextState);
      return nextState;
    });
  }, [handleAudioTrigger, recordHistory]);

  // Initialize initial history data point
  useEffect(() => {
    recordHistory(state);
  }, []);

  // Simulation Tick Loop Timer
  useEffect(() => {
    if (state.speed === 0 || state.missionState !== 'running') return;

    // Speed calculation: 1x = 1000ms, 2x = 500ms
    const intervalMs = state.speed === 1 ? 1000 : 500;
    const interval = setInterval(() => {
      tick();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [state.speed, state.missionState, tick]);

  // Handler: Set Speed
  const handleSetSpeed = (newSpeed: SimulationSpeed) => {
    setState((prev) => ({ ...prev, speed: newSpeed }));
  };

  // Handler: Step 1 Hour Manually
  const handleStepHour = () => {
    tick();
  };

  // Handler: Sound Toggle
  const handleToggleSound = () => {
    setState((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  };

  // Handler: Thermal Slider
  const handleSetThermal = (power: number) => {
    setState((prev) => {
      const pThermal = Math.round(power * 10) / 10;
      const pLoad = Math.round((pThermal + prev.pEclssAllocated + prev.pAuxAllocated) * 10) / 10;
      const pNet = Math.round((prev.pTotal - pLoad) * 10) / 10;
      return {
        ...prev,
        pThermalAllocated: pThermal,
        pLoad,
        pNet,
      };
    });
  };

  // Handler: ECLSS Slider
  const handleSetEclss = (power: number) => {
    setState((prev) => {
      const pEclss = Math.round(power * 10) / 10;
      const pLoad = Math.round((prev.pThermalAllocated + pEclss + prev.pAuxAllocated) * 10) / 10;
      const pNet = Math.round((prev.pTotal - pLoad) * 10) / 10;
      return {
        ...prev,
        pEclssAllocated: pEclss,
        pLoad,
        pNet,
      };
    });
  };

  // Handler: Aux Slider
  const handleSetAux = (power: number) => {
    setState((prev) => {
      const pAux = Math.round(power * 10) / 10;
      const pLoad = Math.round((prev.pThermalAllocated + prev.pEclssAllocated + pAux) * 10) / 10;
      const pNet = Math.round((prev.pTotal - pLoad) * 10) / 10;
      return {
        ...prev,
        pAuxAllocated: pAux,
        pLoad,
        pNet,
      };
    });
  };

  // Handler: Deploy Dust Rovers
  const handleDeployRovers = () => {
    if (state.dustRoversActive || state.batteryStored < ROVER_BATTERY_COST) return;

    setState((prev) => {
      const newBattery = Math.max(0, prev.batteryStored - ROVER_BATTERY_COST);
      const updatedStats = { ...prev.stats, roversDispatched: prev.stats.roversDispatched + 1 };
      return {
        ...prev,
        batteryStored: newBattery,
        dustRoversActive: true,
        dustRoversHoursRemaining: ROVER_CLEAN_DURATION_HOURS,
        stats: updatedStats,
      };
    });

    const timeFormatted = `${String(Math.floor(state.hour)).padStart(2, '0')}:${String(Math.round((state.hour % 1) * 60)).padStart(2, '0')} LMST`;
    setLogs((prev) => [
      ...prev,
      {
        id: `rover-deploy-${Date.now()}`,
        sol: state.sol,
        timeStr: timeFormatted,
        category: 'ROVERS',
        level: 'info',
        message: 'DEPLOYMENT CONFIRMED: Automated dust cleaning rovers Alpha & Beta dispatched to PV Solar Array Grid (-10.0 kWh battery).',
      },
    ]);
  };

  // Handler: Toggle Hibernation
  const handleToggleHibernation = () => {
    setState((prev) => {
      const nextHib = !prev.hibernationMode;
      const targetEclss = nextHib ? HIBERNATION_ECLSS_POWER : BASELINE_ECLSS_POWER;
      const pLoad = Math.round((prev.pThermalAllocated + targetEclss + prev.pAuxAllocated) * 10) / 10;
      const pNet = Math.round((prev.pTotal - pLoad) * 10) / 10;
      return {
        ...prev,
        hibernationMode: nextHib,
        pEclssAllocated: targetEclss,
        pLoad,
        pNet,
      };
    });

    const timeFormatted = `${String(Math.floor(state.hour)).padStart(2, '0')}:${String(Math.round((state.hour % 1) * 60)).padStart(2, '0')} LMST`;
    setLogs((prev) => [
      ...prev,
      {
        id: `hib-toggle-${Date.now()}`,
        sol: state.sol,
        timeStr: timeFormatted,
        category: 'POWER',
        level: state.hibernationMode ? 'info' : 'warn',
        message: !state.hibernationMode
          ? 'HIBERNATION MODE ENGAGED: ECLSS life support load reduced by 50% (12.5 kW). Power conserved. Crew vitals monitor active.'
          : 'HIBERNATION MODE DEACTIVATED: Full ECLSS oxygenation and atmospheric recycling restored (25.0 kW baseline).',
      },
    ]);
  };

  // Handler: Select NASA Dataset
  const handleSelectNasaDataset = (mode: 'live_sim' | 'curiosity_rems' | 'perseverance_meda') => {
    setState((prev) => ({
      ...prev,
      nasaDatasetMode: mode,
    }));

    const timeFormatted = `${String(Math.floor(state.hour)).padStart(2, '0')}:${String(Math.round((state.hour % 1) * 60)).padStart(2, '0')} LMST`;
    const label = mode === 'curiosity_rems'
      ? 'Curiosity Gale Crater REMS Dataset'
      : mode === 'perseverance_meda'
      ? 'Perseverance Jezero Crater MEDA Sol 215 Dust Storm Dataset'
      : 'Autonomous Dynamic Live Simulation Engine';

    setLogs((prev) => [
      ...prev,
      {
        id: `nasa-sync-${Date.now()}`,
        sol: state.sol,
        timeStr: timeFormatted,
        category: 'WEATHER',
        level: 'info',
        message: `TELEMETRY SYNCED: Environment loop bound to [${label}].`,
      },
    ]);
  };

  // Handler: Select Subsystem for Inspection
  const handleSelectSubsystem = (subsystem: SubsystemType | null) => {
    setState((prev) => ({ ...prev, inspectedSubsystem: subsystem }));
  };

  // Handler: Clear Logs
  const handleClearLogs = () => {
    setLogs([]);
  };

  // Handler: Reset Simulation
  const handleResetSimulation = () => {
    const fresh = getInitialSimulationState();
    setState(fresh);
    setHistory([]);
    setLogs([
      {
        id: `reset-${Date.now()}`,
        sol: 1,
        timeStr: '12:00 LMST',
        category: 'SYSTEM',
        level: 'info',
        message: 'MISSION RESET: Simulation restarted at Sol 01, 12:00 LMST. Subsystems re-initialized.',
      },
    ]);
  };

  // Handler: Continue Extended Mission after Sol 30 victory
  const handleContinueExtended = () => {
    setState((prev) => ({
      ...prev,
      missionState: 'running',
    }));
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-950 font-sans text-slate-100 hud-grid-pattern">
      {/* 1. TOP HEADER CONTROL BAR */}
      <HeaderBar
        state={state}
        onSetSpeed={handleSetSpeed}
        onStepHour={handleStepHour}
        onToggleSound={handleToggleSound}
        onOpenGuide={() => setIsGuideOpen(true)}
        onReset={handleResetSimulation}
      />

      {/* 2. MAIN 3-COLUMN WORKSPACE: LEFT (TELEMETRY) | CENTER (CANVAS) | RIGHT (CONTROLS) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel: NASA Environmental Telemetry */}
        <EnvironmentalPanel
          state={state}
          history={history}
        />

        {/* Center Panel: Interactive Mars Base Canvas Viewport */}
        <MarsBaseCanvas
          state={state}
          onSelectSubsystem={handleSelectSubsystem}
        />

        {/* Right Panel: Mission Commander Control Panel */}
        <CommanderPanel
          state={state}
          onSetThermal={handleSetThermal}
          onSetEclss={handleSetEclss}
          onSetAux={handleSetAux}
          onDeployRovers={handleDeployRovers}
          onToggleHibernation={handleToggleHibernation}
          onSelectNasaDataset={handleSelectNasaDataset}
        />
      </div>

      {/* 3. BOTTOM TELEMETRY CONSOLE */}
      <BottomConsole
        logs={logs}
        onClearLogs={handleClearLogs}
      />

      {/* 4. MODALS */}
      {/* Mission Guide & Training Handbook */}
      <MissionGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Game Over Failure Debrief */}
      <GameOverModal
        state={state}
        onRestart={handleResetSimulation}
      />

      {/* Victory Celebration Debrief */}
      <VictoryModal
        state={state}
        onRestart={handleResetSimulation}
        onContinue={handleContinueExtended}
      />
    </div>
  );
}
