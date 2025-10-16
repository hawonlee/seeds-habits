import { useEffect, useRef, useState } from 'react';

export const useContainerWidth = <T extends HTMLElement>() => {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState<number>(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => setWidth(el.getBoundingClientRect().width);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref.current]);

  return { ref, width } as const;
};


