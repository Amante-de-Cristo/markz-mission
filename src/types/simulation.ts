export type SimulationSpeed = 0 | 1 | 2 | 4;

export type CrewStatus = 'Optimal' | 'Warning' | 'Critical';

export type LogCategory = 'ALL' | 'POWER' | 'THERMAL' | 'WEATHER' | 'ROVERS';

export interface TelemetryLog {
  id: string;
  sol: number;
  timeStr: string;
  category: 'POWER' | 'THERMAL' | 'WEATHER' | 'ROVERS' | 'SYSTEM';
  level: 'info' | 'warn' | 'crit' | 'success';
  message: string;
}

export interface HistoryDataPoint {
  timeLabel: string;
  ambientTemp: number;
  habitatTemp: number;
  tau: number;
  pSolar: number;
  pLoad: number;
  battery: number;
  dustLayer: number;
}

export type SubsystemType = 'habitat' | 'solar' | 'rtg' | 'rovers' | 'battery';

export interface SimulationState {
  // Time
  sol: number;
  hour: number; // 0 to 23.99
  speed: SimulationSpeed;
  isPaused: boolean;

  // Environment (NASA Telemetry)
  ambientTemp: number; // -85°C to -20°C
  tau: number; // 0.5 to 4.5
  solarDustLayer: number; // 0.0 to 1.0 (0% to 100%)
  solarEfficiency: number; // Calculated %

  // Power Generation & Grids
  pSolar: number; // kW
  pRTG: number; // 15 kW constant
  pTotal: number; // kW

  // Power Allocation (Controls)
  pThermalAllocated: number; // kW slider
  pEclssAllocated: number; // kW slider (default 25 kW)
  pAuxAllocated: number; // kW slider
  pLoad: number; // total allocated load
  pNet: number; // pTotal - pLoad

  // Energy Storage
  batteryStored: number; // 0 to 100 kWh
  batteryMax: number; // 100 kWh

  // Habitat Thermal Mechanics
  habitatTemp: number; // Target +20°C
  qHeatRequired: number; // k * (20 - T_ambient)

  // Crew & Systems
  crewHealth: number; // 0% to 100%
  crewMorale: number; // 0% to 100%
  crewStatus: CrewStatus;

  // Hazards & Storms
  dustStormActive: boolean;
  dustStormHoursRemaining: number;
  dustStormSeverity: 'Minor' | 'Moderate' | 'Severe' | 'Global';

  // Mission Actions
  dustRoversActive: boolean;
  dustRoversHoursRemaining: number;
  hibernationMode: boolean;

  // Counters for Win/Loss
  consecutiveFreezingHours: number; // sub -10°C
  consecutiveEclssDepletedHours: number; // unpowered ECLSS at 0 battery

  // NASA Dataset Synchronization
  nasaDatasetMode: 'live_sim' | 'curiosity_rems' | 'perseverance_meda';

  // Game Status
  missionState: 'running' | 'victory' | 'defeat';
  defeatReason: string;

  // Stats for debrief
  stats: {
    totalEnergyGenerated: number; // kWh
    totalDustCleared: number; // %
    stormsWeathered: number;
    roversDispatched: number;
    lowestTempSeen: number;
    highestTauSeen: number;
  };

  // Inspect Subsystem
  inspectedSubsystem: SubsystemType | null;

  // Sound Muted
  soundEnabled: boolean;
}
