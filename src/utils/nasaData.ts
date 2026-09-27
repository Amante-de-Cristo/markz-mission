/**
 * NASA Planetary Telemetry Datasets for Mars Simulation
 * Sources:
 * - Curiosity REMS (Rover Environmental Monitoring Station) at Gale Crater
 * - Perseverance MEDA (Mars Environmental Dynamics Analyzer) at Jezero Crater
 */

export interface NasaSolProfile {
  sol: number;
  mission: 'Curiosity REMS' | 'Perseverance MEDA';
  location: string;
  minTemp: number; // °C
  maxTemp: number; // °C
  tau: number;     // Atmospheric opacity
  pressure: number; // hPa
  uvIndex: number;
  description: string;
}

export const CURIOSITY_GALE_CRATER_DATA: NasaSolProfile[] = [
  { sol: 1, mission: 'Curiosity REMS', location: 'Gale Crater (-4.59° S, 137.44° E)', minTemp: -82, maxTemp: -22, tau: 0.62, pressure: 7.4, uvIndex: 8.5, description: 'Clear Gale Crater sky with standard diurnal thermal swing.' },
  { sol: 2, mission: 'Curiosity REMS', location: 'Gale Crater', minTemp: -84, maxTemp: -24, tau: 0.58, pressure: 7.3, uvIndex: 8.9, description: 'Low dust opacity, high UV radiation penetration.' },
  { sol: 3, mission: 'Curiosity REMS', location: 'Gale Crater', minTemp: -80, maxTemp: -20, tau: 0.65, pressure: 7.5, uvIndex: 8.2, description: 'Mild thermal wind breezes down Mount Sharp slope.' },
  { sol: 4, mission: 'Curiosity REMS', location: 'Gale Crater', minTemp: -86, maxTemp: -26, tau: 0.70, pressure: 7.2, uvIndex: 7.8, description: 'Cold night drop with carbon dioxide micro-frost at dawn.' },
  { sol: 5, mission: 'Curiosity REMS', location: 'Gale Crater', minTemp: -79, maxTemp: -19, tau: 0.85, pressure: 7.6, uvIndex: 7.1, description: 'Localized dust devil tracks crossing the plains.' },
];

export const PERSEVERANCE_MEDA_STORM_DATA: NasaSolProfile[] = [
  { sol: 215, mission: 'Perseverance MEDA', location: 'Jezero Crater (18.38° N, 77.58° E)', minTemp: -78, maxTemp: -25, tau: 1.10, pressure: 6.2, uvIndex: 6.4, description: 'Early storm precursors detected. Wind gusts reaching 22 m/s.' },
  { sol: 216, mission: 'Perseverance MEDA', location: 'Jezero Crater', minTemp: -72, maxTemp: -32, tau: 2.30, pressure: 6.0, uvIndex: 3.8, description: 'Regional storm expansion. Direct sunlight attenuated by 75%.' },
  { sol: 217, mission: 'Perseverance MEDA', location: 'Jezero Crater', minTemp: -68, maxTemp: -38, tau: 3.90, pressure: 5.9, uvIndex: 1.9, description: 'Peak dust veil. Greenhouse trapping narrows diurnal swing.' },
  { sol: 218, mission: 'Perseverance MEDA', location: 'Jezero Crater', minTemp: -65, maxTemp: -41, tau: 4.45, pressure: 5.8, uvIndex: 1.1, description: 'Severe opacity storm event. Solar arrays heavily occluded.' },
  { sol: 219, mission: 'Perseverance MEDA', location: 'Jezero Crater', minTemp: -70, maxTemp: -35, tau: 3.10, pressure: 6.1, uvIndex: 2.6, description: 'Dust fallout settling gradually; heavy panel layer.' },
  { sol: 220, mission: 'Perseverance MEDA', location: 'Jezero Crater', minTemp: -76, maxTemp: -29, tau: 1.80, pressure: 6.3, uvIndex: 4.5, description: 'Atmosphere clearing, but residual panel dust persists.' },
];
