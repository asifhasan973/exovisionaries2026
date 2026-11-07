// Mission Forge - Web Audio Playful Synthesizer Presets
// Joyful, arcade and cartoon sound effects for kids space game

export * from './continuousAudio';

export const PENTATONIC_NOTES = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];

/** Joyful bubble pop for UI buttons. */
export function synthesizeClick(ctx: AudioContext, freq = 650): void {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.8, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.07);
  } catch {}
}

/** Playful, game-intro tone cycling through pentatonic scale for timeline sliding. */
export function synthesizeTimelineSlideTick(ctx: AudioContext, noteStep: number, _velocity = 1.0): void {
  try {
    const now = ctx.currentTime;
    const freq = PENTATONIC_NOTES[noteStep % PENTATONIC_NOTES.length];

    // 1. Warm sine fundamental
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.06, now + 0.035);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);

    // 2. Crystal sparkle octave overtone
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

/** Magnetic snap lock sound when a year docks into the needle reticle. */
export function synthesizeMagneticSnap(ctx: AudioContext): void {
  try {
    const now = ctx.currentTime;
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

/** Cartoon snap / boing on part install. */
export function synthesizeSnap(ctx: AudioContext): void {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.11);
  } catch {}
}

/** Pressure-hatch feedback: a short seal hiss followed by two metal locking clicks. */
export function synthesizeHatchSeal(ctx: AudioContext): void {
  try {
    const now = ctx.currentTime;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.46), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const hiss = ctx.createBufferSource();
    hiss.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2100;
    filter.Q.value = 0.45;
    const air = ctx.createGain();
    air.gain.setValueAtTime(0.001, now);
    air.gain.linearRampToValueAtTime(0.16, now + 0.07);
    air.gain.exponentialRampToValueAtTime(0.001, now + 0.43);
    hiss.connect(filter);
    filter.connect(air);
    air.connect(ctx.destination);
    hiss.start(now);
    hiss.stop(now + 0.45);

    [0, 0.33].forEach((offset, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(index ? 650 : 440, now + offset);
      osc.frequency.exponentialRampToValueAtTime(index ? 290 : 180, now + offset + 0.09);
      gain.gain.setValueAtTime(0.001, now + offset);
      gain.gain.linearRampToValueAtTime(0.15, now + offset + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.13);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.14);
    });
  } catch {}
}

/** Fabric deployment and water feedback for the Earth drop rehearsal. */
export function synthesizeReturnTestEffect(ctx: AudioContext, kind: 'canopy' | 'splash'): void {
  try {
    const duration = kind === 'canopy' ? 0.5 : 0.7;
    const now = ctx.currentTime;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * (1 - i / samples.length);
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    source.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(kind === 'canopy' ? 2600 : 1400, now);
    filter.frequency.exponentialRampToValueAtTime(180, now + duration);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    source.stop(now + duration);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  } catch {}
}

/** Joyful space fanfare when reaching orbit or clearing checks. */
export function synthesizeFanfare(ctx: AudioContext): void {
  try {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.1);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + idx * 0.1 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.1);
      osc.stop(ctx.currentTime + idx * 0.1 + 0.38);
    });
  } catch {}
}

/** Cute cartoon boing for coming soon / error. */
export function synthesizeBoing(ctx: AudioContext): void {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(450, ctx.currentTime + 0.15);
    osc.frequency.linearRampToValueAtTime(180, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.36);
  } catch {}
}

/** Quindar radio beep. */
export function synthesizeRadioBeep(ctx: AudioContext, intro = true): void {
  try {
    const freq = intro ? 2525 : 2475;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  } catch {}
}

/** Countdown sequencer blip. */
export function synthesizeCountdownBeep(ctx: AudioContext, isTZero = false): void {
  try {
    const freq = isTZero ? 1760 : 880;
    const duration = isTZero ? 0.45 : 0.12;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(isTZero ? 0.35 : 0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration + 0.02);
  } catch {}
}

/** Deep structural separation thud for staging & fairings. */
export function synthesizeStagingThud(ctx: AudioContext): void {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(28, ctx.currentTime + 0.5);

    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.58);
  } catch {}
}
