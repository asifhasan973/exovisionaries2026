// Mission Forge - Web Audio Playful Synthesizer
// Joyful, arcade and cartoon sound effects for kids space game

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private rocketNoiseNode: AudioNode | null = null;
  private rocketGainNode: GainNode | null = null;
  private rocketFilterNode: BiquadFilterNode | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
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
