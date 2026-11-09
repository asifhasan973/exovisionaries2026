export interface RoverAudioNodes {
  oscillator: OscillatorNode;
  noise: AudioBufferSourceNode;
  gain: GainNode;
  filter: BiquadFilterNode;
}

export interface RocketAudioNodes {
  noise: AudioBufferSourceNode;
  gain: GainNode;
  filter: BiquadFilterNode;
}

/** Separate motor feedback for the practice game; never shares flight audio nodes. */
export function createRoverNodes(
  ctx: AudioContext,
  kind: "drive" | "drill",
): RoverAudioNodes {
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++)
    samples[i] = (Math.random() * 2 - 1) * 0.35;
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = kind === "drill" ? 1500 : 340;
  const oscillator = ctx.createOscillator();
  oscillator.type = "triangle";
  oscillator.frequency.value = kind === "drill" ? 155 : 72;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(
    kind === "drill" ? 0.065 : 0.045,
    ctx.currentTime + 0.12,
  );
  noise.connect(filter);
  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start();
  oscillator.start();
  return { noise, oscillator, filter, gain };
}

/** Continuous realistic rocket roar with low-pass filtering. */
export function createRocketRoarNodes(
  ctx: AudioContext,
  isMuted: boolean,
): RocketAudioNodes {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0.0;

  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    lastOut = (lastOut + 0.02 * white) / 1.02;
    data[i] = lastOut * 3.5;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(320, ctx.currentTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(isMuted ? 0 : 0.25, ctx.currentTime);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start();
  return { noise, gain, filter };
}
