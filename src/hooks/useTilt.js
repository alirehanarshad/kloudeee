import { useEffect, useRef } from 'react';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function useTilt({ max = 8, disabled = false } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || disabled) return undefined;

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    const finePointer = window.matchMedia?.('(pointer: fine)')?.matches;
    const hoverable = window.matchMedia?.('(hover: hover)')?.matches;
    if (prefersReducedMotion || !finePointer || !hoverable) return undefined;

    let raf = 0;

    const setVars = ({ rx, ry, px, py }) => {
      element.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
      element.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
      element.style.setProperty('--px', `${px.toFixed(2)}%`);
      element.style.setProperty('--py', `${py.toFixed(2)}%`);
    };

    const reset = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setVars({ rx: 0, ry: 0, px: 50, py: 50 });
      });
    };

    const handleMove = (event) => {
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);

      const rx = (0.5 - y) * max * 2;
      const ry = (x - 0.5) * max * 2;

      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setVars({ rx, ry, px: x * 100, py: y * 100 });
      });
    };

    element.addEventListener('pointermove', handleMove);
    element.addEventListener('pointerleave', reset);
    element.addEventListener('pointercancel', reset);
    element.addEventListener('blur', reset, true);

    reset();
    return () => {
      if (raf) cancelAnimationFrame(raf);
      element.removeEventListener('pointermove', handleMove);
      element.removeEventListener('pointerleave', reset);
      element.removeEventListener('pointercancel', reset);
      element.removeEventListener('blur', reset, true);
    };
  }, [disabled, max]);

  return ref;
}

