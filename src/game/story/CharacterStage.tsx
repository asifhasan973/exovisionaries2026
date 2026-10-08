import { useEffect, useRef, useState } from 'react';
import { characterAssetRoot, loadCharacterCompositor, requireCharacterPerformance } from './characterAssets.ts';
import type { CharacterAssetCompositor, LoadedCharacterArt } from './characterAssets.ts';
import type { CharacterCue, StoryCharacterId } from './types.ts';

// Actors share decoded atlases. Failed requests can be retried instead of caching rejection.
const artwork = new Map<StoryCharacterId, Promise<{ compositor: CharacterAssetCompositor; art: LoadedCharacterArt }>>();
function loadArtwork(character: StoryCharacterId) {
  let pending = artwork.get(character);
  if (!pending) {
    pending = loadCharacterCompositor().then(async compositor => ({
      compositor, art: await compositor.loadRigAssets(character, characterAssetRoot()),
    })).catch(error => { artwork.delete(character); throw error; });
    artwork.set(character, pending);
  }
  return pending;
}

export function CharacterStage({ cue, speaking, active, label }: {
  cue: CharacterCue; speaking: boolean; active: boolean; label: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const performance = useRef({ cue, speaking });
  const repaint = useRef<() => void>(() => {});
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  useEffect(() => { performance.current = { cue, speaking }; repaint.current(); }, [cue, speaking]);

  useEffect(() => {
    let disposed = false;
    let frame = 0;
    let observer: ResizeObserver | undefined;
    let loaded: Awaited<ReturnType<typeof loadArtwork>> | undefined;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = preference.matches;
    const origin = window.performance.now();
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
          loaded.compositor.drawCharacterRig(context, loaded.art, current.cue,
            loaded.compositor.sampleRigMotion(time - origin, current.speaking, reduced));
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
    const motionChanged = (event: MediaQueryListEvent) => { reduced = event.matches; redraw(); };
    loadArtwork(cue.character).then(result => {
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
  }, [cue.character, attempt]);

  return <figure className={`conversation-actor ${active ? 'is-active' : 'is-listening'}`} data-character={cue.character}
    data-expression={cue.expression} data-pose={cue.pose} data-speaking={speaking}>
    <canvas ref={canvas} role="img" aria-label={`${label}, ${cue.expression}`} />
    {status === 'loading' ? <span className="actor-status" role="status">Joining mission…</span> : null}
    {status === 'error' ? <button className="actor-status" onClick={() => { setStatus('loading'); setAttempt(value => value + 1); }}>Reload character</button> : null}
    <figcaption><span className="actor-dot" />{label}</figcaption>
  </figure>;
}
