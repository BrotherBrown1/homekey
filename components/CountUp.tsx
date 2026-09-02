"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

// Animates an integer up to `value` once the element scrolls into view.
//
// The server-rendered HTML (and the very first client paint) always shows
// the final number, so crawlers, link previews, screen readers, and anyone
// with reduced-motion enabled never see a "$0". The count-up is purely a
// progressive enhancement layered on top.

type Props = {
  value: number;
  suffix?: string;
  duration?: number; // ms
  className?: string;
};

const fmt = (n: number) => n.toLocaleString("en-US");

export function CountUp({ value, suffix = "", duration = 2400, className }: Props) {
  const [display, setDisplay] = useState(value);
  const [animate, setAnimate] = useState(false);
  const ref = useRef<HTMLSpanElement | null>(null);

  // Before the first paint, decide whether to animate. If so, reset to 0 and
  // wait for the element to scroll into view. useLayoutEffect runs after
  // hydration but before paint, so the reset itself is never visible.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") return;

    setDisplay(0);
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setAnimate(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!animate) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animate, value, duration]);

  return (
    <span ref={ref} className={className} aria-label={`${fmt(value)}${suffix}`}>
      {fmt(display)}
      {suffix}
    </span>
  );
}
