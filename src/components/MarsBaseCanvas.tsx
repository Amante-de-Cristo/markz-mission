import React, { useRef, useEffect, useState } from 'react';
import { SimulationState, SubsystemType } from '../types/simulation';
import { Eye, Shield, Zap, Sparkles, AlertCircle } from 'lucide-react';
import { sound } from '../utils/audio';

interface MarsBaseCanvasProps {
  state: SimulationState;
  onSelectSubsystem: (subsystem: SubsystemType | null) => void;
}

interface DustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

interface Star {
  x: number;
  y: number;
  radius: number;
  twinklePhase: number;
  brightness: number;
}

export const MarsBaseCanvas: React.FC<MarsBaseCanvasProps> = ({ state, onSelectSubsystem }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredSubsystem, setHoveredSubsystem] = useState<SubsystemType | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Persistent particles and stars in ref to avoid reallocation every frame
  const particlesRef = useRef<DustParticle[]>([]);
  const starsRef = useRef<Star[]>([]);
  const roverAnimRef = useRef<{ phase: number; rover1X: number; rover2X: number }>({
    phase: 0,
    rover1X: 0,
    rover2X: 0,
  });

  // Initialize stars once
  useEffect(() => {
    const stars: Star[] = [];
    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random() * 0.55, // upper sky
        radius: 0.5 + Math.random() * 1.5,
        twinklePhase: Math.random() * Math.PI * 2,
        brightness: 0.3 + Math.random() * 0.7,
      });
    }
    starsRef.current = stars;
  }, []);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      // Handle high-DPI
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width;
      const height = rect.height;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // 1. SKY GRADIENT (Day / Night cycle & Tau effect)
      // Hour: 6 to 18 is day, 18 to 6 is night
      const hour = state.hour;
      const isDay = hour >= 6 && hour < 18;
      let dayFactor = 0; // 0 = midnight, 1 = midday (12:00)
      if (isDay) {
        dayFactor = Math.sin(((hour - 6) / 12) * Math.PI);
      }

      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (isDay) {
        // Daytime: Martian butterscotch sky, dimmed heavily by dust tau
        const tauDim = Math.max(0.2, 1 - (state.tau - 0.5) * 0.2);
        const r1 = Math.round(180 * tauDim * (0.4 + 0.6 * dayFactor));
        const g1 = Math.round(110 * tauDim * (0.3 + 0.7 * dayFactor));
        const b1 = Math.round(70 * tauDim * (0.2 + 0.8 * dayFactor));

        const r2 = Math.round(210 * tauDim);
        const g2 = Math.round(140 * tauDim);
        const b2 = Math.round(95 * tauDim);

        skyGrad.addColorStop(0, `rgb(${r1}, ${g1}, ${b1})`);
        skyGrad.addColorStop(0.65, `rgb(${r2}, ${g2}, ${b2})`);
        skyGrad.addColorStop(1, `rgb(160, 75, 45)`);
      } else {
        // Night / Twilight: Martian dusk is bluish due to forward scattering, night is deep space obsidian
        const duskFactor = hour >= 18 && hour < 20 ? 1 - (hour - 18) / 2 : hour >= 4 && hour < 6 ? (hour - 4) / 2 : 0;
        if (duskFactor > 0) {
          // Blue twilight
          skyGrad.addColorStop(0, `rgb(10, 15, 30)`);
          skyGrad.addColorStop(0.6, `rgb(${Math.round(20 + 40 * duskFactor)}, ${Math.round(40 + 60 * duskFactor)}, ${Math.round(70 + 90 * duskFactor)})`);
          skyGrad.addColorStop(1, `rgb(120, 60, 40)`);
        } else {
          // Deep night
          skyGrad.addColorStop(0, '#04060a');
          skyGrad.addColorStop(0.65, '#0a0d18');
          skyGrad.addColorStop(1, '#502015');
        }
      }

      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. STARS & MARTIAN MOONS (Visible at night / twilight)
      if (dayFactor < 0.35) {
        const starOpacity = (1 - dayFactor / 0.35) * Math.max(0.1, 1 - state.tau * 0.3);
        ctx.save();
        starsRef.current.forEach((star) => {
          star.twinklePhase += 0.03;
          const alpha = starOpacity * star.brightness * (0.7 + 0.3 * Math.sin(star.twinklePhase));
          ctx.fillStyle = `rgba(240, 245, 255, ${Math.max(0, alpha)})`;
          ctx.beginPath();
          ctx.arc(star.x * width, star.y * height, star.radius, 0, Math.PI * 2);
          ctx.fill();
        });

        // Phobos Moon (Irregular oblong potato shape)
        const phobosX = (width * 0.75 + (hour * 15)) % width;
        const phobosY = height * 0.18 + Math.sin(hour) * 20;
        ctx.fillStyle = `rgba(220, 215, 205, ${starOpacity * 0.85})`;
        ctx.beginPath();
        ctx.ellipse(phobosX, phobosY, 6, 4.5, 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Deimos Moon (Tiny bright speck)
        const deimosX = (width * 0.28 + (hour * 7)) % width;
        const deimosY = height * 0.12;
        ctx.fillStyle = `rgba(245, 235, 220, ${starOpacity * 0.9})`;
        ctx.beginPath();
        ctx.arc(deimosX, deimosY, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // 3. SUN (During day)
      if (isDay) {
        const sunProgress = (hour - 6) / 12; // 0 at dawn, 0.5 noon, 1 sunset
        const sunX = width * 0.1 + sunProgress * (width * 0.8);
        const sunY = height * 0.55 - Math.sin(sunProgress * Math.PI) * (height * 0.42);

        // Sun size and haze
        const sunGlow = ctx.createRadialGradient(sunX, sunY, 3, sunX, sunY, 45);
        // Martian sun appears smaller and slightly blue-tinged halo
        sunGlow.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        sunGlow.addColorStop(0.3, 'rgba(210, 235, 255, 0.6)');
        sunGlow.addColorStop(1, 'rgba(200, 160, 120, 0)');

        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 45, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sunX, sunY, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. DISTANT CRATER RIM & MOUNT SHARP RIDGELINES
      const horizonY = height * 0.62;

      // Far ridge (Aeolis Mons / Crater wall)
      ctx.fillStyle = isDay ? '#783822' : '#22120e';
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      for (let x = 0; x <= width; x += 30) {
        const hOffset = Math.sin(x * 0.005) * 45 + Math.cos(x * 0.015) * 20;
        ctx.lineTo(x, horizonY - 40 - hOffset);
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      // Mid ridge
      ctx.fillStyle = isDay ? '#964228' : '#2d1612';
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      for (let x = 0; x <= width; x += 25) {
        const hOffset = Math.sin(x * 0.01 + 2) * 28 + Math.cos(x * 0.02) * 12;
        ctx.lineTo(x, horizonY - 15 - hOffset);
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      // Foreground Martian Terrain (Aeolis Palus regolith plain)
      const terrainGrad = ctx.createLinearGradient(0, horizonY, 0, height);
      if (isDay) {
        terrainGrad.addColorStop(0, '#a84c2a');
        terrainGrad.addColorStop(0.5, '#bd5833');
        terrainGrad.addColorStop(1, '#85371c');
      } else {
        terrainGrad.addColorStop(0, '#361914');
        terrainGrad.addColorStop(0.5, '#421f18');
        terrainGrad.addColorStop(1, '#24100c');
      }
      ctx.fillStyle = terrainGrad;
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      // Gentle slope
      ctx.quadraticCurveTo(width * 0.4, horizonY + 10, width, horizonY - 5);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      // Martian rocks & craterlettes
      ctx.fillStyle = isDay ? 'rgba(70, 25, 15, 0.6)' : 'rgba(15, 8, 5, 0.8)';
      ctx.beginPath();
      ctx.ellipse(width * 0.15, horizonY + 35, 18, 6, 0.1, 0, Math.PI * 2);
      ctx.ellipse(width * 0.72, horizonY + 45, 26, 8, -0.05, 0, Math.PI * 2);
      ctx.ellipse(width * 0.88, horizonY + 70, 14, 5, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Base footprint foundation tarmac
      const baseGroundY = height * 0.74;
      ctx.fillStyle = 'rgba(20, 24, 33, 0.75)';
      ctx.beginPath();
      ctx.ellipse(width * 0.5, baseGroundY + 30, width * 0.45, 45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 5. BASE SUBSYSTEM POSITIONS
      // Habitat Dome: Center
      const habCenterX = width * 0.46;
      const habCenterY = baseGroundY;
      const habRadius = Math.min(width * 0.14, 85);

      // Solar Array Grid: Left side
      const solarX = width * 0.18;
      const solarY = baseGroundY - 20;

      // RTG Nuclear Generator: Far Right
      const rtgX = width * 0.78;
      const rtgY = baseGroundY + 5;

      // Battery Bank Module: Near Habitat
      const batX = width * 0.64;
      const batY = baseGroundY + 15;

      // Rover Dock / Position
      const roverDockX = width * 0.32;
      const roverDockY = baseGroundY + 35;

      // ==========================================
      // DRAW SUBSYSTEM 1: SOLAR ARRAY GRID
      // ==========================================
      const isSolarHovered = hoveredSubsystem === 'solar' || state.inspectedSubsystem === 'solar';
      ctx.save();
      if (isSolarHovered) {
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 15;
      }

      // Draw 3 rows of angled solar arrays
      const panels = [
        { x: solarX - 45, y: solarY - 15, w: 55, h: 26 },
        { x: solarX + 20, y: solarY - 15, w: 55, h: 26 },
        { x: solarX - 55, y: solarY + 20, w: 60, h: 28 },
        { x: solarX + 15, y: solarY + 20, w: 60, h: 28 },
      ];

      panels.forEach((p, idx) => {
        // Support pylon
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(p.x + p.w / 2, p.y + p.h);
        ctx.lineTo(p.x + p.w / 2, p.y + p.h + 16);
        ctx.stroke();

        // Base plate
        ctx.fillStyle = '#334155';
        ctx.fillRect(p.x + p.w / 2 - 8, p.y + p.h + 14, 16, 4);

        // Photovoltaic cell surface (Angled parallelogram)
        const tilt = 12;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.w, p.y - tilt);
        ctx.lineTo(p.x + p.w - 10, p.y + p.h - tilt);
        ctx.lineTo(p.x - 10, p.y + p.h);
        ctx.closePath();

        // Silicon cell gradient
        const cellGrad = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y + p.h);
        cellGrad.addColorStop(0, '#0f172a');
        cellGrad.addColorStop(0.5, '#1e3a8a');
        cellGrad.addColorStop(1, '#0284c7');
        ctx.fillStyle = cellGrad;
        ctx.fill();

        // Grid lines on panel
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Panel Dust Layer Overlay!
        if (state.solarDustLayer > 0.01) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.w, p.y - tilt);
          ctx.lineTo(p.x + p.w - 10, p.y + p.h - tilt);
          ctx.lineTo(p.x - 10, p.y + p.h);
          ctx.closePath();

          // Reddish terracotta dust coating
          const dustAlpha = Math.min(0.88, state.solarDustLayer * 0.95);
          ctx.fillStyle = `rgba(180, 75, 45, ${dustAlpha})`;
          ctx.fill();

          // Dust streaks
          ctx.strokeStyle = `rgba(140, 50, 25, ${dustAlpha * 0.7})`;
          ctx.lineWidth = 1;
          for (let s = 0; s < 4; s++) {
            ctx.beginPath();
            ctx.moveTo(p.x + s * 14, p.y + 4);
            ctx.lineTo(p.x + s * 14 + 12, p.y + p.h - 6);
            ctx.stroke();
          }
          ctx.restore();
        }

        // Panel border highlight
        ctx.strokeStyle = isSolarHovered ? '#06b6d4' : 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });

      // Solar label
      ctx.fillStyle = isSolarHovered ? '#38bdf8' : '#94a3b8';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`PV SOLAR [${state.pSolar.toFixed(1)} kW]`, solarX - 10, solarY + 68);
      ctx.restore();

      // ==========================================
      // DRAW SUBSYSTEM 2: RTG NUCLEAR GENERATOR
      // ==========================================
      const isRtgHovered = hoveredSubsystem === 'rtg' || state.inspectedSubsystem === 'rtg';
      ctx.save();
      if (isRtgHovered) {
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 15;
      }

      // Base mount
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(rtgX - 16, rtgY + 22, 32, 8);

      // MMRTG Cylinder Body
      const rtgGrad = ctx.createLinearGradient(rtgX - 12, rtgY, rtgX + 12, rtgY);
      rtgGrad.addColorStop(0, '#334155');
      rtgGrad.addColorStop(0.3, '#94a3b8');
      rtgGrad.addColorStop(0.7, '#64748b');
      rtgGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = rtgGrad;
      ctx.fillRect(rtgX - 12, rtgY - 22, 24, 44);

      // Cooling Fins (Radial fins radiating heat)
      ctx.fillStyle = '#0f172a';
      for (let fin = -18; fin <= 18; fin += 6) {
        ctx.fillRect(rtgX - 16, rtgY + fin, 4, 3);
        ctx.fillRect(rtgX + 12, rtgY + fin, 4, 3);
      }

      // Thermoelectric Radioactive Core Glow (Pu-238 heat source)
      const corePulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.003);
      const rtgGlow = ctx.createRadialGradient(rtgX, rtgY, 2, rtgX, rtgY, 18);
      rtgGlow.addColorStop(0, `rgba(245, 158, 11, ${0.9 * corePulse})`);
      rtgGlow.addColorStop(0.5, `rgba(239, 68, 68, ${0.5 * corePulse})`);
      rtgGlow.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = rtgGlow;
      ctx.beginPath();
      ctx.arc(rtgX, rtgY, 16, 0, Math.PI * 2);
      ctx.fill();

      // Radiation symbol badge
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(rtgX, rtgY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Border and label
      ctx.strokeStyle = isRtgHovered ? '#f59e0b' : '#64748b';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(rtgX - 12, rtgY - 22, 24, 44);

      ctx.fillStyle = isRtgHovered ? '#fbbf24' : '#94a3b8';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`RTG [${state.pRTG} kW]`, rtgX, rtgY + 42);
      ctx.restore();

      // ==========================================
      // DRAW SUBSYSTEM 3: BATTERY STORAGE MODULE
      // ==========================================
      const isBatHovered = hoveredSubsystem === 'battery' || state.inspectedSubsystem === 'battery';
      ctx.save();
      if (isBatHovered) {
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 12;
      }

      // Battery Bank Container
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(batX - 18, batY - 14, 36, 28);
      ctx.strokeStyle = isBatHovered ? '#10b981' : '#334155';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(batX - 18, batY - 14, 36, 28);

      // Battery Cell Charge Bars (4 vertical LEDs)
      const batPct = state.batteryStored / state.batteryMax;
      const numBars = 4;
      const filledBars = Math.round(batPct * numBars);

      for (let b = 0; b < numBars; b++) {
        const bx = batX - 13 + b * 7;
        const by = batY - 8;
        if (b < filledBars) {
          ctx.fillStyle = batPct > 0.35 ? '#10b981' : batPct > 0.15 ? '#f59e0b' : '#ef4444';
        } else {
          ctx.fillStyle = '#1e293b';
        }
        ctx.fillRect(bx, by, 5, 16);
      }

      ctx.fillStyle = isBatHovered ? '#34d399' : '#94a3b8';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`BAT [${state.batteryStored.toFixed(0)}kWh]`, batX, batY + 24);
      ctx.restore();

      // Power Grid Conduits connecting modules to Habitat
      ctx.save();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      // Solar to Habitat
      ctx.beginPath();
      ctx.moveTo(solarX + 40, solarY + 20);
      ctx.lineTo(habCenterX - habRadius * 0.7, habCenterY + 15);
      ctx.stroke();

      // RTG to Habitat
      ctx.beginPath();
      ctx.moveTo(rtgX - 16, rtgY + 10);
      ctx.lineTo(batX + 18, batY);
      ctx.lineTo(habCenterX + habRadius * 0.7, habCenterY + 15);
      ctx.stroke();
      ctx.restore();

      // ==========================================
      // DRAW SUBSYSTEM 4: CENTRAL GEODESIC HABITAT DOME
      // ==========================================
      const isHabHovered = hoveredSubsystem === 'habitat' || state.inspectedSubsystem === 'habitat';
      ctx.save();
      if (isHabHovered) {
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 20;
      }

      // Air Lock Tunnel Module (Front left)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(habCenterX - habRadius - 16, habCenterY - 6, 22, 20);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.strokeRect(habCenterX - habRadius - 16, habCenterY - 6, 22, 20);

      // Airlock Door Hatch
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(habCenterX - habRadius - 5, habCenterY + 4, 6, 0, Math.PI * 2);
      ctx.fill();

      // Dome Outer Base Flange Ring
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.ellipse(habCenterX, habCenterY + 12, habRadius + 8, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Geodesic Dome Hemispherical Body
      // Thermal state coloring:
      // Ideal +20°C -> Warm cyan/golden internal glow
      // Freezing <0°C -> Icy crystalline frosted blue/white
      // Sub -10°C -> Heavy frost crystals and red alarm beacon!
      const habTemp = state.habitatTemp;
      const isFreezing = habTemp < 0;
      const isSub10 = habTemp < -10;

      const domeGrad = ctx.createRadialGradient(
        habCenterX,
        habCenterY - habRadius * 0.35,
        habRadius * 0.1,
        habCenterX,
        habCenterY,
        habRadius
      );

      if (!isFreezing) {
        // Comfortably heated (+15 to +25)
        const warmth = Math.min(1, Math.max(0, (habTemp - 10) / 10));
        domeGrad.addColorStop(0, `rgba(224, 242, 254, 0.95)`);
        domeGrad.addColorStop(0.3, `rgba(56, 189, 248, ${0.75 + 0.15 * warmth})`);
        domeGrad.addColorStop(0.7, `rgba(14, 116, 144, 0.85)`);
        domeGrad.addColorStop(1, `rgba(15, 23, 42, 0.95)`);
      } else if (isSub10) {
        // Hypothermia Hazard (< -10°C)
        const alertFlash = 0.5 + 0.5 * Math.sin(Date.now() * 0.008);
        domeGrad.addColorStop(0, `rgba(255, 255, 255, 0.95)`);
        domeGrad.addColorStop(0.3, `rgba(224, 231, 255, 0.85)`);
        domeGrad.addColorStop(0.7, `rgba(147, 197, 253, 0.8)`);
        domeGrad.addColorStop(1, `rgba(${Math.round(239 * alertFlash)}, 68, 68, 0.9)`);
      } else {
        // Chilly / Freezing (0°C to -10°C)
        domeGrad.addColorStop(0, 'rgba(240, 249, 255, 0.95)');
        domeGrad.addColorStop(0.4, 'rgba(186, 230, 253, 0.85)');
        domeGrad.addColorStop(0.8, 'rgba(56, 189, 248, 0.7)');
        domeGrad.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
      }

      ctx.beginPath();
      ctx.arc(habCenterX, habCenterY + 10, habRadius, Math.PI, 0, false);
      ctx.closePath();
      ctx.fillStyle = domeGrad;
      ctx.fill();

      // Geodesic Triangulation Struts (Hexagonal / Triangular Facet Lines)
      ctx.strokeStyle = isFreezing ? 'rgba(255, 255, 255, 0.7)' : 'rgba(6, 182, 212, 0.6)';
      ctx.lineWidth = 1.2;

      // Latitude concentric rings
      const rings = [0.35, 0.65, 0.88];
      rings.forEach((rScale) => {
        ctx.beginPath();
        ctx.ellipse(
          habCenterX,
          habCenterY + 10 - habRadius * rScale,
          habRadius * Math.cos(Math.asin(rScale)),
          (habRadius * Math.cos(Math.asin(rScale))) * 0.28,
          0,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      });

      // Longitude triangular struts
      for (let angle = Math.PI * 0.15; angle <= Math.PI * 0.85; angle += Math.PI * 0.14) {
        ctx.beginPath();
        ctx.moveTo(habCenterX, habCenterY - habRadius + 10);
        ctx.lineTo(
          habCenterX + Math.cos(angle) * habRadius,
          habCenterY + 10 - Math.sin(angle) * habRadius
        );
        ctx.stroke();
      }

      // Observation Cupola Window at apex
      ctx.fillStyle = isFreezing ? '#e0f2fe' : '#38bdf8';
      ctx.beginPath();
      ctx.ellipse(habCenterX, habCenterY - habRadius + 10, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Warning Strobe Beacon on apex if temperature is critical
      if (isSub10) {
        const strobe = Math.sin(Date.now() * 0.01) > 0;
        ctx.fillStyle = strobe ? '#ef4444' : '#7f1d1d';
        ctx.beginPath();
        ctx.arc(habCenterX, habCenterY - habRadius + 2, 4, 0, Math.PI * 2);
        ctx.fill();
        if (strobe) {
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(habCenterX, habCenterY - habRadius + 2, 10, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Outer rim stroke
      ctx.strokeStyle = isHabHovered ? '#38bdf8' : isFreezing ? '#93c5fd' : '#06b6d4';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Label below Habitat
      ctx.fillStyle = isHabHovered ? '#38bdf8' : '#e2e8f0';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      const tempSign = state.habitatTemp >= 0 ? '+' : '';
      ctx.fillText(
        `HABITAT [${tempSign}${state.habitatTemp.toFixed(1)}°C]`,
        habCenterX,
        habCenterY + 34
      );

      ctx.restore();

      // ==========================================
      // DRAW SUBSYSTEM 5: AUTOMATED CLEANING ROVERS
      // ==========================================
      const isRoverHovered = hoveredSubsystem === 'rovers' || state.inspectedSubsystem === 'rovers';
      ctx.save();
      if (isRoverHovered) {
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 15;
      }

      roverAnimRef.current.phase += 0.04;

      if (state.dustRoversActive) {
        // Rovers deployed: moving across solar panels!
        const rCycle1 = (roverAnimRef.current.phase * 0.8) % 1;
        const rCycle2 = ((roverAnimRef.current.phase * 0.8) + 0.5) % 1;

        // Rover 1 on panel 1-2
        const r1X = solarX - 40 + rCycle1 * 90;
        const r1Y = solarY - 10 + Math.sin(rCycle1 * Math.PI) * 4;

        // Rover 2 on panel 3-4
        const r2X = solarX - 50 + rCycle2 * 90;
        const r2Y = solarY + 25 + Math.sin(rCycle2 * Math.PI) * 4;

        // Draw active sweeping rovers
        [ { x: r1X, y: r1Y, label: 'ROVER-ALPHA' }, { x: r2X, y: r2Y, label: 'ROVER-BETA' } ].forEach((rv) => {
          // Rover body
          ctx.fillStyle = '#06b6d4';
          ctx.fillRect(rv.x - 7, rv.y - 4, 14, 8);
          // Wheels (4 wheels)
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(rv.x - 8, rv.y - 6, 4, 3);
          ctx.fillRect(rv.x + 4, rv.y - 6, 4, 3);
          ctx.fillRect(rv.x - 8, rv.y + 4, 4, 3);
          ctx.fillRect(rv.x + 4, rv.y + 4, 4, 3);

          // Robotic cleaning arm / brush
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(rv.x + 5, rv.y);
          ctx.lineTo(rv.x + 12, rv.y + Math.sin(roverAnimRef.current.phase * 3) * 5);
          ctx.stroke();

          // Particle cleaning sparks / brush fan
          const sparkAngle = roverAnimRef.current.phase * 8;
          ctx.fillStyle = 'rgba(56, 189, 248, 0.8)';
          for (let sp = 0; sp < 3; sp++) {
            const sx = rv.x + 12 + Math.cos(sparkAngle + sp) * 6;
            const sy = rv.y + Math.sin(sparkAngle + sp) * 6;
            ctx.beginPath();
            ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      } else {
        // Rovers parked in Docking Bay
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(roverDockX - 22, roverDockY - 8, 44, 16);
        ctx.strokeStyle = isRoverHovered ? '#06b6d4' : '#334155';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(roverDockX - 22, roverDockY - 8, 44, 16);

        // Parked Rovers (Alpha & Beta)
        [-11, 11].forEach((offsetX) => {
          const rx = roverDockX + offsetX;
          const ry = roverDockY;
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(rx - 5, ry - 3, 10, 6);
          // Wheels
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(rx - 6, ry - 5, 3, 2);
          ctx.fillRect(rx + 3, ry - 5, 3, 2);
          ctx.fillRect(rx - 6, ry + 3, 3, 2);
          ctx.fillRect(rx + 3, ry + 3, 3, 2);
          // Status LED
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(rx, ry, 1.5, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.fillStyle = isRoverHovered ? '#38bdf8' : '#94a3b8';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ROVER BAY [STANDBY]', roverDockX, roverDockY + 20);
      }
      ctx.restore();

      // ==========================================
      // 6. DUST STORM PARTICLE SYSTEM
      // ==========================================
      if (state.tau > 0.8) {
        // Adjust particle density based on tau
        const targetParticles = Math.min(250, Math.round((state.tau - 0.5) * 60));
        while (particlesRef.current.length < targetParticles) {
          particlesRef.current.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: 3 + Math.random() * (state.tau * 3),
            vy: (Math.random() - 0.45) * 1.5,
            size: 1 + Math.random() * 2.5,
            opacity: 0.15 + Math.random() * 0.4,
          });
        }
        if (particlesRef.current.length > targetParticles) {
          particlesRef.current.splice(targetParticles);
        }

        ctx.save();
        ctx.fillStyle = 'rgba(215, 120, 80, 0.7)';
        particlesRef.current.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x > width) p.x = 0;
          if (p.y > height) p.y = Math.random() * height;
          if (p.y < 0) p.y = height;

          // Draw streaking wind grain
          ctx.globalAlpha = p.opacity;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.size * 2, p.size * 0.6, 0.1, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      }

      // ==========================================
      // 7. HUD CROSSHAIR & INSPECT RETICLE OVERLAY
      // ==========================================
      const activeInspect = state.inspectedSubsystem || hoveredSubsystem;
      if (activeInspect) {
        let tx = habCenterX;
        let ty = habCenterY;
        let radius = 60;
        let label = 'HABITAT';

        if (activeInspect === 'solar') {
          tx = solarX;
          ty = solarY + 15;
          radius = 70;
          label = 'SOLAR ARRAY GRID';
        } else if (activeInspect === 'rtg') {
          tx = rtgX;
          ty = rtgY;
          radius = 35;
          label = 'MMRTG GENERATOR';
        } else if (activeInspect === 'battery') {
          tx = batX;
          ty = batY;
          radius = 32;
          label = 'BATTERY STORAGE';
        } else if (activeInspect === 'rovers') {
          tx = roverDockX;
          ty = roverDockY;
          radius = 35;
          label = 'DUST-SWEEPER ROVERS';
        }

        ctx.save();
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([5, 5]);

        // Outer reticle circle
        ctx.beginPath();
        ctx.arc(tx, ty, radius, 0, Math.PI * 2);
        ctx.stroke();

        // 4 Corner brackets
        const cornerSize = 10;
        ctx.setLineDash([]);
        ctx.lineWidth = 2;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(tx - radius, ty - radius + cornerSize);
        ctx.lineTo(tx - radius, ty - radius);
        ctx.lineTo(tx - radius + cornerSize, ty - radius);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(tx + radius - cornerSize, ty - radius);
        ctx.lineTo(tx + radius, ty - radius);
        ctx.lineTo(tx + radius, ty - radius + cornerSize);
        ctx.stroke();
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(tx - radius, ty + radius - cornerSize);
        ctx.lineTo(tx - radius, ty + radius);
        ctx.lineTo(tx - radius + cornerSize, ty + radius);
        ctx.stroke();
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(tx + radius - cornerSize, ty + radius);
        ctx.lineTo(tx + radius, ty + radius);
        ctx.lineTo(tx + radius, ty + radius - cornerSize);
        ctx.stroke();

        // Monospace telemetry tag attached to reticle
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(tx - 65, ty - radius - 24, 130, 18);
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1;
        ctx.strokeRect(tx - 65, ty - radius - 24, 130, 18);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`TARGET: ${label}`, tx, ty - radius - 12);

        ctx.restore();
      }

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [state, hoveredSubsystem]);

  // Mouse Move / Hit Testing
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    const width = rect.width;
    const height = rect.height;
    const baseGroundY = height * 0.74;

    const habCenterX = width * 0.46;
    const habCenterY = baseGroundY;
    const solarX = width * 0.18;
    const solarY = baseGroundY - 20;
    const rtgX = width * 0.78;
    const rtgY = baseGroundY + 5;
    const batX = width * 0.64;
    const batY = baseGroundY + 15;
    const roverDockX = width * 0.32;
    const roverDockY = baseGroundY + 35;

    // Distance checks
    const distHab = Math.hypot(x - habCenterX, y - habCenterY);
    const distSolar = Math.hypot(x - solarX, y - solarY);
    const distRtg = Math.hypot(x - rtgX, y - rtgY);
    const distBat = Math.hypot(x - batX, y - batY);
    const distRover = Math.hypot(x - roverDockX, y - roverDockY);

    if (distHab < 85) {
      setHoveredSubsystem('habitat');
    } else if (distSolar < 75) {
      setHoveredSubsystem('solar');
    } else if (distRtg < 38) {
      setHoveredSubsystem('rtg');
    } else if (distBat < 30) {
      setHoveredSubsystem('battery');
    } else if (distRover < 35 || (state.dustRoversActive && distSolar < 90)) {
      setHoveredSubsystem('rovers');
    } else {
      setHoveredSubsystem(null);
    }
  };

  const handleCanvasClick = () => {
    sound.playClick(state.soundEnabled);
    if (hoveredSubsystem) {
      onSelectSubsystem(hoveredSubsystem === state.inspectedSubsystem ? null : hoveredSubsystem);
    } else {
      onSelectSubsystem(null);
    }
  };

  // Subsystem Diagnostic Details Card
  const renderDiagnosticCard = () => {
    const active = state.inspectedSubsystem || hoveredSubsystem;
    if (!active) return null;

    return (
      <div className="absolute top-3 left-3 z-20 w-72 bg-slate-950/90 border border-cyan-500/50 rounded p-3 backdrop-blur shadow-2xl text-xs font-mono-data select-none animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1.5 mb-2">
          <div className="flex items-center gap-1.5 font-bold text-cyan-300">
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span className="uppercase">DIAGNOSTIC: {active}</span>
          </div>
          <button
            onClick={() => onSelectSubsystem(null)}
            className="text-slate-500 hover:text-slate-300 text-[10px]"
          >
            ✕
          </button>
        </div>

        {active === 'habitat' && (
          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Interior Temp:</span>
              <span className={`font-bold ${state.habitatTemp < 0 ? 'text-red-400' : 'text-cyan-300'}`}>
                {state.habitatTemp >= 0 ? `+${state.habitatTemp.toFixed(1)}` : state.habitatTemp.toFixed(1)}°C
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Target Equilibrium:</span>
              <span className="text-emerald-400">+20.0°C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Heating Required:</span>
              <span className="text-amber-400">{state.qHeatRequired.toFixed(1)} kW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Heating Allocated:</span>
              <span className="text-cyan-400">{state.pThermalAllocated.toFixed(1)} kW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Sub-10°C Exposure:</span>
              <span className={state.consecutiveFreezingHours > 0 ? 'text-red-400 font-bold' : 'text-slate-400'}>
                {state.consecutiveFreezingHours} / 6h max
              </span>
            </div>
          </div>
        )}

        {active === 'solar' && (
          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Current Generation:</span>
              <span className="text-amber-400 font-bold">{state.pSolar.toFixed(1)} kW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Rated Peak Array:</span>
              <span>80.0 kW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Atmospheric Tau:</span>
              <span className="text-amber-300">{state.tau.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Panel Dust Layer:</span>
              <span className={`font-bold ${state.solarDustLayer > 0.4 ? 'text-red-400' : 'text-slate-300'}`}>
                {(state.solarDustLayer * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Overall Efficiency:</span>
              <span className="text-cyan-300 font-bold">{state.solarEfficiency.toFixed(1)}%</span>
            </div>
          </div>
        )}

        {active === 'rtg' && (
          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Generator Model:</span>
              <span>MMRTG Radioisotope</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Power Baseline:</span>
              <span className="text-amber-400 font-bold">15.0 kW (Continuous)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Fuel Pellet:</span>
              <span>Plutonium-238 Dioxide</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Thermoelectric Stat:</span>
              <span className="text-emerald-400 font-semibold">100% NOMINAL</span>
            </div>
          </div>
        )}

        {active === 'battery' && (
          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Energy Reserve:</span>
              <span className={`font-bold ${state.batteryStored < 25 ? 'text-red-400' : 'text-emerald-400'}`}>
                {state.batteryStored.toFixed(1)} / {state.batteryMax} kWh
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Net Flow (P_net):</span>
              <span className={`font-bold ${state.pNet >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {state.pNet >= 0 ? `+${state.pNet.toFixed(1)}` : state.pNet.toFixed(1)} kW
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">State:</span>
              <span className="text-cyan-300">
                {state.pNet >= 0 ? 'CHARGING' : state.batteryStored === 0 ? 'DEPLETED' : 'DISCHARGING'}
              </span>
            </div>
          </div>
        )}

        {active === 'rovers' && (
          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Rover Fleet:</span>
              <span>Sweeper-Alpha & Beta</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Deployment Status:</span>
              <span className={`font-bold ${state.dustRoversActive ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`}>
                {state.dustRoversActive ? `ACTIVE (${state.dustRoversHoursRemaining}h remaining)` : 'DOCKED & READY'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cleaning Efficiency:</span>
              <span>-40% Dust / 3 Hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Dispatch Cost:</span>
              <span>10.0 kWh Battery</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="relative flex-1 h-full bg-slate-950 overflow-hidden flex flex-col select-none">
      {/* HUD Watermark & Subsystem Selection Overlay */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2 text-[10px] font-mono-data text-cyan-400/80 bg-slate-950/80 px-2.5 py-1 border border-cyan-500/30 rounded backdrop-blur">
        <Sparkles className="w-3 h-3 text-cyan-400" />
        <span>INTERACTIVE BASE VIEWPORT // CLICK TO INSPECT</span>
      </div>

      {/* Diagnostic Card Overlay */}
      {renderDiagnosticCard()}

      {/* Main Base Canvas */}
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-crosshair"
      />
    </main>
  );
};
