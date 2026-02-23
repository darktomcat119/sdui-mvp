import { useRef, useEffect } from 'react';

/* ── Logo grid (same "C" bracket as Logo.tsx) ── */
const GRID_CELLS = [
  { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
  { row: 1, col: 0 },
  { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 },
];
const CELL = 26;
const GAP = 5;
const SPAN = CELL * 3 + GAP * 2;

/* ── Timing (ms) ── */
const T_COLLECT = 2400;
const T_HOLD = 3000;
const T_SCATTER = 2200;
const T_PAUSE = 1400;
const CYCLE = T_COLLECT + T_HOLD + T_SCATTER + T_PAUSE;

/* ── Colors ── */
const TEAL = { r: 30, g: 158, b: 188 };
const BLUE = { r: 30, g: 58, b: 95 };
const CYAN = { r: 80, g: 200, b: 220 };

function rgba(c: typeof TEAL, a: number) {
  return `rgba(${c.r},${c.g},${c.b},${a})`;
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function easeOutQuart(t: number) {
  return 1 - (1 - t) ** 4;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/* ── Logo group definition ── */
interface CellState { sx: number; sy: number; rot: number; phase: number }
interface LogoGroup {
  fx: number; fy: number;
  scale: number;
  opacityMul: number;
  timeOffset: number;
  scatter: number;
  cells: CellState[];
}

const GROUPS: Omit<LogoGroup, 'cells'>[] = [
  { fx: 0.13, fy: 0.16, scale: 1.05, opacityMul: 1.0, timeOffset: 0, scatter: 170 },
  { fx: 0.87, fy: 0.14, scale: 0.85, opacityMul: 0.85, timeOffset: 2400, scatter: 150 },
  { fx: 0.09, fy: 0.84, scale: 0.95, opacityMul: 0.9, timeOffset: 4800, scatter: 160 },
  { fx: 0.88, fy: 0.86, scale: 1.1, opacityMul: 1.0, timeOffset: 1800, scatter: 180 },
  { fx: 0.05, fy: 0.50, scale: 0.7, opacityMul: 0.65, timeOffset: 3600, scatter: 130 },
  { fx: 0.95, fy: 0.50, scale: 0.72, opacityMul: 0.7, timeOffset: 5400, scatter: 135 },
  { fx: 0.50, fy: 0.05, scale: 0.55, opacityMul: 0.5, timeOffset: 4200, scatter: 110 },
  { fx: 0.50, fy: 0.95, scale: 0.55, opacityMul: 0.5, timeOffset: 6600, scatter: 110 },
];

/* ── Floating orbs ── */
interface Orb {
  x: number; y: number;
  vx: number; vy: number;
  radius: number;
  baseOpacity: number;
  pulseSpeed: number;
  pulseOffset: number;
  color: typeof TEAL;
  /** depth layer 0-1 for parallax */
  depth: number;
}

/* ── Small ambient dots ── */
interface Dot {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  opacity: number;
  depth: number;
}

function buildGroup(cfg: Omit<LogoGroup, 'cells'>): LogoGroup {
  return {
    ...cfg,
    cells: GRID_CELLS.map(() => {
      const a = Math.random() * Math.PI * 2;
      const d = cfg.scatter * (0.4 + Math.random() * 0.6);
      return {
        sx: Math.cos(a) * d,
        sy: Math.sin(a) * d,
        rot: (Math.random() - 0.5) * Math.PI * 1.6,
        phase: Math.random() * Math.PI * 2,
      };
    }),
  };
}

export function LogoParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let W = 0;
    let H = 0;
    const dpr = window.devicePixelRatio || 1;

    /* ── Mouse tracking for parallax ── */
    const onMouse = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / W - 0.5) * 2;   // -1..1
      mouseRef.current.y = (e.clientY / H - 0.5) * 2;
      mouseRef.current.active = true;
    };
    window.addEventListener('mousemove', onMouse);

    /* ── Build data ── */
    const groups: LogoGroup[] = GROUPS.map(buildGroup);

    const orbs: Orb[] = [];
    const orbCount = 14;
    const orbColors = [TEAL, CYAN, BLUE, TEAL, CYAN];
    for (let i = 0; i < orbCount; i++) {
      orbs.push({
        x: Math.random() * 1600,
        y: Math.random() * 1000,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        radius: 30 + Math.random() * 80,
        baseOpacity: 0.015 + Math.random() * 0.025,
        pulseSpeed: 0.0005 + Math.random() * 0.001,
        pulseOffset: Math.random() * Math.PI * 2,
        color: orbColors[i % orbColors.length],
        depth: 0.2 + Math.random() * 0.5,
      });
    }

    const dots: Dot[] = [];
    const dotCount = 50;
    for (let i = 0; i < dotCount; i++) {
      dots.push({
        x: Math.random() * 1600,
        y: Math.random() * 1000,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        size: 1.5 + Math.random() * 4,
        opacity: 0.03 + Math.random() * 0.07,
        depth: 0.3 + Math.random() * 0.7,
      });
    }

    /* ── Resize ── */
    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const o of orbs) {
        if (o.x > W) o.x = Math.random() * W;
        if (o.y > H) o.y = Math.random() * H;
      }
      for (const d of dots) {
        if (d.x > W) d.x = Math.random() * W;
        if (d.y > H) d.y = Math.random() * H;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const t0 = performance.now();

    /* ── Progress helper ── */
    function getProgress(now: number, offset: number) {
      const e = ((now - t0 + offset) % CYCLE + CYCLE) % CYCLE;
      if (e < T_COLLECT) return easeInOutCubic(e / T_COLLECT);
      if (e < T_COLLECT + T_HOLD) return 1;
      if (e < T_COLLECT + T_HOLD + T_SCATTER)
        return 1 - easeOutQuart((e - T_COLLECT - T_HOLD) / T_SCATTER);
      return 0;
    }

    /* ── Parallax offset ── */
    function px(depth: number) {
      const m = mouseRef.current;
      const strength = 18 * depth;
      return { dx: m.x * strength, dy: m.y * strength };
    }

    /* ── Collect all live particle world positions for connection lines ── */
    const allPositions: { x: number; y: number; opacity: number }[] = [];

    /* ── Draw frame ── */
    const draw = (now: number) => {
      ctx.clearRect(0, 0, W, H);
      allPositions.length = 0;

      const time = now - t0;

      /* ── 1. Vignette ── */
      const vig = ctx.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, W * 0.75);
      vig.addColorStop(0, 'rgba(30, 58, 95, 0)');
      vig.addColorStop(1, 'rgba(10, 20, 35, 0.4)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      /* ── 2. Floating orbs (soft glowing circles) ── */
      for (const o of orbs) {
        o.x += o.vx;
        o.y += o.vy;
        if (o.x < -o.radius * 2) o.x = W + o.radius;
        if (o.x > W + o.radius * 2) o.x = -o.radius;
        if (o.y < -o.radius * 2) o.y = H + o.radius;
        if (o.y > H + o.radius * 2) o.y = -o.radius;

        const pulse = Math.sin(time * o.pulseSpeed + o.pulseOffset) * 0.4 + 0.6;
        const alpha = o.baseOpacity * pulse;
        const { dx, dy } = px(o.depth);

        const grad = ctx.createRadialGradient(
          o.x + dx, o.y + dy, 0,
          o.x + dx, o.y + dy, o.radius,
        );
        grad.addColorStop(0, rgba(o.color, alpha * 1.8));
        grad.addColorStop(0.4, rgba(o.color, alpha * 0.6));
        grad.addColorStop(1, rgba(o.color, 0));
        ctx.fillStyle = grad;
        ctx.fillRect(
          o.x + dx - o.radius, o.y + dy - o.radius,
          o.radius * 2, o.radius * 2,
        );
      }

      /* ── 3. Small ambient dots ── */
      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < -10) d.x = W + 10;
        if (d.x > W + 10) d.x = -10;
        if (d.y < -10) d.y = H + 10;
        if (d.y > H + 10) d.y = -10;

        const { dx, dy } = px(d.depth);
        const flicker = 0.7 + Math.sin(time * 0.002 + d.x * 0.01) * 0.3;
        const a = d.opacity * flicker;
        const sx = d.x + dx;
        const sy = d.y + dy;

        ctx.fillStyle = rgba(TEAL, a);
        ctx.beginPath();
        ctx.arc(sx, sy, d.size, 0, Math.PI * 2);
        ctx.fill();

        allPositions.push({ x: sx, y: sy, opacity: a });
      }

      /* ── 4. Logo groups ── */
      for (const g of groups) {
        const progress = getProgress(now, g.timeOffset);
        const gcx = g.fx * W;
        const gcy = g.fy * H;
        const s = g.scale;
        const cs = CELL * s;
        const gs = GAP * s;
        const { dx, dy } = px(0.6);

        for (let i = 0; i < GRID_CELLS.length; i++) {
          const { row, col } = GRID_CELLS[i];
          const c = g.cells[i];

          const tx = col * (cs + gs) - (SPAN * s) / 2 + cs / 2;
          const ty = row * (cs + gs) - (SPAN * s) / 2 + cs / 2;

          const x = c.sx * s * (1 - progress) + tx * progress;
          const y = c.sy * s * (1 - progress) + ty * progress;
          const rot = c.rot * (1 - progress);

          // Subtle floating wobble when held
          const wobbleX = progress > 0.9
            ? Math.sin(time * 0.001 + c.phase) * 1.5 * progress
            : 0;
          const wobbleY = progress > 0.9
            ? Math.cos(time * 0.0012 + c.phase) * 1.5 * progress
            : 0;

          const worldX = gcx + x + dx + wobbleX;
          const worldY = gcy + y + dy + wobbleY;

          // Opacity: brighter when collected, with breathing pulse
          const breath = progress > 0.8
            ? 1 + Math.sin(time * 0.0015 + c.phase) * 0.08
            : 1;
          const alpha = (0.04 + progress * 0.18) * g.opacityMul * breath;

          ctx.save();
          ctx.translate(worldX, worldY);
          ctx.rotate(rot);

          // Outer glow per cell
          if (progress > 0.3) {
            const glowA = (progress - 0.3) * 0.06 * g.opacityMul;
            const cellGlow = ctx.createRadialGradient(0, 0, cs * 0.3, 0, 0, cs * 1.2);
            cellGlow.addColorStop(0, rgba(CYAN, glowA));
            cellGlow.addColorStop(1, rgba(CYAN, 0));
            ctx.fillStyle = cellGlow;
            ctx.fillRect(-cs * 1.2, -cs * 1.2, cs * 2.4, cs * 2.4);
          }

          // The cell rectangle
          ctx.fillStyle = rgba(TEAL, alpha);
          roundRect(ctx, -cs / 2, -cs / 2, cs, cs, 3 * s);
          ctx.fill();

          // Subtle inner highlight
          if (progress > 0.5) {
            const hlA = (progress - 0.5) * 0.1 * g.opacityMul;
            ctx.fillStyle = rgba(CYAN, hlA);
            roundRect(ctx, -cs / 2 + 2, -cs / 2 + 2, cs - 4, cs * 0.35, 2 * s);
            ctx.fill();
          }

          ctx.restore();

          allPositions.push({ x: worldX, y: worldY, opacity: alpha });
        }

        // Group center glow when collected
        if (progress > 0.4) {
          const ga = (progress - 0.4) * 0.07 * g.opacityMul;
          const pulse = 1 + Math.sin(time * 0.001) * 0.15;
          const r = SPAN * s * 1.3 * pulse;
          const grad = ctx.createRadialGradient(
            gcx + dx, gcy + dy, 0,
            gcx + dx, gcy + dy, r,
          );
          grad.addColorStop(0, rgba(TEAL, ga));
          grad.addColorStop(0.5, rgba(CYAN, ga * 0.3));
          grad.addColorStop(1, rgba(TEAL, 0));
          ctx.fillStyle = grad;
          ctx.fillRect(gcx + dx - r, gcy + dy - r, r * 2, r * 2);
        }
      }

      /* ── 5. Constellation connection lines ── */
      const maxDist = 120;
      const maxDistSq = maxDist * maxDist;
      ctx.lineWidth = 0.5;

      for (let i = 0; i < allPositions.length; i++) {
        const a = allPositions[i];
        for (let j = i + 1; j < allPositions.length; j++) {
          const b = allPositions[j];
          const dx2 = a.x - b.x;
          const dy2 = a.y - b.y;
          const distSq = dx2 * dx2 + dy2 * dy2;
          if (distSq < maxDistSq) {
            const proximity = 1 - Math.sqrt(distSq) / maxDist;
            const lineAlpha = proximity * 0.12 * Math.min(a.opacity, b.opacity) * 10;
            if (lineAlpha > 0.003) {
              ctx.strokeStyle = rgba(TEAL, lineAlpha);
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  );
}
