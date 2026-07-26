"use client";

import { useCallback, useEffect, useState } from "react";

export function useInViewport<T extends Element = HTMLElement>(options?: {
  enabled?: boolean;
  rootMargin?: string;
}) {
  const enabled = options?.enabled ?? true;
  const rootMargin = options?.rootMargin ?? "200px";
  const [node, setNode] = useState<T | null>(null);
  const [hasIntersected, setHasIntersected] = useState(false);

  const ref = useCallback((nextNode: T | null) => {
    setNode(nextNode);
  }, []);

  useEffect(() => {
    if (!enabled || hasIntersected) return;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      queueMicrotask(() => setHasIntersected(true));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setHasIntersected(true);
        observer.disconnect();
      },
      { rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, hasIntersected, node, rootMargin]);

  return { ref, isInViewport: hasIntersected };
}
