"use client";

import { useState, useEffect, useRef } from "react";
import { useInView } from "framer-motion";
import { useReducedMotion } from "@/lib/motion";

/**
 * Animates a number from 0 → end over `duration` ms.
 * Only starts when the element is in view.
 * Instantly returns `end` when prefers-reduced-motion is on.
 */
export function useCountUp<T extends HTMLElement = HTMLElement>(
  end: number,
  duration = 900
): { value: number; ref: React.RefObject<T> } {
  const ref = useRef<T>(null);
  const isInView = useInView(ref, { once: true, margin: "-10px" });
  const prefersReduced = useReducedMotion();
  const [value, setValue] = useState(prefersReduced ? end : 0);

  useEffect(() => {
    if (!isInView) return;
    if (prefersReduced) { setValue(end); return; }

    let startTime: number | null = null;
    const startValue = 0;

    function step(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(startValue + (end - startValue) * eased));
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }, [isInView, end, duration, prefersReduced]);

  return { value, ref };
}
