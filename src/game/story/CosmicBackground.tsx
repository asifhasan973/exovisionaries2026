import { useEffect, useRef } from 'react';
import { isEngineFrozen } from '../../state/orientationLifecycleStore';
import { useGameSettings } from './gameSettingsContext';

interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  twinkleSpeed: number;
  phase: number;
  color: string;
  depth: number; // 0 (far) to 1 (near) for parallax calculation
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  alpha: number;
  decay: number;
  active: boolean;
}

interface CursorMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
}

const STAR_COLORS = [
  '#ffffff', // Diamond white
  '#8ce2c2', // Lunar cyan
  '#ffdf89', // Solar gold
  '#dba3ef', // Deep nebula violet
  '#99c6ff', // Stellar blue
];

/**
 * Interactive Cosmic Particle Canvas
 * Features:
 * - Ambient twinkling multi-layered starfield
 * - Passing shooting stars with glowing dissipation trails
 * - Ambient drifting nebula dust gradients
 * - Parallax depth reaction to touch and cursor movement
 * - Fully integrates with universal state freeze protocol (pauses during orientation blocks/loading)
 */
export function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { gentle } = useGameSettings();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animFrame = 0;
    let isDisposed = false;
    let width = 0;
    let height = 0;

    // Pointer coordinates with smoothed interpolation
    let targetPointerX = 0;
    let targetPointerY = 0;
    let currentPointerX = 0;
    let currentPointerY = 0;

    // Procedural entities
    let stars: Star[] = [];
    const shootingStars: ShootingStar[] = [];
    const motes: CursorMote[] = [];

    // Nebula dust offsets
    let nebulaTime = 0;

    // Generate stars scaled to current dimensions
    const initStars = (w: number, h: number) => {
      const starCount = Math.floor(Math.min(180, Math.max(70, (w * h) / 10000)));
      stars = Array.from({ length: starCount }, () => {
        const depth = Math.random();
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          size: 0.5 + depth * 1.5,
          baseAlpha: 0.25 + depth * 0.55,
          alpha: 0.5,
          twinkleSpeed: 0.015 + Math.random() * 0.035,
          phase: Math.random() * Math.PI * 2,
          color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
          depth,
        };
      });
    };

    // Resize observer handling device pixel ratio
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

      initStars(width, height);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);
    handleResize();

    // Pointer reaction handlers
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientY : (e as MouseEvent).clientY;

      targetPointerX = (clientX / Math.max(width, 1) - 0.5) * 2;
      targetPointerY = (clientY / Math.max(height, 1) - 0.5) * 2;

      // Spawn ephemeral stardust motes on movement
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

    // Periodic shooting star spawner
    let lastShootingStarTime = performance.now();
    let nextShootingStarDelay = 3500 + Math.random() * 4500;

    const spawnShootingStar = () => {
      const startX = Math.random() * width * 0.8 + width * 0.2;
      const startY = Math.random() * height * 0.4;
      const speed = 14 + Math.random() * 8;
      const angle = (Math.PI / 4) + (Math.random() - 0.5) * 0.35; // ~45 deg downward

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

    // Main render loop
    const render = (now: number) => {
      if (isDisposed || document.hidden || isEngineFrozen()) return;

      const delta = Math.min(now - lastFrameTime, 64);
      lastFrameTime = now;

      // Smooth pointer easing
      currentPointerX += (targetPointerX - currentPointerX) * 0.06;
      currentPointerY += (targetPointerY - currentPointerY) * 0.06;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw subtle drifting cosmic nebula clouds
      nebulaTime += gentle ? 0.001 : 0.003;
      const nebulaShiftX = currentPointerX * -15;
      const nebulaShiftY = currentPointerY * -10;

      // Primary cyan nebula cloud
      const grad1 = ctx.createRadialGradient(
        width * 0.3 + Math.sin(nebulaTime) * 30 + nebulaShiftX,
        height * 0.4 + Math.cos(nebulaTime * 0.8) * 20 + nebulaShiftY,
        10,
        width * 0.3 + nebulaShiftX,
        height * 0.4 + nebulaShiftY,
        width * 0.45
      );
      grad1.addColorStop(0, 'rgba(140, 226, 194, 0.08)');
      grad1.addColorStop(0.6, 'rgba(88, 140, 190, 0.03)');
      grad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      // Secondary magenta / purple nebula cloud
      const grad2 = ctx.createRadialGradient(
        width * 0.75 + Math.cos(nebulaTime * 0.7) * 40 + nebulaShiftX * 0.8,
        height * 0.55 + Math.sin(nebulaTime * 0.9) * 25 + nebulaShiftY * 0.8,
        15,
        width * 0.75 + nebulaShiftX * 0.8,
        height * 0.55 + nebulaShiftY * 0.8,
        width * 0.5
      );
      grad2.addColorStop(0, 'rgba(219, 163, 239, 0.07)');
      grad2.addColorStop(0.55, 'rgba(90, 53, 118, 0.04)');
      grad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw multi-layered twinkling starfield
      const parallaxFactor = gentle ? 0 : 1;
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        star.phase += star.twinkleSpeed;
        const twinkle = Math.sin(star.phase) * 0.35;
        star.alpha = Math.max(0.1, Math.min(1, star.baseAlpha + twinkle));

        // Parallax offset proportional to depth
        const offsetX = currentPointerX * star.depth * 18 * parallaxFactor;
        const offsetY = currentPointerY * star.depth * 14 * parallaxFactor;

        let renderX = star.x + offsetX;
        let renderY = star.y + offsetY;

        // Wrap around bounds softly
        if (renderX < 0) renderX += width;
        else if (renderX > width) renderX -= width;
        if (renderY < 0) renderY += height;
        else if (renderY > height) renderY -= height;

        ctx.save();
        ctx.globalAlpha = star.alpha;
        ctx.fillStyle = star.color;

        ctx.beginPath();
        ctx.arc(renderX, renderY, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Subtle glow halo for larger near stars
        if (star.size > 1.3) {
          ctx.globalAlpha = star.alpha * 0.35;
          ctx.beginPath();
          ctx.arc(renderX, renderY, star.size * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 3. Update & render shooting stars
      if (now - lastShootingStarTime > nextShootingStarDelay && !gentle) {
        spawnShootingStar();
        lastShootingStarTime = now;
        nextShootingStarDelay = 4000 + Math.random() * 5500;
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        if (!s.active) {
          shootingStars.splice(i, 1);
          continue;
        }

        s.x += s.vx * (delta / 16.6);
        s.y += s.vy * (delta / 16.6);
        s.alpha -= s.decay * (delta / 16.6);

        if (s.alpha <= 0 || s.x < -100 || s.y > height + 100) {
          s.active = false;
          shootingStars.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, s.alpha);

        const tailX = s.x - (s.vx / 16) * s.length;
        const tailY = s.y - (s.vy / 16) * s.length;

        const starGrad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
        starGrad.addColorStop(0, '#ffffff');
        starGrad.addColorStop(0.2, '#8ce2c2');
        starGrad.addColorStop(0.7, 'rgba(219, 163, 239, 0.4)');
        starGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.strokeStyle = starGrad;
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        // Meteor head spark
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 4. Update & render cursor motes
      for (let i = motes.length - 1; i >= 0; i--) {
        const m = motes[i];
        m.life += delta / 16.6;
        if (m.life >= m.maxLife) {
          motes.splice(i, 1);
          continue;
        }

        m.x += m.vx;
        m.y += m.vy;
        const progress = m.life / m.maxLife;
        const currentAlpha = (1 - progress) * m.alpha;

        ctx.save();
        ctx.globalAlpha = currentAlpha;
        ctx.fillStyle = m.color;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size * (1 - progress * 0.5), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animFrame = requestAnimationFrame(render);
    };

    // State freeze & resume handling
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

  return (
    <canvas
      ref={canvasRef}
      className="mission-home-cosmic-bg"
      aria-hidden="true"
    />
  );
}
