import { useEffect, useRef } from 'react';

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
}

export default function Orb3D({ className }) {
  const canvasRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let raf = 0;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    let width = 0;
    let height = 0;

    const layer = { x: 0.5, y: 0.45, r: 0.22, depth: 1.0, alpha: 1.0, tint: [66, 188, 244] };
    const secondaryLayer = { x: 0.62, y: 0.38, r: 0.13, depth: 0.6, alpha: 0.55, tint: [125, 211, 252] };
    const rings = Array.from({ length: 3 }, (_, index) => ({
      radius: 1.12 + index * 0.2,
      width: 0.9 + index * 0.25,
      speed: 0.15 + index * 0.06,
      alpha: 0.08 - index * 0.018,
    }));

    const particles = Array.from({ length: 60 }, (_, i) => ({
      seed: i + 1,
      orbit: 0.8 + Math.random() * 1.5,
      phase: Math.random() * Math.PI * 2,
      speed: 0.15 + Math.random() * 0.4,
      depth: 0.1 + Math.random() * 0.9,
      size: 0.8 + Math.random() * 2.5,
      hue: Math.random() < 0.7 ? 'rgba(66, 188, 244,' : 'rgba(100, 210, 255,',
      pulse: 0.5 + Math.random() * 1.5,
    }));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onPointerMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / Math.max(1, rect.width);
      const ny = (event.clientY - rect.top) / Math.max(1, rect.height);
      pointerRef.current.x = (nx - 0.5) * 2;
      pointerRef.current.y = (ny - 0.5) * 2;
    };

    const drawBackground = (time, px, py) => {
      ctx.clearRect(0, 0, width, height);

      const ambient = ctx.createRadialGradient(
        width * (0.18 + px * 0.02),
        height * (0.2 + py * 0.02),
        0,
        width * 0.18,
        height * 0.2,
        Math.max(width, height) * 0.7,
      );
      ambient.addColorStop(0, 'rgba(14, 165, 233, 0.16)');
      ambient.addColorStop(0.4, 'rgba(56, 189, 248, 0.08)');
      ambient.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = ambient;
      ctx.fillRect(0, 0, width, height);

      const base = ctx.createLinearGradient(0, 0, width, height);
      base.addColorStop(0, 'rgba(66, 188, 244, 0.08)');
      base.addColorStop(0.25, 'rgba(12, 74, 110, 0.08)');
      base.addColorStop(0.5, 'rgba(14, 165, 233, 0.04)');
      base.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, width, height);

      const cx = width * (0.5 + px * 0.08);
      const cy = height * (0.45 + py * 0.06);
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.85);
      glow.addColorStop(0, 'rgba(66, 188, 244, 0.12)');
      glow.addColorStop(0.4, 'rgba(14, 165, 233, 0.06)');
      glow.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      const sweep = ctx.createLinearGradient(0, height * 0.15, width, height * 0.9);
      sweep.addColorStop(0, 'rgba(255, 255, 255, 0)');
      sweep.addColorStop(0.45, 'rgba(125, 211, 252, 0.08)');
      sweep.addColorStop(0.7, 'rgba(56, 189, 248, 0.04)');
      sweep.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.translate(Math.sin(time * 0.1) * width * 0.04, 0);
      ctx.fillStyle = sweep;
      ctx.fillRect(-width * 0.1, 0, width * 1.2, height);
      ctx.restore();
    };

    const drawOrb = (time, layer, px, py) => {
      const centerX = width * layer.x + px * 40 * layer.depth;
      const centerY = height * layer.y + py * 30 * layer.depth;
      const radius = Math.min(width, height) * layer.r;

      const wobble = 0.05 + layer.depth * 0.04;
      const wobX = Math.cos(time * 0.8) * radius * wobble;
      const wobY = Math.sin(time * 0.7) * radius * wobble;

      const lightX = centerX - radius * 0.3 + wobX;
      const lightY = centerY - radius * 0.4 + wobY;

      ctx.save();
      ctx.globalAlpha = layer.alpha;

      // Outer glow
      ctx.shadowColor = 'rgba(66, 188, 244, 0.25)';
      ctx.shadowBlur = 60 * layer.depth;
      
      const orb = ctx.createRadialGradient(lightX, lightY, radius * 0.1, centerX, centerY, radius * 1.1);
      orb.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
      orb.addColorStop(0.2, `rgba(${layer.tint[0]}, ${layer.tint[1]}, ${layer.tint[2]}, 0.7)`);
      orb.addColorStop(0.6, `rgba(${layer.tint[0]}, ${layer.tint[1]}, ${layer.tint[2]}, 0.3)`);
      orb.addColorStop(1, 'rgba(30, 41, 59, 0.05)');

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = orb;
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // Inner 'Neural' structures (subtle lines)
      ctx.strokeStyle = `rgba(${layer.tint[0]}, ${layer.tint[1]}, ${layer.tint[2]}, 0.15)`;
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const angle = time * (0.2 + i * 0.1);
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radius * 0.8, radius * 0.3, angle, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
      return { x: centerX, y: centerY, r: radius };
    };

    const drawFieldLines = (time, anchor, px, py) => {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.translate(px * 12, py * 10);

      for (const ring of rings) {
        ctx.beginPath();
        ctx.ellipse(
          anchor.x,
          anchor.y,
          anchor.r * ring.radius,
          anchor.r * (0.48 + ring.radius * 0.05),
          time * ring.speed,
          0,
          Math.PI * 2,
        );
        ctx.lineWidth = ring.width;
        ctx.strokeStyle = `rgba(125, 211, 252, ${ring.alpha})`;
        ctx.stroke();
      }

      ctx.restore();
    };

    const drawLensFlare = (anchor, px, py) => {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const flareX = anchor.x + anchor.r * 1.15 + px * 18;
      const flareY = anchor.y - anchor.r * 0.85 + py * 12;

      const flare = ctx.createRadialGradient(flareX, flareY, 0, flareX, flareY, anchor.r * 0.42);
      flare.addColorStop(0, 'rgba(255, 255, 255, 0.75)');
      flare.addColorStop(0.25, 'rgba(186, 230, 253, 0.4)');
      flare.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = flare;
      ctx.beginPath();
      ctx.arc(flareX, flareY, anchor.r * 0.42, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(186, 230, 253, 0.14)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(flareX - anchor.r * 0.6, flareY);
      ctx.lineTo(flareX + anchor.r * 0.6, flareY);
      ctx.moveTo(flareX, flareY - anchor.r * 0.6);
      ctx.lineTo(flareX, flareY + anchor.r * 0.6);
      ctx.stroke();
      ctx.restore();
    };

    const drawParticles = (time, anchor, px, py) => {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      for (const p of particles) {
        const a = time * p.speed + p.phase;
        const orbitR = anchor.r * p.orbit * (0.7 + 0.3 * p.depth);
        const x = anchor.x + Math.cos(a) * orbitR + px * 35 * p.depth;
        const y = anchor.y + Math.sin(a * 1.2) * (orbitR * 0.5) + py * 25 * p.depth;
        
        const pulse = 0.8 + Math.sin(time * p.pulse + p.phase) * 0.2;
        const s = p.size * pulse * (0.6 + p.depth * 0.8);
        const alpha = (0.15 + 0.3 * p.depth) * pulse;

        ctx.fillStyle = `${p.hue}${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, s, 0, Math.PI * 2);
        ctx.fill();
        
        // Add a tiny bit of connect-the-dots for 'neural' feel
        if (p.seed % 8 === 0) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(anchor.x, anchor.y);
            ctx.strokeStyle = `rgba(66, 188, 244, ${ (alpha * 0.2).toFixed(3) })`;
            ctx.stroke();
        }
      }

      ctx.restore();
    };

    const draw = (t) => {
      const time = t * 0.001;
      const px = pointerRef.current.x;
      const py = pointerRef.current.y;

      drawBackground(time, px, py);
      const anchor = drawOrb(time, layer, px, py);
      drawOrb(time * 1.1, secondaryLayer, -px * 0.7, -py * 0.7);
      drawFieldLines(time, anchor, px, py);
      drawParticles(time, anchor, px, py);
      drawLensFlare(anchor, px, py);

      raf = window.requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    if (!prefersReducedMotion()) {
      raf = window.requestAnimationFrame(draw);
    } else {
      draw(0);
    }

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} />;
}
