import { useEffect, useRef, useState } from 'react';

export const useContainerWidth = <T extends HTMLElement>() => {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState<number>(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => setWidth(el.getBoundingClientRect().width);
    // Measure now, next frame, and after a short delay to catch programmatic resizes
    update();
    const rafId = requestAnimationFrame(update);
    const timeoutId = setTimeout(update, 50);

    const observer = new ResizeObserver(update);
    observer.observe(el);
    if (el.parentElement) observer.observe(el.parentElement);

    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [ref.current]);

  return { ref, width } as const;
};


