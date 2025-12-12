import { useCallback, useEffect, useState, type RefCallback } from 'react';

export const useContainerWidth = <T extends HTMLElement>() => {
  const [node, setNode] = useState<T | null>(null);
  const [width, setWidth] = useState<number>(0);

  const measure = useCallback(() => {
    if (!node) return;
    const next = node.getBoundingClientRect().width;
    setWidth((prev) => (prev !== next ? next : prev));
  }, [node]);

  const ref = useCallback<RefCallback<T>>((el) => {
    setNode(el);
  }, []);

  useEffect(() => {
    if (!node) return;

    // Measure immediately to catch the current layout
    measure();
    const rafId = requestAnimationFrame(measure);
    const timeoutId = setTimeout(measure, 50);

    const observer = new ResizeObserver((entries) => {
      // Use observed size when available; fall back to direct measurement
      const entry = entries.find((e) => e.target === node || e.target === node.parentElement);
      if (entry) {
        const next = entry.contentRect.width;
        setWidth((prev) => (prev !== next ? next : prev));
      } else {
        measure();
      }
    });

    observer.observe(node);
    if (node.parentElement) observer.observe(node.parentElement);

    window.addEventListener('resize', measure);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure, node]);

  return { ref, width } as const;
};


