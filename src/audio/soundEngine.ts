// Mission Forge - Web Audio Playful Synthesizer
// Joyful, arcade and cartoon sound effects for kids space game

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private rocketNoiseNode: AudioNode | null = null;
  private rocketGainNode: GainNode | null = null;
  private rocketFilterNode: BiquadFilterNode | null = null;

  private roverNodes: { oscillator: OscillatorNode; noise: AudioBufferSourceNode; gain: GainNode; filter: BiquadFilterNode } | null = null;
  private isArchiveActive: boolean = false;

  public setArchiveActive(active: boolean) {
    this.isArchiveActive = active;
    if (!active) {
      this.noteStep = 0;
    }
  }

  public getArchiveActive(): boolean {
    return this.isArchiveActive;
  }

  public stopAll() {
    this.stopRoverSound();
    this.stopRocketRoar();
    this.isArchiveActive = false;
    this.noteStep = 0;
  }

  /** Separate motor feedback for the practice game; never shares flight audio nodes. */
  public startRoverSound(kind: 'drive' | 'drill') {
    this.stopRoverSound();
    if (this.isMuted) return;
    this.initContext();
    const ctx = this.ctx; if (!ctx) return;
    const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * .35;
    const noise = ctx.createBufferSource(); noise.buffer = buffer; noise.loop = true;
    const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = kind === 'drill' ? 1500 : 340;
    const oscillator = ctx.createOscillator(); oscillator.type = 'triangle'; oscillator.frequency.value = kind === 'drill' ? 155 : 72;
    const gain = ctx.createGain(); gain.gain.setValueAtTime(0, ctx.currentTime); gain.gain.linearRampToValueAtTime(kind === 'drill' ? .065 : .045, ctx.currentTime + .12);
    noise.connect(filter); oscillator.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    this.roverNodes = { noise, oscillator, filter, gain }; noise.start(); oscillator.start();
  }
  public stopRoverSound() {
    const nodes = this.roverNodes; if (!nodes || !this.ctx) return;
    this.roverNodes = null;
    nodes.gain.gain.cancelScheduledValues(this.ctx.currentTime);
    nodes.gain.gain.setTargetAtTime(0, this.ctx.currentTime, .025);
    nodes.noise.stop(this.ctx.currentTime + .12); nodes.oscillator.stop(this.ctx.currentTime + .12);
    nodes.noise.onended = () => { nodes.noise.disconnect(); nodes.oscillator.disconnect(); nodes.filter.disconnect(); nodes.gain.disconnect(); };
  }

  private wasSuspendedByOrientation: boolean = false;

  public pauseAll() {
    this.wasSuspendedByOrientation = true;
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    }
  }

  public resumeAll() {
    this.wasSuspendedByOrientation = false;
    if (this.ctx && this.ctx.state === 'suspended' && !this.isMuted) {
      this.ctx.resume().catch(() => {});
    }
  }

  public isSuspended(): boolean {
    return this.wasSuspendedByOrientation;
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended' && !this.wasSuspendedByOrientation) {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) this.stopRoverSound();
    if (muted && this.rocketGainNode) {
      this.rocketGainNode.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Joyful bubble pop for UI buttons
  public playClick(freq = 650) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.8, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.07);
    } catch {}
  }

  public playPop(freq = 750) {
    this.playClick(freq);
  }

  // Joyful pentatonic arpeggio notes for playful timeline sliding (C5, D5, E5, G5, A5, C6, D6, E6)
  private pentatonicNotes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];
  private noteStep = 0;

  /**
   * Playful, game-intro tone for timeline sliding.
   * Cheerful, arcade-like chime/bubble pip cycling through a bright pentatonic scale.
   * Joyful, lively, and engaging (replaces the mechanical comb flick with a game tone).
   */
  public playTimelineSlideTick(_velocity = 1.0) {
    if (this.isMuted || !this.isArchiveActive) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const ctx = this.ctx;
      const now = ctx.currentTime;

      // Select next pentatonic note for a joyful, musical cascading arpeggio as you slide
      const freq = this.pentatonicNotes[this.noteStep % this.pentatonicNotes.length];
      this.noteStep = (this.noteStep + 1) % this.pentatonicNotes.length;

      // 1. Warm sine fundamental (musical, sweet, arcade chime)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      // Subtle buoyant pitch glide up (classic video game pop/coin feel)
      osc.frequency.exponentialRampToValueAtTime(freq * 1.06, now + 0.035);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);

      // 2. Crystal sparkle octave overtone (gives it that celestial space-arcade gloss)
      const sparkleOsc = ctx.createOscillator();
      const sparkleGain = ctx.createGain();
      sparkleOsc.type = 'triangle';
      sparkleOsc.frequency.setValueAtTime(freq * 2, now);
      sparkleOsc.frequency.exponentialRampToValueAtTime(freq * 2.15, now + 0.025);

      sparkleGain.gain.setValueAtTime(0.07, now);
      sparkleGain.gain.exponentialRampToValueAtTime(0.0005, now + 0.03);

      sparkleOsc.connect(sparkleGain);
      sparkleGain.connect(ctx.destination);
      sparkleOsc.start(now);
      sparkleOsc.stop(now + 0.032);
    } catch {}
  }

  public playCombFlick(velocity = 1.0) {
    this.playTimelineSlideTick(velocity);
  }

  /**
   * Magnetic snap lock sound when a year docks into the needle reticle.
   */
  public playMagneticSnap() {
    if (this.isMuted || !this.isArchiveActive) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const ctx = this.ctx;
      const now = ctx.currentTime;
      // Dual resonant ping (880Hz -> 1046.5Hz and 1318.5Hz harmonic third chord)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.04);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.5, now);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.08);
      osc2.stop(now + 0.08);
    } catch {}
  }

  // Cartoon snap / boing on part install
  public playSnap() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1100, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.11);
    } catch {}
  }

  // Joyful space fanfare when reaching orbit or clearing checks
  public playFanfare() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.1);

        gain.gain.setValueAtTime(0.001, this.ctx.currentTime + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + idx * 0.1 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.1 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + idx * 0.1);
        osc.stop(this.ctx.currentTime + idx * 0.1 + 0.38);
      });
    } catch {}
  }

  // Cute cartoon boing for coming soon / error
  public playBoing() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(450, this.ctx.currentTime + 0.15);
      osc.frequency.linearRampToValueAtTime(180, this.ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.36);
    } catch {}
  }

  // Quindar beep
  public playRadioBeep(intro = true) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const freq = intro ? 2525 : 2475;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.13);
    } catch {}
  }

  // Countdown sequencer blip
  public playCountdownBeep(isTZero = false) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const freq = isTZero ? 1760 : 880;
      const duration = isTZero ? 0.45 : 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(isTZero ? 0.35 : 0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration + 0.02);
    } catch {}
  }

  // Deep structural separation thud for staging & fairings
  public playStagingThud() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(28, this.ctx.currentTime + 0.5);

      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.55);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.58);
    } catch {}
  }

  public playOrbitHarmony() {
    this.playFanfare();
  }

  // Continuous realistic rocket roar with low-pass filtering
  public startRocketRoar() {
    if (this.rocketNoiseNode) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.5;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(this.isMuted ? 0 : 0.25, this.ctx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
      this.rocketNoiseNode = noise;
      this.rocketGainNode = gain;
      this.rocketFilterNode = filter;
    } catch {}
  }

  public updateRocketIntensity(intensity: number, vacuumRatio: number) {
    if (!this.ctx || !this.rocketGainNode || !this.rocketFilterNode) return;
    if (this.isMuted) {
      this.rocketGainNode.gain.setValueAtTime(0, this.ctx.currentTime);
      return;
    }

    try {
      const targetGain = Math.max(0, Math.min(0.32, intensity * (1 - vacuumRatio * 0.55)));
      const targetFreq = 180 + (1 - vacuumRatio) * 380;

      this.rocketGainNode.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);
      this.rocketFilterNode.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
    } catch {}
  }

  public stopRocketRoar() {
    // Detach this source now: a delayed fade must never stop a newer flight source.
    const node = this.rocketNoiseNode;
    const gain = this.rocketGainNode;
    const filter = this.rocketFilterNode;
    this.rocketNoiseNode = null;
    this.rocketGainNode = null;
    this.rocketFilterNode = null;
    if (!node) return;
    if (gain && this.ctx) gain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.2);
    setTimeout(() => {
      try { (node as AudioScheduledSourceNode).stop(); node.disconnect(); gain?.disconnect(); filter?.disconnect(); } catch {}
    }, 250);
  }

}

export const sound = new SoundEngine();
