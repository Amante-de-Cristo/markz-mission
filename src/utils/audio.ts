/**
 * Native Web Audio API Sound Synthesizer for NASA HUD Mission Control
 * No external sound files required - 100% reliable and instantaneous.
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private stormOsc: OscillatorNode | null = null;
  private stormGain: GainNode | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public playClick(enabled = true) {
    if (!enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1900, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // Audio not permitted yet
    }
  }

  public playRogerChirp(enabled = true) {
    if (!enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2400, now);
      osc.frequency.setValueAtTime(2800, now + 0.04);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {}
  }

  public playWarning(enabled = true) {
    if (!enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // 2-tone NASA alert: 880Hz then 660Hz
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(660, now + 0.12);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {}
  }

  public playCriticalAlarm(enabled = true) {
    if (!enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Triple emergency burst
      for (let i = 0; i < 3; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const t = now + i * 0.14;
        osc.type = 'square';
        osc.frequency.setValueAtTime(1040, t);
        osc.frequency.setValueAtTime(1280, t + 0.06);

        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.12);
      }
    } catch {}
  }

  public playRoverDeploy(enabled = true) {
    if (!enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Servo motor pitch ramp + robotic airlock discharge
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.4);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch {}
  }

  public playVictory(enabled = true) {
    if (!enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const t = now + idx * 0.12;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(t);
        osc.stop(t + 0.45);
      });
    } catch {}
  }

  public updateStormAmbience(isStorming: boolean, severity: number, enabled: boolean) {
    if (!enabled || !isStorming) {
      if (this.stormOsc) {
        try {
          this.stormGain?.gain.setTargetAtTime(0, this.ctx?.currentTime || 0, 0.2);
          setTimeout(() => {
            this.stormOsc?.stop();
            this.stormOsc?.disconnect();
            this.stormOsc = null;
            this.stormGain = null;
          }, 300);
        } catch {}
      }
      return;
    }

    try {
      this.initCtx();
      if (!this.ctx) return;

      if (!this.stormOsc) {
        this.stormOsc = this.ctx.createOscillator();
        this.stormGain = this.ctx.createGain();

        // Brownish wind drone
        this.stormOsc.type = 'triangle';
        this.stormOsc.frequency.setValueAtTime(85, this.ctx.currentTime);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, this.ctx.currentTime);

        this.stormGain.gain.setValueAtTime(0.01, this.ctx.currentTime);

        this.stormOsc.connect(filter);
        filter.connect(this.stormGain);
        this.stormGain.connect(this.ctx.destination);

        this.stormOsc.start();
      }

      const targetVol = Math.min(0.08, 0.02 + severity * 0.02);
      this.stormGain?.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.1);
    } catch {}
  }
}

export const sound = new SoundSynthesizer();
