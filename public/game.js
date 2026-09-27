/**
 * Ares Architect: NASA Mars Habitat Simulator
 * Core JavaScript Simulation Engine, Architecture Selector, Physics Loop,
 * Quiz Troubleshooter, and AI Gemini Cadet Assistant
 * NASA Space Apps Challenge - Junior Astronaut Mission Trainer
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. AUDIO & SOUND FX MANAGER (WITH SYNTHESIZER FALLBACK)
  // =========================================================================
  class AudioManager {
    constructor() {
      this.masterEnabled = true;
      this.musicVolume = 0.5;
      this.sfxVolume = 0.8;

      this.playlist = [
        { file: '/audio/bg_music1.mp3', name: 'Track 1: bg_music1.mp3 (Ambient Martian Synth)' },
        { file: '/audio/bg_music2.mp3', name: 'Track 2: bg_music2.mp3 (High-Energy Sci-Fi Action)' }
      ];
      this.currentTrackIndex = 0;

      this.activeMusicAudio = new Audio(this.playlist[0].file);
      this.setupMusicEndedHandler();

      this.audioClick = new Audio('/audio/click.mp3');
      this.audioRover = new Audio('/audio/rover.mp3');
      this.audioAlarm = new Audio('/audio/alarm.mp3');
      this.audioVictory = new Audio('/audio/victory.mp3');

      // Web Audio API Synthesizer Fallback
      this.ctx = null;
      this.synthOscs = [];
      this.synthMusicGain = null;
      this.isSynthPlaying = false;
      this.musicTimer = null;
    }

    initContext() {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) this.ctx = new AudioContextClass();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    setupMusicEndedHandler() {
      this.activeMusicAudio.onended = () => {
        this.nextTrack();
      };
    }

    nextTrack() {
      this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
      this.playCurrentTrack();
    }

    playCurrentTrack() {
      if (!this.masterEnabled) return;
      this.initContext();

      const trackInfo = this.playlist[this.currentTrackIndex];
      const displayEl = document.getElementById('active-track-name');
      if (displayEl) displayEl.textContent = trackInfo.name;

      this.activeMusicAudio.pause();
      this.activeMusicAudio = new Audio(trackInfo.file);
      this.activeMusicAudio.volume = this.musicVolume;
      this.setupMusicEndedHandler();

      const p = this.activeMusicAudio.play();
      if (p) {
        p.catch(() => this.startSynthMusic());
      } else {
        this.startSynthMusic();
      }
    }

    stopMusic() {
      if (this.activeMusicAudio) this.activeMusicAudio.pause();
      this.stopSynthMusic();
    }

    setMusicVolume(vol) {
      this.musicVolume = Math.max(0, Math.min(1, vol));
      if (this.activeMusicAudio) this.activeMusicAudio.volume = this.musicVolume;
      if (this.synthMusicGain && this.ctx) {
        this.synthMusicGain.gain.setValueAtTime(0.04 * this.musicVolume, this.ctx.currentTime);
      }
    }

    setSfxVolume(vol) {
      this.sfxVolume = Math.max(0, Math.min(1, vol));
      this.audioClick.volume = this.sfxVolume;
      this.audioRover.volume = this.sfxVolume;
      this.audioAlarm.volume = this.sfxVolume;
      this.audioVictory.volume = this.sfxVolume;
    }

    setMasterEnabled(enabled) {
      this.masterEnabled = enabled;
      if (!enabled) {
        this.stopMusic();
      } else {
        this.playCurrentTrack();
      }
    }

    playClick() {
      if (!this.masterEnabled || this.sfxVolume <= 0) return;
      this.initContext();
      this.audioClick.currentTime = 0;
      this.audioClick.volume = this.sfxVolume;
      const p = this.audioClick.play();
      if (p) p.catch(() => this.synthClick());
      else this.synthClick();
    }

    synthClick() {
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1800, this.ctx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.08 * this.sfxVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
      } catch (e) {}
    }

    playAlarm() {
      if (!this.masterEnabled || this.sfxVolume <= 0) return;
      this.initContext();
      this.audioAlarm.currentTime = 0;
      this.audioAlarm.volume = this.sfxVolume;
      const p = this.audioAlarm.play();
      if (p) p.catch(() => this.synthAlarm());
      else this.synthAlarm();
    }

    synthAlarm() {
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(587, now + 0.12);
        gain.gain.setValueAtTime(0.12 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      } catch (e) {}
    }

    playQuizSuccess() {
      if (!this.masterEnabled || this.sfxVolume <= 0) return;
      this.initContext();
      if (!this.ctx) return;
      try {
        const notes = [587.33, 739.99, 880, 1174.66];
        const now = this.ctx.currentTime;
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const t = now + idx * 0.08;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.1 * this.sfxVolume, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.26);
        });
      } catch (e) {}
    }

    playVictory() {
      if (!this.masterEnabled || this.sfxVolume <= 0) return;
      this.initContext();
      this.audioVictory.currentTime = 0;
      this.audioVictory.volume = this.sfxVolume;
      const p = this.audioVictory.play();
      if (p) p.catch(() => this.synthVictory());
      else this.synthVictory();
    }

    synthVictory() {
      if (!this.ctx) return;
      try {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        const now = this.ctx.currentTime;
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const t = now + idx * 0.12;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.14 * this.sfxVolume, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.45);
        });
      } catch (e) {}
    }

    startSynthMusic() {
      if (this.isSynthPlaying || !this.ctx || !this.masterEnabled) return;
      this.isSynthPlaying = true;
      this.synthMusicGain = this.ctx.createGain();
      this.synthMusicGain.gain.setValueAtTime(0.04 * this.musicVolume, this.ctx.currentTime);
      this.synthMusicGain.connect(this.ctx.destination);

      const chords = [
        [220, 261.63, 329.63],
        [196, 246.94, 293.66],
        [174.61, 220, 261.63],
        [220, 293.66, 349.23]
      ];
      let chordIdx = 0;

      const playNextChord = () => {
        if (!this.isSynthPlaying || !this.ctx) return;
        this.synthOscs.forEach((o) => {
          try { o.stop(); o.disconnect(); } catch (e) {}
        });
        this.synthOscs = [];

        const currentChord = chords[chordIdx % chords.length];
        chordIdx++;

        currentChord.forEach((freq) => {
          const osc = this.ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          osc.connect(this.synthMusicGain);
          osc.start();
          this.synthOscs.push(osc);
        });

        this.musicTimer = setTimeout(playNextChord, 3500);
      };

      playNextChord();
    }

    stopSynthMusic() {
      this.isSynthPlaying = false;
      if (this.musicTimer) clearTimeout(this.musicTimer);
      this.synthOscs.forEach((o) => {
        try { o.stop(); o.disconnect(); } catch (e) {}
      });
      this.synthOscs = [];
    }
  }

  const audio = new AudioManager();

  // =========================================================================
  // 2. HABITAT ARCHITECTURES & MISSION CONFIGURATION STATE
  // =========================================================================
  const ARCHITECTURES = {
    metallic: {
      id: 'metallic',
      name: 'Rigid Metallic Modular Modules',
      cost: 800, // Millions
      mass: 60, // Tons
      thermalK: 0.55, // Thermal loss coefficient kW/°C
      radShielding: 0.50, // 50% cosmic ray transmission
      punctureRisk: 0.05, // low micrometeoroid puncture risk
      description: 'Flight-proven aluminum-lithium alloy pressure vessel derived from ISS heritage modules.'
    },
    inflatable: {
      id: 'inflatable',
      name: 'Inflatable TransHab Aerogel Domes',
      cost: 1500, // Millions
      mass: 25, // Tons
      thermalK: 0.28, // Superior insulation
      radShielding: 0.20, // Hydrogen-rich polymers absorb rays
      punctureRisk: 0.25, // Higher puncture risk without regolith berm
      description: 'Multi-layer Kevlar & Nextel expandable bladder with aerogel core.'
    },
    regolith: {
      id: 'regolith',
      name: '3D-Printed Regolith Shell Base',
      cost: 2800, // Millions
      mass: 15, // Tons Earth transit
      thermalK: 0.18, // 2-meter thick basalt thermal mass
      radShielding: 0.02, // 98% cosmic ray absorption
      punctureRisk: 0.01, // Impervious
      description: 'Autonomous robotic rovers sinter 2m basalt catenary arches over a lava tube.'
    }
  };

  const config = {
    budget: 2500, // Millions ($)
    massLimit: 50, // Metric Tons
    crewSize: 4, // Astronauts
    targetSols: 180, // Planned duration Sols
    selectedArch: 'inflatable'
  };

  const simState = {
    sol: 1,
    hour: 10.0,
    speed: 1, // 0 = pause, 1 = 1x, 5 = 5x, 30 = 30x
    isPaused: false,
    active: false,

    // Environmental Telemetry
    ambientTemp: -25.0,
    tau: 0.65,
    dustOnPanels: 0.06, // fraction 0 to 1
    season: 'Northern Autumn',

    // Power Grid
    pSolar: 45.0,
    pRTG: 30.0,
    pThermalNeeded: 12.0,
    pEclss: 15.0,
    pTotalLoad: 27.0,
    pNet: 48.0,
    battery: 300.0,
    batteryMax: 300.0,

    // Base Integrity & Crew Health
    habTemp: 20.0,
    crewHealth: 100.0,
    radDoseRate: 0.62, // mSv/day
    totalRadiationDose: 0.0, // mSv cumulative

    // Disaster & Quiz
    activeHazard: null,
    hazardHoursRemaining: 0,
    quizTriggered: false,
    quizzesSolved: 0,
    quizzesTotal: 0,

    // Outcome
    survivedSols: 0,
    failureReason: null
  };

  let simTimer = null;

  // =========================================================================
  // 3. DISASTER QUIZ QUESTIONS ENGINE (NASA SCIENCE FOR 12+)
  // =========================================================================
  const QUIZ_EVENTS = [
    {
      type: 'dust_storm',
      icon: '🌪️',
      title: 'GLOBAL DUST STORM HIT (TAU = 4.5)',
      desc: 'Suspended airborne regolith dust is absorbing 92% of sunlight across Jezero Crater. Solar arrays have collapsed from 45 kW to 6 kW while thermal heaters demand 38 kW.',
      question: 'Solar panel output has collapsed due to airborne dust. What corrective action should Mission Control order?',
      options: [
        {
          text: 'Rely on 30 kW RTG nuclear baseline, engage battery reserve, and deploy autonomous cleaner bots.',
          correct: true,
          explanation: 'CORRECT! NASA Curiosity and Perseverance utilize RTG nuclear power specifically because radioactive decay of Plutonium-238 operates 100% independent of sunlight.'
        },
        {
          text: 'Increase photovoltaic inverter voltage to force electricity through dust layers.',
          correct: false,
          explanation: 'INCORRECT: Inverters transform existing DC power; increasing voltage without solar photons causes an electrical short circuit and blows circuit breakers.'
        },
        {
          text: 'Turn off crew ECLSS oxygen and carbon dioxide scrubbers to conserve battery.',
          correct: false,
          explanation: 'INCORRECT: Shutting down ECLSS causes toxic CO2 buildup within 4 hours, endangering crew lives!'
        }
      ]
    },
    {
      type: 'polar_vortex',
      icon: '❄️',
      title: 'MARTIAN POLAR VORTEX (-110°C)',
      desc: 'Freezing carbon dioxide ice clouds have swept from the polar cap. Ambient exterior temperatures have plummeted to -110°C, quadrupling thermal conductivity loss through the hull.',
      question: 'Rapid thermal loss threatens to freeze habitat air and water loops. How should the base maintain equilibrium?',
      options: [
        {
          text: 'Vent 50% of habitat air to lower the mass of gas that needs to be heated.',
          correct: false,
          explanation: 'INCORRECT: Lowering pressure risks explosive decompression and crew hypoxia.'
        },
        {
          text: 'Deploy exterior aerogel thermal shutters and pulse secondary isotope heaters to stabilize +20°C.',
          correct: true,
          explanation: 'CORRECT! NASA aerogel blankets offer thermal conductivity of just 0.015 W/m·K, creating a thermal barrier that stops exterior radiative freeze.'
        },
        {
          text: 'Pour water over the dome so it freezes and forms an insulating ice blanket.',
          correct: false,
          explanation: 'INCORRECT: In Mars near-vacuum (610 Pa), liquid water immediately sublimates into vapor or causes thermal shock fracturing.'
        }
      ]
    },
    {
      type: 'eclss_filter',
      icon: '☣️',
      title: 'ECLSS CO2 SCRUBBER CONTAMINATION',
      desc: 'Fine particulate dust penetrated the external atmospheric intake port, clogging the primary zeolite sorption bed. Cabin CO2 levels are rising toward 1.5% partial pressure.',
      question: 'Elevated CO2 threatens crew cognitive function. What is the correct aerospace life support protocol?',
      options: [
        {
          text: 'Bypass primary zeolite bed, activate secondary catalytic oxidizer loop, and purge filter with dry nitrogen reserve.',
          correct: true,
          explanation: 'CORRECT! Standard ISS/Orion ECLSS design incorporates parallel redundant sorption beds to allow in-line filter back-flushing without suffocating the crew.'
        },
        {
          text: 'Open the airlock doors for 30 seconds to flush out the stale cabin air into Mars.',
          correct: false,
          explanation: 'INCORRECT: Mars atmosphere is 95% poisonous carbon dioxide at 0.6% Earth pressure—opening the door would kill the crew instantly.'
        },
        {
          text: 'Instruct the crew to hyperventilate to expel excess carbon dioxide.',
          correct: false,
          explanation: 'INCORRECT: Rapid breathing accelerates oxygen depletion and increases carbon dioxide production in the cabin.'
        }
      ]
    },
    {
      type: 'solar_flare',
      icon: '⚡',
      title: 'SOLAR PROTON RADIATION SURGE (CME)',
      desc: 'A coronal mass ejection from the Sun is hurling billions of tons of high-energy protons directly toward Mars. The unshielded surface radiation rate has spiked to 12.0 mSv/day.',
      question: 'Extreme solar radiation threatens acute radiation sickness. Where should the crew take shelter?',
      options: [
        {
          text: 'Ascend to the upper cupola observatory to monitor the aurora light display.',
          correct: false,
          explanation: 'INCORRECT: Upper viewing ports lack heavy shielding and expose astronauts to lethal solar particle events.'
        },
        {
          text: 'Retreat into central storm shelter lined by water storage tanks and regolith bulkheads.',
          correct: true,
          explanation: 'CORRECT! Hydrogen-rich materials like water (H2O) and thick regolith are the best shields against ionizing protons because light atomic nuclei stop high-speed protons efficiently.'
        },
        {
          text: 'Step outside in extravehicular spacesuits to place solar panels directly in the proton path.',
          correct: false,
          explanation: 'INCORRECT: Spacesuits provide minimal radiation shielding; EVA during a solar flare is strictly prohibited by NASA flight safety rules.'
        }
      ]
    }
  ];

  function triggerQuiz(quiz) {
    simState.activeHazard = quiz.type;
    simState.quizTriggered = true;
    simState.isPaused = true;
    audio.playAlarm();

    document.getElementById('quiz-hazard-icon').textContent = quiz.icon;
    document.getElementById('quiz-hazard-title').textContent = quiz.title;
    document.getElementById('quiz-hazard-desc').textContent = quiz.desc;
    document.getElementById('quiz-question-text').textContent = quiz.question;

    const optContainer = document.getElementById('quiz-options-container');
    optContainer.innerHTML = '';

    const feedbackBox = document.getElementById('quiz-feedback-box');
    feedbackBox.className = 'hidden p-3 rounded-xl text-xs space-y-1';
    feedbackBox.innerHTML = '';

    const resumeBtn = document.getElementById('btn-quiz-resume');
    resumeBtn.classList.add('hidden');

    quiz.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'w-full text-left p-3 rounded-xl border border-slate-700 bg-slate-800 hover:border-cyan-400 hover:bg-slate-750 text-slate-200 text-xs transition-colors cursor-pointer flex items-start gap-2.5';
      btn.innerHTML = `<span class="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-bold text-[10px] text-cyan-400 font-mono-data">${String.fromCharCode(65 + idx)}</span> <span class="leading-relaxed flex-1">${opt.text}</span>`;
      
      btn.addEventListener('click', () => {
        // Disable all option buttons
        optContainer.querySelectorAll('button').forEach((b) => (b.disabled = true));

        feedbackBox.classList.remove('hidden');
        simState.quizzesTotal += 1;

        if (opt.correct) {
          audio.playQuizSuccess();
          simState.quizzesSolved += 1;
          btn.className = 'w-full text-left p-3 rounded-xl border-2 border-emerald-500 bg-emerald-950/70 text-emerald-200 text-xs flex items-start gap-2.5';
          feedbackBox.className = 'p-3 rounded-xl text-xs space-y-1 bg-emerald-950/80 border border-emerald-500/50 text-emerald-200';
          feedbackBox.innerHTML = `<div class="font-bold font-hud uppercase tracking-wider text-emerald-300">✓ NASA ENGINEERING CORRECT:</div><p class="leading-relaxed">${opt.explanation}</p><span class="text-[10px] text-emerald-400 block pt-1 font-bold">+100 Mission Accuracy Score Awarded! System integrity preserved.</span>`;
        } else {
          audio.playAlarm();
          btn.className = 'w-full text-left p-3 rounded-xl border-2 border-rose-500 bg-rose-950/70 text-rose-200 text-xs flex items-start gap-2.5';
          feedbackBox.className = 'p-3 rounded-xl text-xs space-y-1 bg-rose-950/80 border border-rose-500/50 text-rose-200';
          feedbackBox.innerHTML = `<div class="font-bold font-hud uppercase tracking-wider text-rose-300">✕ PROTOCOL ERROR:</div><p class="leading-relaxed">${opt.explanation}</p><span class="text-[10px] text-rose-400 block pt-1 font-bold">Crew health and system resilience penalized by -5%.</span>`;
          simState.crewHealth = Math.max(10, simState.crewHealth - 5);
        }

        resumeBtn.classList.remove('hidden');
        updateSimHUD();
      });

      optContainer.appendChild(btn);
    });

    document.getElementById('modal-quiz').classList.remove('hidden');
  }

  // =========================================================================
  // 4. SIMULATION PHYSICS ENGINE & FAST-FORWARD ANALYTICS
  // =========================================================================
  function getMarsSeason(sol) {
    const orbitalSol = sol % 668;
    if (orbitalSol < 167) return { name: 'Northern Spring', icon: '🌱' };
    if (orbitalSol < 334) return { name: 'Northern Summer (Aphelion)', icon: '☀️' };
    if (orbitalSol < 501) return { name: 'Northern Autumn', icon: '🍂' };
    return { name: 'Northern Winter (Perihelion Dust)', icon: '🌪️' };
  }

  function advanceSimHour() {
    if (!simState.active || simState.isPaused) return;

    simState.hour += 1.0;
    if (simState.hour >= 24.0) {
      simState.hour = 0.0;
      simState.sol += 1;
      simState.survivedSols = simState.sol;

      // Check mission target completion
      if (simState.sol > config.targetSols) {
        completeMission(true, `Successfully sustained crew operations across planned ${config.targetSols}-Sol expedition!`);
        return;
      }
    }

    const arch = ARCHITECTURES[config.selectedArch];
    const season = getMarsSeason(simState.sol);
    simState.season = season.name;

    // Diurnal Day/Night Cycle (05:00 to 20:00 = daylight)
    const isDay = simState.hour >= 5.0 && simState.hour < 20.0;

    // Ambient Exterior Temperature
    let baseWarm = -20;
    let baseCold = -85;
    if (simState.activeHazard === 'polar_vortex') {
      baseCold = -110;
      baseWarm = -60;
    }

    if (isDay) {
      const sunAngle = Math.sin(((simState.hour - 5.0) / 15.0) * Math.PI);
      simState.ambientTemp = baseWarm - (1 - sunAngle) * (baseWarm - baseCold) * 0.4;
    } else {
      const nightProgress = simState.hour >= 20.0 ? (simState.hour - 20.0) / 9.0 : (simState.hour + 4.0) / 9.0;
      const chillFactor = Math.sin(nightProgress * Math.PI);
      simState.ambientTemp = baseCold - chillFactor * 8.0;
    }

    // Solar Generation
    simState.tau = simState.activeHazard === 'dust_storm' ? 4.5 : 0.65;
    if (isDay) {
      const dayProgress = (simState.hour - 5.0) / 15.0;
      const solarFlux = Math.sin(dayProgress * Math.PI);
      const opticalTransmission = Math.exp(-simState.tau * 0.45);
      const cleanFactor = Math.max(0.08, 1 - simState.dustOnPanels);
      simState.pSolar = 55.0 * solarFlux * opticalTransmission * cleanFactor;
    } else {
      simState.pSolar = 0.0;
    }

    // RTG Baseline Power
    simState.pRTG = 30.0;

    // Habitat Thermal Power Demand Q_heat = k * (20 - T_ambient)
    simState.pThermalNeeded = Math.max(0, arch.thermalK * (20.0 - simState.ambientTemp));

    // ECLSS Life Support Demand: 5 kW base + 2.5 kW per astronaut
    simState.pEclss = 5.0 + config.crewSize * 2.5;

    // Total Power Load
    simState.pTotalLoad = simState.pThermalNeeded + simState.pEclss;
    const pGenerated = simState.pSolar + simState.pRTG;
    simState.pNet = pGenerated - simState.pTotalLoad;

    // Battery Bank Storage
    simState.battery += simState.pNet * 0.5;
    if (simState.battery > simState.batteryMax) simState.battery = simState.batteryMax;

    // Thermal Equilibrium of Habitat
    if (simState.battery <= 0) {
      simState.battery = 0;
      simState.habTemp = Math.max(-40, simState.habTemp - 2.5);
      simState.crewHealth -= 4.0;
      logSimAlert('CRITICAL: Battery empty! Heating offline, habitat cooling!');
    } else {
      simState.habTemp = 20.0;
      if (simState.crewHealth < 100) simState.crewHealth = Math.min(100, simState.crewHealth + 0.5);
    }

    // Radiation Accumulation
    simState.radDoseRate = 0.65 * arch.radShielding * (simState.activeHazard === 'solar_flare' ? 8.0 : 1.0);
    simState.totalRadiationDose += simState.radDoseRate / 24.0;

    // Dust buildup on panels
    if (simState.activeHazard === 'dust_storm') {
      simState.dustOnPanels = Math.min(0.92, simState.dustOnPanels + 0.03);
    } else {
      simState.dustOnPanels = Math.min(0.85, simState.dustOnPanels + 0.002);
    }

    // Automatic rovers cleaning if battery allows
    if (simState.battery > 50 && simState.dustOnPanels > 0.25) {
      simState.dustOnPanels = Math.max(0.05, simState.dustOnPanels - 0.08);
      simState.battery -= 2;
    }

    // Disaster Chance Trigger
    if (!simState.activeHazard && Math.random() < 0.02) {
      const q = QUIZ_EVENTS[Math.floor(Math.random() * QUIZ_EVENTS.length)];
      triggerQuiz(q);
      return;
    }

    // Health Failure
    if (simState.crewHealth <= 0) {
      completeMission(false, 'Catastrophic life support failure: crew health dropped to 0% from sustained freeze and power exhaustion.');
      return;
    }

    updateSimHUD();
  }

  function startSimLoop() {
    if (simTimer) clearInterval(simTimer);
    if (!simState.active || simState.isPaused || simState.speed === 0) return;

    let delayMs = 1000;
    if (simState.speed === 5) delayMs = 200;
    if (simState.speed === 30) delayMs = 35;

    simTimer = setInterval(advanceSimHour, delayMs);
  }

  function runFastForwardResult() {
    audio.playClick();
    const arch = ARCHITECTURES[config.selectedArch];

    // Engineering analytical calculation
    let maxSol = config.targetSols;
    let finalCrewHealth = 100;
    let success = true;
    let reason = '';

    // Check payload mass constraint
    if (arch.mass > config.massLimit) {
      maxSol = Math.round(config.targetSols * 0.35);
      finalCrewHealth = 0;
      success = false;
      reason = `Payload launch mass (${arch.mass} Tons) exceeded rocket lift capacity (${config.massLimit} Tons). Essential redundant life support was left on Earth!`;
    }
    // Check budget constraint
    else if (arch.cost > config.budget) {
      maxSol = Math.round(config.targetSols * 0.55);
      finalCrewHealth = 20;
      success = false;
      reason = `Habitat CAPEX ($${arch.cost}M) exceeded budget ($${config.budget}M). Severe funding deficits led to uncertified life support spares.`;
    }
    // Deep duration checks
    else if (config.targetSols >= 1825 && arch.id === 'metallic') {
      maxSol = 920;
      finalCrewHealth = 40;
      success = false;
      reason = 'Rigid metallic modules lacked expandable volume for 5-year crew psychological well-being and accumulated cumulative solar radiation.';
    } else {
      maxSol = config.targetSols;
      finalCrewHealth = arch.id === 'regolith' ? 98 : arch.id === 'inflatable' ? 92 : 88;
      success = true;
      reason = `Optimal engineering synthesis! The ${arch.name} architecture met all payload mass, budget, thermal insulation, and ECLSS life support safety thresholds.`;
    }

    simState.survivedSols = maxSol;
    simState.crewHealth = finalCrewHealth;
    completeMission(success, reason);
  }

  function completeMission(success, reason) {
    simState.active = false;
    if (simTimer) clearInterval(simTimer);

    if (success) audio.playVictory();
    else audio.playAlarm();

    // Fill Report Screen
    document.getElementById('report-title').textContent = success
      ? `MISSION ACCOMPLISHED: ${simState.survivedSols} SOLS COMPLETED`
      : `EXPEDITION TERMINATED AT SOL ${simState.survivedSols}`;
    document.getElementById('report-title').className = success
      ? 'text-3xl sm:text-4xl font-extrabold text-emerald-400 font-hud'
      : 'text-3xl sm:text-4xl font-extrabold text-rose-400 font-hud';

    document.getElementById('report-status-badge').className = success
      ? 'inline-flex items-center gap-2 px-3 py-1 bg-emerald-950/80 border border-emerald-500/50 rounded-full text-emerald-300 text-xs font-mono-data'
      : 'inline-flex items-center gap-2 px-3 py-1 bg-rose-950/80 border border-rose-500/50 rounded-full text-rose-300 text-xs font-mono-data';
    document.getElementById('report-status-badge').innerHTML = success
      ? '<span>🏆 EXPEDITION OBJECTIVES SATISFIED</span>'
      : '<span>⚠️ CRITICAL EXPEDITION POST-MORTEM</span>';

    document.getElementById('rep-sols').textContent = `${simState.survivedSols} Sols`;
    const pct = Math.min(100, Math.round((simState.survivedSols / config.targetSols) * 100));
    document.getElementById('rep-sols-pct').textContent = `${pct}% of ${config.targetSols}-Sol Goal`;

    document.getElementById('rep-crew').textContent = `${Math.round(simState.crewHealth)}%`;
    const quizPct = simState.quizzesTotal === 0 ? 100 : Math.round((simState.quizzesSolved / simState.quizzesTotal) * 100);
    document.getElementById('rep-quiz').textContent = `${quizPct}%`;

    let grade = 'GRADE A+';
    if (!success || pct < 70) grade = 'GRADE C-';
    else if (pct < 100) grade = 'GRADE B+';
    document.getElementById('rep-grade').textContent = grade;

    document.getElementById('rep-analysis').textContent = reason;
    const arch = ARCHITECTURES[config.selectedArch];
    document.getElementById('rep-arch-tag').textContent = arch.name;
    document.getElementById('rep-budget-tag').textContent = `$${Math.max(0, config.budget - arch.cost)}M Surplus`;
    document.getElementById('rep-mass-tag').textContent = `${Math.max(0, config.massLimit - arch.mass)} Tons Margin`;

    // Fill Certificate
    document.getElementById('cert-sols').textContent = `${simState.survivedSols} Sols`;
    document.getElementById('cert-arch').textContent = arch.name;
    document.getElementById('cert-grade').textContent = `${grade} (${quizPct}%)`;

    switchScreen('screen-4');
  }

  function logSimAlert(msg) {
    const el = document.getElementById('sim-live-log');
    if (el) {
      el.textContent = `[SOL ${String(simState.sol).padStart(2, '0')}] ${msg}`;
      el.classList.add('text-amber-300');
      setTimeout(() => el.classList.remove('text-amber-300'), 1500);
    }
  }

  // =========================================================================
  // 5. UI UPDATERS & HUD
  // =========================================================================
  function updateConfigPreview() {
    document.getElementById('cfg-budget-display').textContent = `$${(config.budget / 1000).toFixed(2)} Billion`;
    document.getElementById('cfg-mass-display').textContent = `${config.massLimit.toFixed(1)} Metric Tons`;
    document.getElementById('cfg-crew-display').textContent = `${config.crewSize} Astronauts`;
    document.getElementById('cfg-duration-display').textContent = `${config.targetSols} Sols (${config.targetSols === 30 ? '1 Mo' : config.targetSols === 180 ? '6 Mo' : config.targetSols === 365 ? '1 Yr' : '5 Yrs'})`;

    // Calculations
    const dailyWater = config.crewSize * 28.5;
    const eclssPower = 5.0 + config.crewSize * 2.5;
    document.getElementById('preview-water').textContent = `${dailyWater.toFixed(1)} L/day`;
    document.getElementById('preview-eclss').textContent = `${eclssPower.toFixed(1)} kW`;
    document.getElementById('preview-sols').textContent = `${config.targetSols} Sols`;

    const statusEl = document.getElementById('preview-feasibility');
    if (config.massLimit < 20 && config.crewSize > 6) {
      statusEl.textContent = 'HIGH LAUNCH RISK';
      statusEl.className = 'font-bold text-rose-400 text-sm';
    } else {
      statusEl.textContent = 'OPTIMAL LAUNCH';
      statusEl.className = 'font-bold text-emerald-400 text-sm';
    }
  }

  function updateArchSelectionUI() {
    const arch = ARCHITECTURES[config.selectedArch];

    document.querySelectorAll('.arch-card').forEach((card) => {
      if (card.dataset.arch === config.selectedArch) {
        card.className = 'arch-card p-5 bg-slate-900 border-2 border-cyan-400 rounded-2xl space-y-4 cursor-pointer transition-all flex flex-col justify-between shadow-2xl hud-card-active';
        const b = card.querySelector('.btn-select-arch');
        if (b) {
          b.textContent = '✓ SELECTED ARCHETYPE';
          b.className = 'btn-select-arch w-full py-2.5 bg-cyan-600 text-white font-bold text-xs rounded-xl font-hud shadow-md';
        }
      } else {
        card.className = 'arch-card p-5 bg-slate-900/90 border-2 border-slate-800 hover:border-cyan-500/60 rounded-2xl space-y-4 cursor-pointer transition-all flex flex-col justify-between shadow-xl';
        const b = card.querySelector('.btn-select-arch');
        if (b) {
          b.textContent = `SELECT ${card.dataset.arch.toUpperCase()}`;
          b.className = 'btn-select-arch w-full py-2.5 bg-slate-800 hover:bg-cyan-600 text-white font-bold text-xs rounded-xl font-hud transition-colors';
        }
      }
    });

    const budgetRem = config.budget - arch.cost;
    const massRem = config.massLimit - arch.mass;

    const bRemEl = document.getElementById('arch-budget-rem');
    bRemEl.textContent = `${budgetRem >= 0 ? '+$' : '-$'}${Math.abs(budgetRem)}M ${budgetRem >= 0 ? 'Reserve' : 'DEFICIT'}`;
    bRemEl.className = `font-bold text-sm ${budgetRem >= 0 ? 'text-amber-300' : 'text-rose-400'}`;

    const mRemEl = document.getElementById('arch-mass-rem');
    mRemEl.textContent = `${massRem >= 0 ? '+' : ''}${massRem.toFixed(1)} Tons ${massRem >= 0 ? 'Margin' : 'OVERWEIGHT'}`;
    mRemEl.className = `font-bold text-sm ${massRem >= 0 ? 'text-cyan-300' : 'text-rose-400'}`;
  }

  function updateSimHUD() {
    const solStr = String(simState.sol).padStart(2, '0');
    const hourStr = String(Math.floor(simState.hour)).padStart(2, '0');
    const minStr = Math.floor((simState.hour % 1) * 60) === 0 ? '00' : '30';

    document.getElementById('sim-sol-display').textContent = `SOL ${solStr} / ${config.targetSols}`;
    document.getElementById('sim-lmst-display').textContent = `${hourStr}:${minStr} LMST`;

    const season = getMarsSeason(simState.sol);
    document.getElementById('sim-season-icon').textContent = season.icon;
    document.getElementById('sim-season-label').textContent = season.name;

    // Badges
    document.getElementById('sim-val-temp').textContent = `${simState.habTemp >= 0 ? '+' : ''}${simState.habTemp.toFixed(1)}°C`;
    document.getElementById('sim-val-battery').textContent = `${Math.round(simState.battery)} / ${simState.batteryMax} kWh`;
    document.getElementById('sim-val-crew').textContent = `${Math.round(simState.crewHealth)}% HEALTH`;

    // Weather Card
    document.getElementById('sim-val-ambient').textContent = `${simState.ambientTemp.toFixed(1)}°C`;
    document.getElementById('sim-val-tau').textContent = `${simState.tau.toFixed(2)} Tau`;
    document.getElementById('sim-val-dust').textContent = `${Math.round((1 - simState.dustOnPanels) * 100)}%`;

    const wLabel = document.getElementById('sim-weather-label');
    const wIcon = document.getElementById('sim-weather-icon');
    if (simState.activeHazard === 'dust_storm') {
      wLabel.textContent = 'GLOBAL DUST STORM';
      wLabel.className = 'font-bold text-red-400 text-sm font-hud';
      wIcon.textContent = '🌪️';
    } else if (simState.activeHazard === 'polar_vortex') {
      wLabel.textContent = 'POLAR VORTEX (-110°C)';
      wLabel.className = 'font-bold text-blue-400 text-sm font-hud';
      wIcon.textContent = '❄️';
    } else if (simState.hour >= 5 && simState.hour < 20) {
      wLabel.textContent = 'CLEAR MARTIAN DAYLIGHT';
      wLabel.className = 'font-bold text-amber-300 text-sm font-hud';
      wIcon.textContent = '☀️';
    } else {
      wLabel.textContent = 'COLD MARTIAN NIGHT';
      wLabel.className = 'font-bold text-blue-300 text-sm font-hud';
      wIcon.textContent = '🌙';
    }

    // Power Grid Card
    document.getElementById('sim-val-psolar').textContent = `${simState.pSolar.toFixed(1)} kW`;
    document.getElementById('sim-val-prtg').textContent = `${simState.pRTG.toFixed(1)} kW`;
    document.getElementById('sim-val-pload').textContent = `${simState.pTotalLoad.toFixed(1)} kW`;
    const netTag = document.getElementById('sim-net-power-tag');
    if (simState.pNet >= 0) {
      netTag.textContent = `+${simState.pNet.toFixed(1)} kW`;
      netTag.className = 'text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold';
    } else {
      netTag.textContent = `${simState.pNet.toFixed(1)} kW`;
      netTag.className = 'text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40 font-bold';
    }

    document.getElementById('sim-val-radiation').textContent = `${simState.radDoseRate.toFixed(2)} mSv/day`;

    // Canvas overlay tags
    const arch = ARCHITECTURES[config.selectedArch];
    document.getElementById('sim-hud-arch-label').textContent = arch.name.toUpperCase();
    const quizPct = simState.quizzesTotal === 0 ? 100 : Math.round((simState.quizzesSolved / simState.quizzesTotal) * 100);
    document.getElementById('sim-hud-quiz-score').textContent = `${quizPct}%`;
  }

  function switchScreen(screenId) {
    ['screen-1', 'screen-2', 'screen-3', 'screen-4'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('hidden', id !== screenId);
    });

    // Update Top Navigation Stepper
    const badges = {
      'screen-1': 'step-badge-1',
      'screen-2': 'step-badge-2',
      'screen-3': 'step-badge-3',
      'screen-4': 'step-badge-4'
    };
    ['step-badge-1', 'step-badge-2', 'step-badge-3', 'step-badge-4'].forEach((bId) => {
      const b = document.getElementById(bId);
      if (b) {
        if (bId === badges[screenId]) {
          b.className = 'px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/50 font-bold';
        } else {
          b.className = 'px-2.5 py-1 rounded bg-slate-900 text-slate-500 border border-slate-800';
        }
      }
    });

    if (screenId === 'screen-3') {
      resizeCanvas();
    }
  }

  // =========================================================================
  // 6. AI GEMINI CADET ASSISTANT (NASA GROUNDED KNOWLEDGE ENGINE)
  // =========================================================================
  const GEMINI_KB = [
    {
      keywords: ['cold', 'freezing', 'temperature', '-85', 'why is mars'],
      answer: 'Mars is extremely cold (averaging -60°C and dropping to -85°C at night) because it is 1.52 AU from the Sun and has an ultra-thin atmosphere (0.6% Earth pressure, ~610 Pascals) with almost no greenhouse heat retention.'
    },
    {
      keywords: ['tau', 'optical depth', 'opacity', 'dust'],
      answer: 'Tau (τ) measures atmospheric optical depth. Clear Martian air has τ ≈ 0.4 to 0.65. During a global dust storm, τ spikes above 4.0, which cuts direct solar flux by over 90% via Lambert-Beer optical extinction (e^(-τ)).'
    },
    {
      keywords: ['rtg', 'nuclear', 'power', 'plutonium'],
      answer: 'A Radioisotope Thermoelectric Generator (RTG) converts the decay heat of Plutonium-238 into continuous electricity using thermocouples (Seebeck effect). It provides a reliable 24/7 baseline unaffected by dust storms or nightfall.'
    },
    {
      keywords: ['metal', 'dangerous for metals', 'ductile', 'brittle'],
      answer: 'At -85°C, common metals cross the Ductile-to-Brittle Transition Temperature (DBTT). Steel and unalloyed metals lose toughness and can shatter under stress. NASA uses aerospace aluminum-lithium (Al-Li) and titanium alloys to avoid brittle fractures.'
    },
    {
      keywords: ['inflatable', '3d', 'regolith', 'comparison', 'vs'],
      answer: 'Inflatable TransHab domes provide the highest volume-per-ton and outstanding Kevlar puncture resistance. In contrast, 3D-Printed Regolith shells use local Martian dirt (ISRU), giving near-complete protection against ionizing cosmic radiation and micrometeoroids.'
    },
    {
      keywords: ['eclss', 'oxygen', 'water', 'life support'],
      answer: 'ECLSS (Environmental Control and Life Support System) recycles astronaut respiration and perspiration. On Mars Base 01, catalytic Sabatier reactors and water electrolysis loops recover up to 98% of oxygen and water.'
    },
    {
      keywords: ['solar', 'flare', 'radiation', 'proton', 'storm'],
      answer: 'Solar flares and coronal mass ejections (CMEs) bombard Mars with energetic protons. Because Mars lacks a global geomagnetic dipole field, astronauts must retreat into interior radiation storm shelters surrounded by water tanks or regolith shielding.'
    }
  ];

  function queryGeminiAssistant(question) {
    const qLower = question.toLowerCase();
    for (const item of GEMINI_KB) {
      if (item.keywords.some((k) => qLower.includes(k))) {
        return item.answer;
      }
    }
    return `Cadet, according to NASA flight telemetry: Martian operations require strict equilibrium between your baseline RTG core and battery reserves. Currently, your ${ARCHITECTURES[config.selectedArch].name} is operating within nominal limits!`;
  }

  function appendChatMessage(sender, text, isAi = false) {
    const history = document.getElementById('ai-chat-history');
    if (!history) return;

    const div = document.createElement('div');
    if (isAi) {
      div.className = 'bg-cyan-950/60 border border-cyan-500/30 p-2.5 rounded-lg text-slate-200 space-y-1';
      div.innerHTML = `<span class="text-cyan-300 font-bold block text-[11px] font-hud">GEMINI AI ADVISOR:</span><p class="leading-relaxed text-[11px]">${text}</p>`;
    } else {
      div.className = 'bg-slate-800/80 border border-slate-700 p-2.5 rounded-lg text-slate-200 space-y-1';
      div.innerHTML = `<span class="text-amber-300 font-bold block text-[11px] font-hud">CADET:</span><p class="leading-relaxed text-[11px]">${text}</p>`;
    }

    history.appendChild(div);
    history.scrollTop = history.scrollHeight;
  }

  // =========================================================================
  // 7. INTERACTIVE MARS BASE CANVAS VISUALIZER
  // =========================================================================
  let canvas, ctx;
  let canvasWidth = 800;
  let canvasHeight = 500;
  let animId = null;
  let simTimeAnim = 0;

  function resizeCanvas() {
    if (!canvas || !canvas.parentElement) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      canvasWidth = rect.width;
      canvasHeight = rect.height;
    }
  }

  function drawSimCanvas() {
    if (!canvas || !ctx) return;
    simTimeAnim += 0.03;

    ctx.save();
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const isDay = simState.hour >= 5.0 && simState.hour < 20.0;

    // 1. SKY GRADIENT
    const sky = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    if (simState.activeHazard === 'dust_storm') {
      sky.addColorStop(0, '#451a03');
      sky.addColorStop(0.5, '#78350f');
      sky.addColorStop(1, '#9a3412');
    } else if (simState.activeHazard === 'polar_vortex') {
      sky.addColorStop(0, '#0c1a2e');
      sky.addColorStop(0.7, '#1e293b');
      sky.addColorStop(1, '#0284c7');
    } else if (isDay) {
      sky.addColorStop(0, '#1c1917');
      sky.addColorStop(0.4, '#44180d');
      sky.addColorStop(0.8, '#7c2d12');
      sky.addColorStop(1, '#c2410c');
    } else {
      sky.addColorStop(0, '#030712');
      sky.addColorStop(0.6, '#090d16');
      sky.addColorStop(1, '#111827');
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Night stars
    if (!isDay && simState.activeHazard !== 'dust_storm') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      for (let i = 0; i < 30; i++) {
        const sx = ((i * 89) % canvasWidth);
        const sy = ((i * 47) % (canvasHeight * 0.5));
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }
    }

    // 2. CELESTIAL ORB (Mars Sun or Phobos)
    const orbX = canvasWidth * 0.15 + (simState.hour / 24) * (canvasWidth * 0.7);
    const orbY = canvasHeight * 0.22 + Math.sin((simState.hour / 24) * Math.PI) * (-canvasHeight * 0.12);
    if (isDay && simState.activeHazard !== 'dust_storm') {
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(orbX, orbY, 14, 0, Math.PI * 2);
      ctx.fill();
    } else if (!isDay) {
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(orbX, orbY, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. TERRAIN
    const horizonY = canvasHeight * 0.64;
    ctx.fillStyle = '#3f1508';
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.bezierCurveTo(canvasWidth * 0.3, horizonY - 20, canvasWidth * 0.6, horizonY + 20, canvasWidth, horizonY - 10);
    ctx.lineTo(canvasWidth, canvasHeight);
    ctx.lineTo(0, canvasHeight);
    ctx.fill();

    ctx.fillStyle = '#5c1d0b';
    ctx.beginPath();
    ctx.moveTo(0, horizonY + 20);
    ctx.bezierCurveTo(canvasWidth * 0.4, horizonY + 10, canvasWidth * 0.7, horizonY + 35, canvasWidth, horizonY + 15);
    ctx.lineTo(canvasWidth, canvasHeight);
    ctx.lineTo(0, canvasHeight);
    ctx.fill();

    // 4. DRAW ARCHITECTURE AT BASE
    const habCenterX = canvasWidth * 0.48;
    const habBaseY = horizonY + 35;

    ctx.save();
    ctx.translate(habCenterX, habBaseY);

    const isFreezing = simState.habTemp < 5;

    if (config.selectedArch === 'metallic') {
      // Cylinders & Nodes
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = isFreezing ? '#93c5fd' : '#38bdf8';
      ctx.lineWidth = 2.5;

      // Central cylinder
      ctx.fillRect(-70, -35, 140, 45);
      ctx.strokeRect(-70, -35, 140, 45);

      // Docking Cupola
      ctx.fillStyle = isFreezing ? '#38bdf8' : '#06b6d4';
      ctx.fillRect(-20, -50, 40, 15);
      ctx.strokeRect(-20, -50, 40, 15);

      // Windows
      ctx.fillStyle = isFreezing ? '#bfdbfe' : '#fef08a';
      for (let w = -50; w <= 50; w += 25) {
        ctx.beginPath();
        ctx.arc(w, -15, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (config.selectedArch === 'inflatable') {
      // Inflatable TransHab Dome
      const domeR = 55;
      const domeGrad = ctx.createRadialGradient(0, -domeR * 0.5, 5, 0, -domeR * 0.5, domeR);
      if (isFreezing) {
        domeGrad.addColorStop(0, 'rgba(186, 230, 253, 0.9)');
        domeGrad.addColorStop(1, 'rgba(14, 165, 233, 0.7)');
      } else {
        domeGrad.addColorStop(0, 'rgba(165, 243, 252, 0.9)');
        domeGrad.addColorStop(1, 'rgba(8, 145, 178, 0.7)');
      }
      ctx.fillStyle = domeGrad;
      ctx.beginPath();
      ctx.arc(0, 0, domeR, Math.PI, 0);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = isFreezing ? '#e0f2fe' : '#06b6d4';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Interior Decks
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.moveTo(-45, -20);
      ctx.lineTo(45, -20);
      ctx.stroke();
    } else {
      // 3D-Printed Regolith Vault
      ctx.fillStyle = '#78350f';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 65, Math.PI, 0);
      ctx.lineTo(45, 0);
      ctx.arc(0, 0, 45, 0, Math.PI, true);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Pressurized inner airlock
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-25, -20, 50, 20);
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(-15, -15, 30, 8);
    }

    // Mini Astronauts walking inside
    ctx.fillStyle = '#ffffff';
    for (let a = 0; a < Math.min(config.crewSize, 4); a++) {
      const ax = -30 + a * 20 + Math.sin(simTimeAnim * 2 + a) * 5;
      ctx.beginPath();
      ctx.arc(ax, -10, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(ax - 1.5, -12, 3, 2);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(ax - 2.5, -7, 5, 6);
    }

    ctx.restore();

    // 5. SOLAR ARRAYS & ROVERS (Right side)
    const arrayX = canvasWidth * 0.76;
    const arrayY = horizonY + 35;
    ctx.save();
    ctx.translate(arrayX, arrayY);
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.moveTo(-45, -20);
    ctx.lineTo(45, -20);
    ctx.lineTo(35, 0);
    ctx.lineTo(-35, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Dust layer
    if (simState.dustOnPanels > 0.05) {
      ctx.fillStyle = `rgba(180, 83, 9, ${simState.dustOnPanels * 0.85})`;
      ctx.fill();
    }

    // Rover cleaner bot
    const roverPos = Math.sin(simTimeAnim * 2) * 28;
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(roverPos - 6, -16, 12, 7);
    ctx.restore();

    // 6. RTG NUCLEAR CORE (Left side)
    const rtgX = canvasWidth * 0.22;
    const rtgY = horizonY + 40;
    ctx.save();
    ctx.translate(rtgX, rtgY);
    ctx.fillStyle = '#334155';
    ctx.fillRect(-12, -25, 24, 25);
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, -12, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
    animId = requestAnimationFrame(drawSimCanvas);
  }

  // =========================================================================
  // 8. EVENT LISTENERS & WIRING
  // =========================================================================
  function init() {
    canvas = document.getElementById('sim-canvas');
    if (canvas) ctx = canvas.getContext('2d');

    // Configuration Sliders
    const budgetSlider = document.getElementById('cfg-budget-slider');
    budgetSlider.addEventListener('input', (e) => {
      config.budget = parseFloat(e.target.value);
      updateConfigPreview();
    });

    const massSlider = document.getElementById('cfg-mass-slider');
    massSlider.addEventListener('input', (e) => {
      config.massLimit = parseFloat(e.target.value);
      updateConfigPreview();
    });

    const crewSlider = document.getElementById('cfg-crew-slider');
    crewSlider.addEventListener('input', (e) => {
      config.crewSize = parseInt(e.target.value, 10);
      updateConfigPreview();
    });

    // Duration button pills
    document.querySelectorAll('.btn-duration-opt').forEach((btn) => {
      btn.addEventListener('click', () => {
        audio.playClick();
        config.targetSols = parseInt(btn.dataset.duration, 10);
        document.querySelectorAll('.btn-duration-opt').forEach((b) => {
          b.className = 'btn-duration-opt py-2 px-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 text-center cursor-pointer transition-all';
        });
        btn.className = 'btn-duration-opt py-2 px-1 rounded-lg border border-cyan-400 bg-cyan-950/70 text-cyan-200 text-center cursor-pointer transition-all font-bold';
        updateConfigPreview();
      });
    });

    // Step 1 -> Step 2
    document.getElementById('btn-goto-step2').addEventListener('click', () => {
      audio.playClick();
      updateArchSelectionUI();
      switchScreen('screen-2');
    });

    // Step 2 -> Step 1
    document.getElementById('btn-back-to-step1').addEventListener('click', () => {
      audio.playClick();
      switchScreen('screen-1');
    });

    // Architecture selection cards
    document.querySelectorAll('.arch-card').forEach((card) => {
      card.addEventListener('click', () => {
        audio.playClick();
        config.selectedArch = card.dataset.arch;
        updateArchSelectionUI();
      });
    });

    // Step 2 -> Launch Simulation
    document.getElementById('btn-launch-sim').addEventListener('click', () => {
      audio.playClick();
      audio.playCurrentTrack();

      // Reset Simulation variables
      simState.sol = 1;
      simState.hour = 10.0;
      simState.speed = 1;
      simState.isPaused = false;
      simState.active = true;
      simState.crewHealth = 100;
      simState.battery = 300;
      simState.habTemp = 20.0;
      simState.dustOnPanels = 0.06;
      simState.activeHazard = null;
      simState.quizzesSolved = 0;
      simState.quizzesTotal = 0;

      updateSimHUD();
      switchScreen('screen-3');
      startSimLoop();
    });

    // Timeline Acceleration Buttons
    document.getElementById('btn-sim-pause').addEventListener('click', () => {
      audio.playClick();
      simState.speed = 0;
      startSimLoop();
    });
    document.getElementById('btn-sim-1x').addEventListener('click', () => {
      audio.playClick();
      simState.speed = 1;
      simState.isPaused = false;
      startSimLoop();
    });
    document.getElementById('btn-sim-5x').addEventListener('click', () => {
      audio.playClick();
      simState.speed = 5;
      simState.isPaused = false;
      startSimLoop();
    });
    document.getElementById('btn-sim-30x').addEventListener('click', () => {
      audio.playClick();
      simState.speed = 30;
      simState.isPaused = false;
      startSimLoop();
    });

    // Fast-Forward Execution Mode
    document.getElementById('btn-fast-forward').addEventListener('click', runFastForwardResult);

    // Quiz Resume Button
    document.getElementById('btn-quiz-resume').addEventListener('click', () => {
      audio.playClick();
      simState.activeHazard = null;
      simState.isPaused = false;
      document.getElementById('modal-quiz').classList.add('hidden');
      logSimAlert('Troubleshooting protocol complete. Simulation unfreezing.');
      startSimLoop();
    });

    // Restart Setup Button from Report
    document.getElementById('btn-restart-setup').addEventListener('click', () => {
      audio.playClick();
      switchScreen('screen-1');
    });

    // Certificate Modals
    document.getElementById('btn-open-certificate').addEventListener('click', () => {
      audio.playClick();
      document.getElementById('modal-certificate').classList.remove('hidden');
    });
    document.getElementById('btn-close-certificate').addEventListener('click', () => {
      audio.playClick();
      document.getElementById('modal-certificate').classList.add('hidden');
    });

    // AI Assistant Sidebar Toggle
    document.getElementById('btn-toggle-assistant').addEventListener('click', () => {
      audio.playClick();
      const panel = document.getElementById('panel-assistant');
      panel.classList.toggle('hidden');
    });

    // Quick AI query buttons
    document.querySelectorAll('.btn-quick-ai').forEach((btn) => {
      btn.addEventListener('click', () => {
        audio.playClick();
        const q = btn.dataset.q;
        appendChatMessage('CADET', q, false);
        const ans = queryGeminiAssistant(q);
        setTimeout(() => appendChatMessage('GEMINI AI', ans, true), 300);
      });
    });

    // AI Chat Form
    document.getElementById('ai-chat-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('ai-chat-input');
      const val = input.value.trim();
      if (!val) return;
      audio.playClick();
      appendChatMessage('CADET', val, false);
      input.value = '';
      const ans = queryGeminiAssistant(val);
      setTimeout(() => appendChatMessage('GEMINI AI', ans, true), 350);
    });

    // Audio & Settings Modal
    document.getElementById('btn-open-audio-settings').addEventListener('click', () => {
      audio.playClick();
      document.getElementById('modal-settings').classList.remove('hidden');
    });
    document.getElementById('btn-close-settings').addEventListener('click', () => {
      audio.playClick();
      document.getElementById('modal-settings').classList.add('hidden');
    });
    document.getElementById('btn-settings-ok').addEventListener('click', () => {
      audio.playClick();
      document.getElementById('modal-settings').classList.add('hidden');
    });

    // Master Audio Toggle
    const btnMaster = document.getElementById('btn-toggle-master-audio');
    btnMaster.addEventListener('click', () => {
      const now = !audio.masterEnabled;
      audio.setMasterEnabled(now);
      btnMaster.textContent = now ? 'ON' : 'OFF';
      btnMaster.className = `px-3 py-1 font-bold rounded-lg cursor-pointer text-xs ${now ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-400'}`;
      audio.playClick();
    });

    // Music & SFX Sliders
    document.getElementById('slider-music-vol').addEventListener('input', (e) => {
      const vol = parseFloat(e.target.value) / 100;
      audio.setMusicVolume(vol);
      document.getElementById('label-music-vol').textContent = `${e.target.value}%`;
    });
    document.getElementById('slider-sfx-vol').addEventListener('input', (e) => {
      const vol = parseFloat(e.target.value) / 100;
      audio.setSfxVolume(vol);
      document.getElementById('label-sfx-vol').textContent = `${e.target.value}%`;
    });

    // Skip track
    document.getElementById('btn-skip-track').addEventListener('click', () => {
      audio.playClick();
      audio.nextTrack();
    });

    window.addEventListener('resize', resizeCanvas);

    // Initial setup
    updateConfigPreview();
    updateArchSelectionUI();
    drawSimCanvas();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
