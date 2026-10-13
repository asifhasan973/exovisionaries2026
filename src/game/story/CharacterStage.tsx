import { useGameSettings } from './gameSettingsContext.ts';
import { useEffect, useMemo, useRef, useState } from 'react';
import { characterAssetRoot, loadCharacterCompositor, requireCharacterPerformance } from './characterAssets.ts';
import type { CharacterArtId, CharacterAssetCompositor, LoadedCharacterArt } from './characterAssets.ts';
import type { CharacterCue } from './types.ts';
import { usePlayerGender } from './playerCharacter.tsx';

// Actors share decoded atlases. Failed requests can be retried instead of caching rejection.
const artwork = new Map<CharacterArtId, Promise<{ compositor: CharacterAssetCompositor; art: LoadedCharacterArt }>>();
function loadArtwork(character: CharacterArtId) {
  let pending = artwork.get(character);
  if (!pending) {
    pending = loadCharacterCompositor().then(async compositor => ({
      compositor, art: await compositor.loadRigAssets(character, characterAssetRoot()),
    })).catch(error => { artwork.delete(character); throw error; });
    artwork.set(character, pending);
  }
  return pending;
}

export function CharacterStage({ cue, speaking, active, label, speechTime }: {
  cue: CharacterCue; speaking: boolean; active: boolean; label: string; speechTime?: () => number;
}) {
  const { gentle } = useGameSettings();
  const gender = usePlayerGender();
  const artCue = useMemo(() => ({ ...cue, character: cue.character === 'commander' && gender === 'male' ? 'commander-male' as const : cue.character }), [cue, gender]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const performance = useRef({ cue: artCue, speaking, speechTime });
  const repaint = useRef<() => void>(() => {});
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  useEffect(() => { performance.current = { cue: artCue, speaking, speechTime }; repaint.current(); }, [artCue, speaking, speechTime]);

  useEffect(() => {
    let disposed = false;
    let frame = 0;
    let observer: ResizeObserver | undefined;
    let loaded: Awaited<ReturnType<typeof loadArtwork>> | undefined;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = gentle || preference.matches;
    const origin = window.performance.now();
    // Different blink clocks stop two people from blinking in perfect unison.
    const blinkOffset = artCue.character === 'chief' ? 1780 : artCue.character === 'commander-male' ? 940 : 0;
    let lastPaint = -Infinity;
    const paint = (time: number) => {
      frame = 0;
      if (disposed || document.hidden || !loaded || !canvas.current) return;
      // 30fps is sufficient for illustrated faces; no React updates per animation frame.
      if (time - lastPaint >= 32 || reduced) {
        const context = canvas.current.getContext('2d');
        if (context) {
          context.clearRect(0, 0, context.canvas.width, context.canvas.height);
          const current = performance.current;
          if (loaded.art.characterId !== current.cue.character) return;
          const motion = loaded.compositor.sampleRigMotion(time - origin + blinkOffset, current.speaking, reduced, current.speechTime?.());
          // A listening character stays calm; only the speaking actor gestures.
          loaded.compositor.drawCharacterRig(context, loaded.art, current.cue, motion);
        }
        lastPaint = time;
      }
      if (!reduced) frame = requestAnimationFrame(paint);
    };
    const redraw = () => {
      cancelAnimationFrame(frame); lastPaint = -Infinity;
      paint(window.performance.now());
    };
    repaint.current = redraw;
    const resize = () => {
      const target = canvas.current;
      if (!target) return;
      const bounds = target.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      target.width = Math.max(1, Math.round(bounds.width * ratio));
      target.height = Math.max(1, Math.round(bounds.height * ratio));
      redraw();
    };
    const motionChanged = (event: MediaQueryListEvent) => { reduced = gentle || event.matches; redraw(); };
    loadArtwork(artCue.character).then(result => {
      if (disposed) return;
      requireCharacterPerformance(result.art.manifest, performance.current.cue);
      loaded = result;
      setStatus('ready');
      observer = new ResizeObserver(resize);
      if (canvas.current) observer.observe(canvas.current);
      resize();
    }).catch(error => { if (!disposed) { console.error('Character loading failed', error); setStatus('error'); } });
    document.addEventListener('visibilitychange', redraw);
    preference.addEventListener('change', motionChanged);
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer?.disconnect();
      repaint.current = () => {};
      document.removeEventListener('visibilitychange', redraw);
      preference.removeEventListener('change', motionChanged);
    };
  }, [artCue.character, attempt, gentle]);

  return <figure className={`conversation-actor ${active ? 'is-active' : 'is-listening'}`} data-character={artCue.character}
    data-expression={cue.expression} data-pose={cue.pose} data-speaking={speaking}>
    <canvas ref={canvas} role="img" aria-label={`${label}, ${cue.expression}`} />
    {status === 'loading' ? <span className="actor-status" role="status">Joining mission…</span> : null}
    {status === 'error' ? <button className="actor-status" onClick={() => { setStatus('loading'); setAttempt(value => value + 1); }}>Reload character</button> : null}
    <figcaption><span className="actor-dot" />{label}</figcaption>
  </figure>;
}
