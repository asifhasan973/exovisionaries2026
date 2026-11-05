export interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  twinkleSpeed: number;
  phase: number;
  color: string;
  depth: number;
}

export interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  alpha: number;
  decay: number;
  active: boolean;
}

export interface CursorMote {
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

export const STAR_COLORS = [
  '#ffffff',
  '#8ce2c2',
  '#ffdf89',
  '#dba3ef',
  '#99c6ff',
];

export function initStars(w: number, h: number): Star[] {
  const starCount = Math.floor(Math.min(180, Math.max(70, (w * h) / 10000)));
  return Array.from({ length: starCount }, () => {
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
}

export function renderNebula(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  nebulaTime: number,
  pointerX: number,
  pointerY: number,
) {
  const shiftX = pointerX * -15;
  const shiftY = pointerY * -10;

  const grad1 = ctx.createRadialGradient(
    width * 0.3 + Math.sin(nebulaTime) * 30 + shiftX,
    height * 0.4 + Math.cos(nebulaTime * 0.8) * 20 + shiftY,
    10,
    width * 0.3 + shiftX,
    height * 0.4 + shiftY,
    width * 0.45,
  );
  grad1.addColorStop(0, 'rgba(140, 226, 194, 0.08)');
  grad1.addColorStop(0.6, 'rgba(88, 140, 190, 0.03)');
  grad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad1;
  ctx.fillRect(0, 0, width, height);

  const grad2 = ctx.createRadialGradient(
    width * 0.75 + Math.cos(nebulaTime * 0.7) * 40 + shiftX * 0.8,
    height * 0.55 + Math.sin(nebulaTime * 0.9) * 25 + shiftY * 0.8,
    15,
    width * 0.75 + shiftX * 0.8,
    height * 0.55 + shiftY * 0.8,
    width * 0.5,
  );
  grad2.addColorStop(0, 'rgba(219, 163, 239, 0.07)');
  grad2.addColorStop(0.55, 'rgba(90, 53, 118, 0.04)');
  grad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad2;
  ctx.fillRect(0, 0, width, height);
}

export function renderStars(
  ctx: CanvasRenderingContext2D,
  stars: Star[],
  width: number,
  height: number,
  pointerX: number,
  pointerY: number,
  gentle: boolean,
) {
  const parallax = gentle ? 0 : 1;
  for (let i = 0; i < stars.length; i++) {
    const star = stars[i];
    star.phase += star.twinkleSpeed;
    const twinkle = Math.sin(star.phase) * 0.35;
    star.alpha = Math.max(0.1, Math.min(1, star.baseAlpha + twinkle));

    const offsetX = pointerX * star.depth * 18 * parallax;
    const offsetY = pointerY * star.depth * 14 * parallax;

    let rx = star.x + offsetX;
    let ry = star.y + offsetY;

    if (rx < 0) rx += width;
    else if (rx > width) rx -= width;
    if (ry < 0) ry += height;
    else if (ry > height) ry -= height;

    ctx.save();
    ctx.globalAlpha = star.alpha;
    ctx.fillStyle = star.color;

    ctx.beginPath();
    ctx.arc(rx, ry, star.size, 0, Math.PI * 2);
    ctx.fill();

    if (star.size > 1.3) {
      ctx.globalAlpha = star.alpha * 0.35;
      ctx.beginPath();
      ctx.arc(rx, ry, star.size * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export function updateAndRenderShootingStars(
  ctx: CanvasRenderingContext2D,
  shootingStars: ShootingStar[],
  height: number,
  delta: number,
) {
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

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function updateAndRenderMotes(
  ctx: CanvasRenderingContext2D,
  motes: CursorMote[],
  delta: number,
) {
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
}

