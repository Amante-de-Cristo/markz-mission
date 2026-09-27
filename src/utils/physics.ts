import { SimulationState, TelemetryLog } from '../types/simulation';
import { CURIOSITY_GALE_CRATER_DATA, PERSEVERANCE_MEDA_STORM_DATA } from './nasaData';

export const THERMAL_K_COEFF = 0.5; // kW per °C difference
export const TARGET_HABITAT_TEMP = 20; // °C
export const SOLAR_MAX_RATING = 80; // kW
export const RTG_CONSTANT_POWER = 15; // kW
export const BASELINE_ECLSS_POWER = 25; // kW
export const HIBERNATION_ECLSS_POWER = 12.5; // kW (50% reduction)
export const MAX_BATTERY_CAPACITY = 100; // kWh
export const ROVER_BATTERY_COST = 10; // kWh
export const ROVER_CLEAN_DURATION_HOURS = 3; // 3 game hours
export const ROVER_CLEAN_AMOUNT = 0.40; // 40% dust removed

/**
 * Calculates ambient temperature based on time of day (LMST) and weather/tau conditions.
 * Ranges from -20°C (midday 12:00-14:00) down to -85°C (midnight/dawn 03:00-05:00).
 */
export function calculateAmbientTemperature(hour: number, tau: number, profileMin?: number, profileMax?: number): number {
  const minT = profileMin !== undefined ? profileMin : -85;
  const maxT = profileMax !== undefined ? profileMax : -20;

  // Diurnal cycle: peaks around hour 13 (13:00 LMST), troughs around hour 4 (04:00 LMST)
  // Mars day is cold with high diurnal swing (~65°C amplitude in clear sky)
  const angle = ((hour - 4) / 24) * 2 * Math.PI;
  // Normalized 0 to 1
  const diurnalFactor = 0.5 * (1 - Math.cos(angle));

  // During dust storms, high tau creates an atmospheric greenhouse/dust blanket:
  // daytime is cooler due to solar dimming, nighttime is warmer due to trapped infrared.
  const dustBuffering = Math.min(15, (tau - 0.5) * 4);
  const adjustedMin = minT + dustBuffering;
  const adjustedMax = maxT - dustBuffering * 0.7;

  return Math.round((adjustedMin + diurnalFactor * (adjustedMax - adjustedMin)) * 10) / 10;
}

/**
 * Calculates solar power generation:
 * P_solar = 80 kW * e^(-tau) * (1 - Dust Layer) * diurnal_sun_factor
 */
export function calculateSolarPower(hour: number, tau: number, dustLayer: number): { pSolar: number; efficiency: number } {
  // Night hours: 18:00 to 06:00 -> 0 kW
  if (hour < 6 || hour >= 18) {
    const rawEff = Math.max(0, Math.exp(-tau) * (1 - dustLayer) * 100);
    return { pSolar: 0, efficiency: Math.round(rawEff * 10) / 10 };
  }

  // Sun zenith angle factor during 6:00 to 18:00 (peaks at 12:00)
  const sunFraction = (hour - 6) / 12; // 0 at 6h, 0.5 at 12h, 1.0 at 18h
  const sunElevationFactor = Math.sin(sunFraction * Math.PI);

  // Atmospheric transmission via Beer-Lambert extinction: e^(-tau)
  const atmosphericTransmission = Math.exp(-tau);

  // Surface panel dust degradation
  const panelTransmission = Math.max(0, 1 - dustLayer);

  // Total efficiency percentage
  const totalEfficiency = atmosphericTransmission * panelTransmission;

  const pSolar = SOLAR_MAX_RATING * totalEfficiency * sunElevationFactor;

  return {
    pSolar: Math.round(pSolar * 10) / 10,
    efficiency: Math.round(totalEfficiency * 100 * 10) / 10,
  };
}

/**
 * Calculates heating power required for habitat equilibrium at +20°C:
 * Q_heat = k * (20°C - T_ambient)
 */
export function calculateRequiredHeat(ambientTemp: number): number {
  const delta = TARGET_HABITAT_TEMP - ambientTemp;
  return Math.max(0, Math.round(THERMAL_K_COEFF * delta * 10) / 10);
}

/**
 * Generates initial default simulation state
 */
export function getInitialSimulationState(): SimulationState {
  const initialHour = 12.0; // 12:00 LMST midday
  const initialTau = 0.65;
  const initialDustLayer = 0.08; // 8% initial dust
  const ambient = calculateAmbientTemperature(initialHour, initialTau);
  const qHeat = calculateRequiredHeat(ambient);
  const { pSolar, efficiency } = calculateSolarPower(initialHour, initialTau, initialDustLayer);
  const pTotal = pSolar + RTG_CONSTANT_POWER;

  const pThermalAllocated = qHeat;
  const pEclssAllocated = BASELINE_ECLSS_POWER;
  const pAuxAllocated = 5.0;
  const pLoad = pThermalAllocated + pEclssAllocated + pAuxAllocated;
  const pNet = pTotal - pLoad;

  return {
    sol: 1,
    hour: initialHour,
    speed: 1,
    isPaused: false,

    ambientTemp: ambient,
    tau: initialTau,
    solarDustLayer: initialDustLayer,
    solarEfficiency: efficiency,

    pSolar,
    pRTG: RTG_CONSTANT_POWER,
    pTotal,

    pThermalAllocated,
    pEclssAllocated,
    pAuxAllocated,
    pLoad,
    pNet,

    batteryStored: MAX_BATTERY_CAPACITY,
    batteryMax: MAX_BATTERY_CAPACITY,

    habitatTemp: TARGET_HABITAT_TEMP,
    qHeatRequired: qHeat,

    crewHealth: 100,
    crewMorale: 100,
    crewStatus: 'Optimal',

    dustStormActive: false,
    dustStormHoursRemaining: 0,
    dustStormSeverity: 'Minor',

    dustRoversActive: false,
    dustRoversHoursRemaining: 0,
    hibernationMode: false,

    consecutiveFreezingHours: 0,
    consecutiveEclssDepletedHours: 0,

    nasaDatasetMode: 'live_sim',

    missionState: 'running',
    defeatReason: '',

    stats: {
      totalEnergyGenerated: 0,
      totalDustCleared: 0,
      stormsWeathered: 0,
      roversDispatched: 0,
      lowestTempSeen: ambient,
      highestTauSeen: initialTau,
    },

    inspectedSubsystem: null,
    soundEnabled: true,
  };
}

/**
 * Advances the simulation by 1 game hour (invoked on each tick).
 */
export function advanceSimulationOneHour(
  prevState: SimulationState,
  onAudioTrigger?: (type: 'warning' | 'critical' | 'rover' | 'victory') => void
): { nextState: SimulationState; newLogs: TelemetryLog[] } {
  const newLogs: TelemetryLog[] = [];
  const state: SimulationState = JSON.parse(JSON.stringify(prevState));

  // Advance time
  let nextHour = Math.round((state.hour + 1) * 10) / 10;
  let nextSol = state.sol;

  if (nextHour >= 24) {
    nextHour = 0;
    nextSol += 1;
    newLogs.push({
      id: `sol-${nextSol}-${Date.now()}`,
      sol: nextSol,
      timeStr: '00:00 LMST',
      category: 'SYSTEM',
      level: 'info',
      message: `Dawn of Sol ${nextSol}. Life support systems nominal. Habitat telemetry cycle reset.`,
    });
  }

  const timeFormatted = `${String(Math.floor(nextHour)).padStart(2, '0')}:${String(Math.round((nextHour % 1) * 60)).padStart(2, '0')} LMST`;

  // Check victory condition: Survived 30 Sols
  if (nextSol > 30 && state.missionState === 'running') {
    state.missionState = 'victory';
    newLogs.push({
      id: `victory-${Date.now()}`,
      sol: nextSol,
      timeStr: timeFormatted,
      category: 'SYSTEM',
      level: 'success',
      message: 'MISSION SUCCESS: 30 Sols on Mars survived! Habitat systems sustained through all thermal and dust cycles.',
    });
    onAudioTrigger?.('victory');
    return { nextState: state, newLogs };
  }

  // NASA Dataset Synchronization logic
  let profileMin: number | undefined;
  let profileMax: number | undefined;

  if (state.nasaDatasetMode === 'curiosity_rems') {
    const curIdx = (nextSol - 1) % CURIOSITY_GALE_CRATER_DATA.length;
    const profile = CURIOSITY_GALE_CRATER_DATA[curIdx];
    profileMin = profile.minTemp;
    profileMax = profile.maxTemp;
    state.tau = profile.tau;
  } else if (state.nasaDatasetMode === 'perseverance_meda') {
    const medaIdx = (nextSol - 1) % PERSEVERANCE_MEDA_STORM_DATA.length;
    const profile = PERSEVERANCE_MEDA_STORM_DATA[medaIdx];
    profileMin = profile.minTemp;
    profileMax = profile.maxTemp;
    state.tau = profile.tau;
    if (state.tau > 2.0 && !state.dustStormActive) {
      state.dustStormActive = true;
      state.dustStormHoursRemaining = 24;
      state.dustStormSeverity = state.tau > 3.5 ? 'Global' : 'Severe';
    }
  } else {
    // Dynamic Live Sim: Random storm generation
    if (!state.dustStormActive) {
      // Small 3% chance per hour of a new storm starting
      if (Math.random() < 0.035 && nextSol >= 2) {
        state.dustStormActive = true;
        state.dustStormHoursRemaining = Math.floor(12 + Math.random() * 24);
        const roll = Math.random();
        state.dustStormSeverity = roll > 0.7 ? 'Global' : roll > 0.4 ? 'Severe' : 'Moderate';
        state.tau = state.dustStormSeverity === 'Global' ? 4.2 : state.dustStormSeverity === 'Severe' ? 3.2 : 2.2;

        newLogs.push({
          id: `storm-start-${Date.now()}`,
          sol: nextSol,
          timeStr: timeFormatted,
          category: 'WEATHER',
          level: 'warn',
          message: `WEATHER ALERT: ${state.dustStormSeverity} dust storm detected on Doppler LIDAR. Atmospheric opacity tau elevated to ${state.tau.toFixed(2)}.`,
        });
        onAudioTrigger?.('warning');
      } else {
        // Natural small tau drift between 0.50 and 0.85
        const tauDelta = (Math.random() - 0.5) * 0.05;
        state.tau = Math.max(0.5, Math.min(1.1, state.tau + tauDelta));
      }
    } else {
      // Dust storm is currently active
      state.dustStormHoursRemaining -= 1;
      // High tau with fluctuations
      const maxStormTau = state.dustStormSeverity === 'Global' ? 4.5 : 3.4;
      state.tau = Math.min(maxStormTau, Math.max(1.8, state.tau + (Math.random() - 0.48) * 0.15));

      // Dust accumulates on solar panels: 5% per hour during storm!
      const stormDustRate = 0.05;
      state.solarDustLayer = Math.min(1.0, state.solarDustLayer + stormDustRate);

      if (state.dustStormHoursRemaining <= 0) {
        state.dustStormActive = false;
        state.tau = 0.95;
        state.stats.stormsWeathered += 1;
        newLogs.push({
          id: `storm-end-${Date.now()}`,
          sol: nextSol,
          timeStr: timeFormatted,
          category: 'WEATHER',
          level: 'info',
          message: 'WEATHER UPDATE: Dust storm front has subsided. Atmospheric opacity clearing to nominal background.',
        });
      }
    }
  }

  // Normal background dust deposition (0.3% per hour outside of storms)
  if (!state.dustStormActive) {
    state.solarDustLayer = Math.min(1.0, state.solarDustLayer + 0.003);
  }

  // Update Cleaning Rovers if active
  if (state.dustRoversActive) {
    state.dustRoversHoursRemaining -= 1;
    // Clean proportional amount
    const cleanStep = ROVER_CLEAN_AMOUNT / ROVER_CLEAN_DURATION_HOURS;
    const dustBefore = state.solarDustLayer;
    state.solarDustLayer = Math.max(0.02, state.solarDustLayer - cleanStep);
    const dustRemovedPercent = Math.round((dustBefore - state.solarDustLayer) * 100);
    state.stats.totalDustCleared += dustRemovedPercent;

    if (state.dustRoversHoursRemaining <= 0) {
      state.dustRoversActive = false;
      newLogs.push({
        id: `rover-docked-${Date.now()}`,
        sol: nextSol,
        timeStr: timeFormatted,
        category: 'ROVERS',
        level: 'success',
        message: `ROVER MISSION COMPLETE: Cleaning cycle finished. Solar array dust layer reduced to ${(state.solarDustLayer * 100).toFixed(0)}%. Rovers returned to charging dock.`,
      });
      onAudioTrigger?.('rover');
    }
  }

  // Calculate Environment
  state.ambientTemp = calculateAmbientTemperature(nextHour, state.tau, profileMin, profileMax);
  state.qHeatRequired = calculateRequiredHeat(state.ambientTemp);

  // Track extreme stats
  if (state.ambientTemp < state.stats.lowestTempSeen) state.stats.lowestTempSeen = state.ambientTemp;
  if (state.tau > state.stats.highestTauSeen) state.stats.highestTauSeen = state.tau;

  // Calculate Power Generation
  const { pSolar, efficiency } = calculateSolarPower(nextHour, state.tau, state.solarDustLayer);
  state.pSolar = pSolar;
  state.solarEfficiency = efficiency;
  state.pRTG = RTG_CONSTANT_POWER;
  state.pTotal = Math.round((state.pSolar + state.pRTG) * 10) / 10;
  state.stats.totalEnergyGenerated += state.pTotal;

  // Hibernation mode power consumption logic
  const targetEclss = state.hibernationMode ? HIBERNATION_ECLSS_POWER : BASELINE_ECLSS_POWER;
  state.pEclssAllocated = targetEclss;

  // Calculate Total Allocated Load
  state.pLoad = Math.round((state.pThermalAllocated + state.pEclssAllocated + state.pAuxAllocated) * 10) / 10;
  state.pNet = Math.round((state.pTotal - state.pLoad) * 10) / 10;

  // Battery Bank Charging / Discharging
  if (state.pNet >= 0) {
    // Net positive -> charge battery
    state.batteryStored = Math.min(MAX_BATTERY_CAPACITY, state.batteryStored + state.pNet);
  } else {
    // Net negative -> drain battery
    const drain = Math.abs(state.pNet);
    state.batteryStored = Math.max(0, state.batteryStored - drain);
  }
  state.batteryStored = Math.round(state.batteryStored * 10) / 10;

  // System Power Shortage when Battery reaches 0 kWh
  let effectiveThermal = state.pThermalAllocated;
  let effectiveEclss = state.pEclssAllocated;

  if (state.batteryStored === 0 && state.pNet < 0) {
    // Available power is strictly limited to generated power
    const available = state.pTotal;
    // Priority order: ECLSS first, then thermal heating, then aux
    effectiveEclss = Math.min(state.pEclssAllocated, available);
    const remainingForHeat = Math.max(0, available - effectiveEclss);
    effectiveThermal = Math.min(state.pThermalAllocated, remainingForHeat);

    state.consecutiveEclssDepletedHours += 1;
    newLogs.push({
      id: `pwr-crit-${Date.now()}`,
      sol: nextSol,
      timeStr: timeFormatted,
      category: 'POWER',
      level: 'crit',
      message: `POWER CRITICAL: Battery drained to 0.0 kWh! Grid brownout: Thermal and ECLSS constrained to generated power (${state.pTotal.toFixed(1)} kW).`,
    });
    onAudioTrigger?.('critical');
  } else {
    state.consecutiveEclssDepletedHours = 0;
  }

  // Habitat Thermal Mechanics
  // If allocated thermal power < Q_heat, interior drops toward ambient at rate of 5°C/hr
  if (effectiveThermal < state.qHeatRequired) {
    // Deficit ratio
    const deficitRatio = (state.qHeatRequired - effectiveThermal) / (state.qHeatRequired || 1);
    const dropRate = 5.0 * Math.max(0.4, deficitRatio);
    state.habitatTemp = Math.max(state.ambientTemp, Math.round((state.habitatTemp - dropRate) * 10) / 10);

    if (state.habitatTemp < 0) {
      newLogs.push({
        id: `temp-freeze-${Date.now()}`,
        sol: nextSol,
        timeStr: timeFormatted,
        category: 'THERMAL',
        level: 'warn',
        message: `THERMAL WARNING: Habitat interior temperature dropped to ${state.habitatTemp.toFixed(1)}°C. Heating allocation (${effectiveThermal.toFixed(1)} kW) below demand (${state.qHeatRequired.toFixed(1)} kW).`,
      });
      onAudioTrigger?.('warning');
    }
  } else {
    // Thermal power meets or exceeds requirement: warm up toward +20°C
    if (state.habitatTemp < TARGET_HABITAT_TEMP) {
      state.habitatTemp = Math.min(TARGET_HABITAT_TEMP, Math.round((state.habitatTemp + 3.0) * 10) / 10);
    }
  }

  // Freezing condition check (Sub -10°C)
  if (state.habitatTemp < -10) {
    state.consecutiveFreezingHours += 1;
    newLogs.push({
      id: `sub10-${Date.now()}`,
      sol: nextSol,
      timeStr: timeFormatted,
      category: 'THERMAL',
      level: 'crit',
      message: `HABITAT HYPOTHERMIA HAZARD: Interior temp is ${state.habitatTemp.toFixed(1)}°C (< -10°C). Consecutive freezing duration: ${state.consecutiveFreezingHours}/6 hours!`,
    });
    onAudioTrigger?.('critical');
  } else {
    state.consecutiveFreezingHours = 0;
  }

  // Crew Health & Morale updates
  let healthChange = 0;
  let moraleChange = 0;

  // Temperature impact
  if (state.habitatTemp >= 18 && state.habitatTemp <= 23) {
    healthChange += 1; // slow recovery
    moraleChange += 1;
  } else if (state.habitatTemp < 10 && state.habitatTemp >= 0) {
    healthChange -= 1;
    moraleChange -= 2;
  } else if (state.habitatTemp < 0 && state.habitatTemp >= -10) {
    healthChange -= 3;
    moraleChange -= 4;
  } else if (state.habitatTemp < -10) {
    healthChange -= 8;
    moraleChange -= 10;
  }

  // Life support impact
  if (effectiveEclss < BASELINE_ECLSS_POWER * 0.5) {
    healthChange -= 10;
    moraleChange -= 12;
  } else if (state.hibernationMode) {
    // Hibernation saves power at expense of health & morale
    healthChange -= 1.5;
    moraleChange -= 2;
  }

  state.crewHealth = Math.max(0, Math.min(100, Math.round((state.crewHealth + healthChange) * 10) / 10));
  state.crewMorale = Math.max(0, Math.min(100, Math.round((state.crewMorale + moraleChange) * 10) / 10));

  // Crew Status classification
  if (state.crewHealth > 75 && state.habitatTemp > 12) {
    state.crewStatus = 'Optimal';
  } else if (state.crewHealth > 35 && state.habitatTemp > -5) {
    state.crewStatus = 'Warning';
  } else {
    state.crewStatus = 'Critical';
  }

  // Check Loss Conditions:
  // 1. Habitat temp < -10°C for > 6 consecutive hours
  if (state.consecutiveFreezingHours > 6) {
    state.missionState = 'defeat';
    state.defeatReason = `HABITAT HYPOTHERMIA COLLAPSE: Interior temperature remained below -10°C for ${state.consecutiveFreezingHours} consecutive hours. Crew thermal protective suits failed.`;
    newLogs.push({
      id: `fail-temp-${Date.now()}`,
      sol: nextSol,
      timeStr: timeFormatted,
      category: 'SYSTEM',
      level: 'crit',
      message: `MISSION FAILED: ${state.defeatReason}`,
    });
    onAudioTrigger?.('critical');
    return { nextState: state, newLogs };
  }

  // 2. ECLSS unpowered with empty battery for > 4 consecutive hours
  if (state.consecutiveEclssDepletedHours > 4) {
    state.missionState = 'defeat';
    state.defeatReason = 'ECLSS ATMOSPHERE EXHAUSTION: Life support remained unpowered with 0.0 kWh battery reserves for over 4 hours. CO2 scrubbing and oxygenation failed.';
    newLogs.push({
      id: `fail-eclss-${Date.now()}`,
      sol: nextSol,
      timeStr: timeFormatted,
      category: 'SYSTEM',
      level: 'crit',
      message: `MISSION FAILED: ${state.defeatReason}`,
    });
    onAudioTrigger?.('critical');
    return { nextState: state, newLogs };
  }

  // 3. Crew health reaches 0%
  if (state.crewHealth <= 0) {
    state.missionState = 'defeat';
    state.defeatReason = 'CREW CASUALTY: Crew physiological vitals depleted to 0% due to sustained environmental stress.';
    newLogs.push({
      id: `fail-health-${Date.now()}`,
      sol: nextSol,
      timeStr: timeFormatted,
      category: 'SYSTEM',
      level: 'crit',
      message: `MISSION FAILED: ${state.defeatReason}`,
    });
    onAudioTrigger?.('critical');
    return { nextState: state, newLogs };
  }

  state.hour = nextHour;
  state.sol = nextSol;

  return { nextState: state, newLogs };
}
