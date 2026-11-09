// Mission Forge - Web Audio Playful Synthesizer
// Joyful, arcade and cartoon sound effects for kids space game

import {
  type RocketAudioNodes,
  type RoverAudioNodes,
  PENTATONIC_NOTES,
  createRocketRoarNodes,
  createRoverNodes,
  synthesizeBoing,
  synthesizeClick,
  synthesizeCountdownBeep,
  synthesizeFanfare,
  synthesizeHatchSeal,
  synthesizeMagneticSnap,
  synthesizeRadioBeep,
  synthesizeReturnTestEffect,
  synthesizeSnap,
  synthesizeStagingThud,
  synthesizeTimelineSlideTick,
} from "./synthEffects";

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private rocketNodes: RocketAudioNodes | null = null;
  private roverNodes: RoverAudioNodes | null = null;
  private isArchiveActive: boolean = false;
  private wasSuspendedByOrientation: boolean = false;
  private noteStep = 0;

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
    this.noteStep = 0;
  }

  /** Separate motor feedback for the practice game; never shares flight audio nodes. */
  public startRoverSound(kind: "drive" | "drill") {
    this.stopRoverSound();
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    this.roverNodes = createRoverNodes(this.ctx, kind);
  }

  public stopRoverSound() {
    const nodes = this.roverNodes;
    if (!nodes || !this.ctx) return;
    this.roverNodes = null;
    nodes.gain.gain.cancelScheduledValues(this.ctx.currentTime);
    nodes.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.025);
    nodes.noise.stop(this.ctx.currentTime + 0.12);
    nodes.oscillator.stop(this.ctx.currentTime + 0.12);
    nodes.noise.onended = () => {
      nodes.noise.disconnect();
      nodes.oscillator.disconnect();
      nodes.filter.disconnect();
      nodes.gain.disconnect();
    };
  }

  private wasSuspendedByOrientationState: boolean = false;

  public pauseAll() {
    this.wasSuspendedByOrientation = true;
    this.wasSuspendedByOrientationState = true;
    if (this.ctx && this.ctx.state === "running") {
      this.ctx.suspend().catch(() => {});
    }
  }

  public resumeAll() {
    this.wasSuspendedByOrientation = false;
    this.wasSuspendedByOrientationState = false;
    if (this.ctx && this.ctx.state === "suspended" && !this.isMuted) {
      this.ctx.resume().catch(() => {});
    }
  }

  public isSuspended(): boolean {
    return (
      this.wasSuspendedByOrientation || this.wasSuspendedByOrientationState
    );
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.wasSuspendedByOrientation) {
      if (this.ctx.state === "running") void this.ctx.suspend().catch(() => {});
      return;
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) this.stopRoverSound();
    if (muted && this.rocketNodes?.gain) {
      this.rocketNodes.gain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
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
    synthesizeClick(this.ctx, freq);
  }

  public playPop(freq = 750) {
    this.playClick(freq);
  }

  public playRocketFit(part: string) {
    if (part === "engines" || part === "core" || part === "upper")
      this.playStagingThud();
    else if (part.startsWith("cover")) this.playHatchSeal();
    else if (["rover", "lander", "capsule"].includes(part))
      this.playMagneticSnap();
    else if (part === "tower") this.playRadioBeep();
    else this.playSnap();
  }

  /**
   * Playful, game-intro tone for timeline sliding.
   * Cheerful, arcade-like chime/bubble pip cycling through a bright pentatonic scale.
   */
  public playTimelineSlideTick(_velocity = 1.0) {
    if (this.isMuted || !this.isArchiveActive) return;
    this.initContext();
    if (!this.ctx) return;
    synthesizeTimelineSlideTick(this.ctx, this.noteStep, _velocity);
    this.noteStep = (this.noteStep + 1) % PENTATONIC_NOTES.length;
  }

  public playCombFlick(velocity = 1.0) {
    this.playTimelineSlideTick(velocity);
  }

  /** Magnetic snap lock sound when a year docks into the needle reticle. */
  public playMagneticSnap() {
    if (this.isMuted || !this.isArchiveActive) return;
    this.initContext();
    if (!this.ctx) return;
    synthesizeMagneticSnap(this.ctx);
  }

  /** Cartoon snap / boing on part install */
  public playSnap() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    synthesizeSnap(this.ctx);
  }

  /** Pressure-hatch feedback: a short seal hiss followed by two metal locking clicks. */
  public playHatchSeal() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    synthesizeHatchSeal(this.ctx);
  }

  /** Fabric deployment and water feedback for the Earth drop rehearsal. */
  public playReturnTestEffect(kind: "canopy" | "splash") {
    if (this.isMuted || this.wasSuspendedByOrientation) return;
    this.initContext();
    if (!this.ctx) return;
    synthesizeReturnTestEffect(this.ctx, kind);
  }

  // Joyful space fanfare when reaching orbit or clearing checks
  public playFanfare() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    synthesizeFanfare(this.ctx);
  }

  // Cute cartoon boing for coming soon / error
  public playBoing() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    synthesizeBoing(this.ctx);
  }

  // Quindar beep
  public playRadioBeep(intro = true) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    synthesizeRadioBeep(this.ctx, intro);
  }

  // Countdown sequencer blip
  public playCountdownBeep(isTZero = false) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    synthesizeCountdownBeep(this.ctx, isTZero);
  }

  // Deep structural separation thud for staging & fairings
  public playStagingThud() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    synthesizeStagingThud(this.ctx);
  }

  public playOrbitHarmony() {
    this.playFanfare();
  }

  // Continuous realistic rocket roar with low-pass filtering
  public startRocketRoar() {
    if (this.rocketNodes) return;
    this.initContext();
    if (!this.ctx) return;
    this.rocketNodes = createRocketRoarNodes(this.ctx, this.isMuted);
  }

  public updateRocketIntensity(intensity: number, vacuumRatio: number) {
    if (!this.ctx || !this.rocketNodes) return;
    if (this.isMuted) {
      this.rocketNodes.gain.gain.setValueAtTime(0, this.ctx.currentTime);
      return;
    }

    try {
      const targetGain = Math.max(
        0,
        Math.min(0.32, intensity * (1 - vacuumRatio * 0.55)),
      );
      const targetFreq = 180 + (1 - vacuumRatio) * 380;

      this.rocketNodes.gain.gain.setTargetAtTime(
        targetGain,
        this.ctx.currentTime,
        0.1,
      );
      this.rocketNodes.filter.frequency.setTargetAtTime(
        targetFreq,
        this.ctx.currentTime,
        0.1,
      );
    } catch {}
  }

  public stopRocketRoar() {
    // Detach this source now: a delayed fade must never stop a newer flight source.
    const nodes = this.rocketNodes;
    this.rocketNodes = null;
    if (!nodes) return;
    if (this.ctx)
      nodes.gain.gain.linearRampToValueAtTime(
        0.0001,
        this.ctx.currentTime + 0.2,
      );
    setTimeout(() => {
      try {
        nodes.noise.stop();
        nodes.noise.disconnect();
        nodes.gain.disconnect();
        nodes.filter.disconnect();
      } catch {}
    }, 250);
  }
}

export const sound = new SoundEngine();
