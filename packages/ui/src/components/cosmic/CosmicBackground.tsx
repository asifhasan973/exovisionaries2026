import { useEffect, useRef } from 'react';
import { isEngineFrozen } from '../../state/orientationLifecycleStore';
import {
  initStars,
  renderNebula,
  renderStars,
  updateAndRenderShootingStars,
  updateAndRenderMotes,
  STAR_COLORS,
  type Star,
  type ShootingStar,
  type CursorMote,
} from './cosmicRenderer';

export interface CosmicBackgroundProps {
  gentle?: boolean;
  className?: string;
}

/**
 * Interactive Cosmic Particle Canvas
 * Fully integrates with universal state freeze protocol
 */
export function CosmicBackground({ gentle = false, className = 'mission-home-cosmic-bg' }: CosmicBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animFrame = 0;
    let isDisposed = false;
    let width = 0;
    let height = 0;

    let targetPointerX = 0;
    let targetPointerY = 0;
    let currentPointerX = 0;
    let currentPointerY = 0;

    let stars: Star[] = [];
    const shootingStars: ShootingStar[] = [];
    const motes: CursorMote[] = [];

    let nebulaTime = 0;

    const handleResize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      stars = initStars(width, height);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);
    handleResize();

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientY : (e as MouseEvent).clientY;

      targetPointerX = (clientX / Math.max(width, 1) - 0.5) * 2;
      targetPointerY = (clientY / Math.max(height, 1) - 0.5) * 2;

      if (motes.length < 35 && !gentle) {
        motes.push({
          x: clientX,
          y: clientY,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5 - 0.4,
          size: Math.random() * 2 + 1,
          alpha: 0.8,
          life: 0,
          maxLife: 25 + Math.random() * 20,
          color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
        });
      }
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    let lastShootingStarTime = performance.now();
    let nextShootingStarDelay = 3500 + Math.random() * 4500;

    const spawnShootingStar = () => {
      const startX = Math.random() * width * 0.8 + width * 0.2;
      const startY = Math.random() * height * 0.4;
      const speed = 14 + Math.random() * 8;
      const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.35;

      shootingStars.push({
        x: startX,
        y: startY,
        vx: -Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: 80 + Math.random() * 120,
        alpha: 0.9,
        decay: 0.02 + Math.random() * 0.02,
        active: true,
      });
    };

    let lastFrameTime = performance.now();

    const render = (now: number) => {
      if (isDisposed || document.hidden || isEngineFrozen()) return;

      const delta = Math.min(now - lastFrameTime, 64);
      lastFrameTime = now;

      currentPointerX += (targetPointerX - currentPointerX) * 0.06;
      currentPointerY += (targetPointerY - currentPointerY) * 0.06;

      ctx.clearRect(0, 0, width, height);

      nebulaTime += gentle ? 0.001 : 0.003;
      renderNebula(ctx, width, height, nebulaTime, currentPointerX, currentPointerY);
      renderStars(ctx, stars, width, height, currentPointerX, currentPointerY, gentle);

      if (now - lastShootingStarTime > nextShootingStarDelay && !gentle) {
        spawnShootingStar();
        lastShootingStarTime = now;
        nextShootingStarDelay = 4000 + Math.random() * 5500;
      }

      updateAndRenderShootingStars(ctx, shootingStars, height, delta);
      updateAndRenderMotes(ctx, motes, delta);

      animFrame = requestAnimationFrame(render);
    };

    const startLoop = () => {
      cancelAnimationFrame(animFrame);
      if (!document.hidden && !isEngineFrozen()) {
        lastFrameTime = performance.now();
        animFrame = requestAnimationFrame(render);
      }
    };

    const stopLoop = () => {
      cancelAnimationFrame(animFrame);
    };

    window.addEventListener('game-orientation-pause', stopLoop);
    window.addEventListener('game-orientation-resume', startLoop);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopLoop();
      else startLoop();
    });

    startLoop();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animFrame);
      resizeObserver.disconnect();
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('game-orientation-pause', stopLoop);
      window.removeEventListener('game-orientation-resume', startLoop);
    };
  }, [gentle]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}

