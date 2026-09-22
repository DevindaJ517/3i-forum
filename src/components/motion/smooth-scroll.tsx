"use client";

import { useEffect } from "react";

// Lenis smooth scrolling on desktop, driven by GSAP's ticker so ScrollTrigger
// stays in sync.
export function SmoothScroll() {
  useEffect(() => {
    // Touch devices keep native scrolling: it's smoother and cheaper there.
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.matchMedia("(pointer: coarse)").matches
    ) {
      return;
    }

    let cancelled = false;
    let cleanup = () => {};

    (async () => {
      const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([
        import("lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      const lenis = new Lenis({ lerp: 0.1, anchors: true });
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      const lock = () => lenis.stop();
      const unlock = () => lenis.start();
      window.addEventListener("intro:lock", lock);
      window.addEventListener("intro:unlock", unlock);
      if (document.documentElement.classList.contains("intro-lock")) lenis.stop();

      cleanup = () => {
        window.removeEventListener("intro:lock", lock);
        window.removeEventListener("intro:unlock", unlock);
        gsap.ticker.remove(tick);
        lenis.destroy();
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return null;
}
