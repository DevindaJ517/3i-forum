"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LOGO_PATH, LOGO_VIEWBOX, LogoMark } from "@/components/logo-mark";
import type { ParticleEngine } from "./particles";

type Phase = "pending" | "playing" | "landing" | "done";

const WORDS = ["Founders", "Innovators", "Leaders", "Entrepreneurs"];

// Survives client-side navigation, so returning to the home page from
// /apply doesn't replay the intro. The server always renders "pending".
let introPlayed = false;

const SESSION_KEY = "3i-intro-seen";

function readSeen() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function markSeen() {
  introPlayed = true;
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // Private mode etc. Replaying the intro is harmless.
  }
}

function lockScroll(locked: boolean) {
  document.documentElement.classList.toggle("intro-lock", locked);
  window.dispatchEvent(new Event(locked ? "intro:lock" : "intro:unlock"));
}

export function Hero() {
  const [phase, setPhase] = useState<Phase>(() => (introPlayed ? "done" : "pending"));
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const skipRef = useRef<() => void>(() => {});

  useEffect(() => {
    const section = sectionRef.current!;
    const canvas = canvasRef.current!;
    let engine: ParticleEngine | null = null;
    let cancelled = false;
    const cleanups: Array<() => void> = [];

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Skip when already seen, when the user prefers less motion, when the
    // page was restored mid-scroll, or when JS arrived too late to be worth it
    // (the CSS failsafe will already have revealed the content).
    const skipIntro =
      introPlayed || readSeen() || reducedMotion || window.scrollY > 40 || performance.now() > 5000;

    const finish = () => {
      markSeen();
      setPhase("done");
      lockScroll(false);
    };

    async function init() {
      const [{ gsap }, particles] = await Promise.all([import("gsap"), import("./particles")]);
      if (cancelled) return;
      // Keep animations on real clock time: on a struggling phone the intro
      // drops frames but still finishes on schedule instead of dragging on.
      gsap.ticker.lagSmoothing(0);

      const coarse = window.matchMedia("(pointer: coarse)").matches;
      const cores = navigator.hardwareConcurrency || 4;
      let count = Math.round((window.innerWidth * window.innerHeight) / 100);
      // Phones get a smaller budget: plenty for the effect, easy on battery and memory.
      count = Math.min(coarse ? 4500 : 14000, Math.max(coarse ? 2500 : 3500, count));
      if (cores <= 4) count = Math.round(count * 0.6);

      try {
        engine = particles.createParticleEngine(canvas, {
          count,
          maxPixelRatio: coarse ? 1.25 : 2,
          onContextLost: () => finish(),
        });
      } catch {
        engine = null;
      }

      if (engine) {
        const e = engine;
        cleanups.push(() => e.destroy());

        // Only render while the hero is on screen and the tab is visible.
        let onScreen = true;
        const sync = () => (onScreen && !document.hidden ? e.start() : e.stop());
        const io = new IntersectionObserver(([entry]) => {
          onScreen = entry.isIntersecting;
          sync();
        });
        io.observe(section);
        document.addEventListener("visibilitychange", sync);
        cleanups.push(() => {
          io.disconnect();
          document.removeEventListener("visibilitychange", sync);
        });

        // Scroll: the sphere expands and fades as the hero leaves.
        let ticking = false;
        const onScroll = () => {
          if (ticking) return;
          ticking = true;
          requestAnimationFrame(() => {
            ticking = false;
            e.state.scroll = Math.min(1, Math.max(0, window.scrollY / section.offsetHeight));
          });
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        cleanups.push(() => window.removeEventListener("scroll", onScroll));

        // Mouse tilt (desktop only; touch would fight with scrolling).
        if (!coarse) {
          const onMove = (ev: PointerEvent) =>
            e.setPointer((ev.clientX / window.innerWidth - 0.5) * 2, (ev.clientY / window.innerHeight - 0.5) * 2);
          window.addEventListener("pointermove", onMove, { passive: true });
          cleanups.push(() => window.removeEventListener("pointermove", onMove));
        }

        // Resize, ignoring the small height jumps of mobile URL bars.
        let lastW = window.innerWidth;
        let lastH = window.innerHeight;
        let timer: ReturnType<typeof setTimeout>;
        const onResize = () => {
          clearTimeout(timer);
          timer = setTimeout(() => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            if (w === lastW && Math.abs(h - lastH) < 140) return;
            lastW = w;
            lastH = h;
            e.resize();
          }, 150);
        };
        window.addEventListener("resize", onResize);
        cleanups.push(() => {
          clearTimeout(timer);
          window.removeEventListener("resize", onResize);
        });
      }

      if (skipIntro || !engine) {
        if (engine) {
          engine.state.morphSphere = 1;
          gsap.to(engine.state, { alpha: 1, duration: 1.2, ease: "power1.out" });
        }
        finish();
        return;
      }

      // --- Intro -------------------------------------------------------------
      const e = engine;
      const wide = e.aspect >= 1;
      const points = particles.samplePathPoints(LOGO_PATH, LOGO_VIEWBOX, count, {
        worldHeight: wide ? 1.05 : 0.8,
        maxWorldWidth: e.aspect * 2 * 0.7,
        offsetY: 0.2,
      });
      if (cancelled) return;
      e.setTextTargets(points);

      window.scrollTo(0, 0);
      lockScroll(true);
      setPhase("playing");
      // Belt and braces: never leave the page locked, whatever happens.
      const safety = setTimeout(finish, 9000);
      cleanups.push(() => clearTimeout(safety));

      const words = section.querySelectorAll<HTMLElement>("[data-intro-word]");
      const caption = section.querySelector<HTMLElement>("[data-intro-caption]");
      const s = e.state;

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.to(s, { alpha: 1, duration: 1, ease: "power1.out" }, 0);

      const step = 0.36;
      words.forEach((word, i) => {
        const at = 0.2 + i * step;
        const last = i === words.length - 1;
        tl.fromTo(word, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.28 }, at);
        tl.to(word, { yPercent: -100, opacity: 0, duration: 0.24, ease: "power3.in" }, at + (last ? 0.55 : 0.26));
      });

      const formAt = 0.2 + words.length * step + 0.25;
      tl.to(s, { morphText: 1, duration: 1.2, ease: "power2.inOut" }, formAt);
      if (caption) {
        tl.fromTo(
          caption,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.8 },
          formAt + 0.7,
        );
        tl.to(caption, { opacity: 0, y: -12, duration: 0.35, ease: "power2.in" }, formAt + 1.75);
      }

      const burstAt = formAt + 1.85;
      tl.to(s, { morphSphere: 1, duration: 1.7, ease: "power3.inOut" }, burstAt);
      tl.call(() => setPhase("landing"), [], burstAt + 0.55);
      tl.call(finish, [], burstAt + 1.5);

      skipRef.current = () => {
        tl.kill();
        words.forEach((w) => gsap.set(w, { opacity: 0 }));
        if (caption) gsap.set(caption, { opacity: 0 });
        gsap.to(s, { morphText: 1, morphSphere: 1, alpha: 1, duration: 0.8, ease: "power2.out" });
        finish();
      };
      cleanups.push(() => tl.kill());
    }

    init().catch(() => finish());

    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
      lockScroll(false);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="intro"
      data-intro={phase}
      className="relative isolate flex min-h-svh items-end overflow-hidden bg-ink text-white"
    >
      <canvas ref={canvasRef} aria-hidden="true" className="hero-canvas absolute inset-x-0 top-0 -z-20 h-svh w-full" />
      <div aria-hidden="true" className="hero-shade absolute inset-0 -z-10" />

      {/* Intro overlay */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-10 h-svh">
        <div className="intro-loader absolute inset-0 flex flex-col items-center justify-center gap-4">
          <span className="display text-7xl text-brand normal-case">3i</span>
          <span className="intro-loader-bar h-px w-24 bg-brand/60" />
        </div>
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 overflow-hidden text-center">
          <div className="display relative h-[1em] text-[15vw] text-white md:text-[8rem]">
            {WORDS.map((w) => (
              <span key={w} data-intro-word className="absolute inset-0 opacity-0">
                {w}
              </span>
            ))}
          </div>
        </div>
        <div
          data-intro-caption
          className="absolute inset-x-0 top-[70%] px-4 text-center opacity-0 md:top-[76%]"
        >
          <p className="display text-4xl tracking-[0.3em] text-white md:text-6xl">Forum</p>
          <p className="mt-2 text-sm tracking-[0.35em] text-white/70 uppercase md:text-base">with Stefan de Alwis</p>
        </div>
      </div>

      {phase === "playing" && (
        <button
          type="button"
          onClick={() => skipRef.current()}
          className="absolute right-4 bottom-[max(env(safe-area-inset-bottom),1.25rem)] z-20 border border-white/25 display px-4 pt-2 pb-1.5 text-lg tracking-widest text-white/80 uppercase backdrop-blur-sm transition-colors hover:border-brand hover:text-brand sm:right-8"
        >
          Skip intro
        </button>
      )}

      {/* Landing content */}
      <div className="mx-auto w-full max-w-7xl px-4 pt-32 pb-[max(env(safe-area-inset-bottom),2.5rem)] sm:px-8 sm:pb-20">
        <p className="land land-1 mb-5 inline-flex items-center gap-2.5 border border-brand/40 bg-ink/60 px-3 pt-1.5 pb-1 backdrop-blur-sm">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-brand" />
          </span>
          <span className="display text-lg tracking-wider text-brand sm:text-xl">Applications now open</span>
        </p>
        {/* Lockup, mirroring the header: logo mark, then Forum over "with Stefan de Alwis". */}
        <h1>
          <span className="sr-only">3i Forum with Stefan de Alwis</span>
          <span aria-hidden="true" className="grid grid-cols-[auto_1fr] items-center gap-x-[4vw] sm:gap-x-8">
            <LogoMark className="land land-2 row-span-2 aspect-[543/646] h-full w-auto text-brand" />
            <span className="land land-2 display block text-[19vw] leading-[0.8] whitespace-nowrap sm:text-[12vw] lg:text-[11rem]">
              Forum
            </span>
            <span className="land land-3 mt-2 block text-sm tracking-[0.2em] whitespace-nowrap text-paper uppercase sm:mt-3 sm:text-2xl sm:tracking-[0.3em] lg:text-3xl">
              with Stefan de Alwis
            </span>
          </span>
        </h1>
        <div className="mt-8 flex flex-col gap-6 sm:mt-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="land land-4 max-w-xl">
            <p className="display text-3xl text-brand sm:text-4xl">Connect. Learn. Build. Grow.</p>
            <p className="mt-2 text-lg text-paper sm:text-xl">
              A home for Sri Lanka&apos;s entrepreneurs, from the team behind The 3i Show.
            </p>
          </div>
          <div className="land land-5">
            <Link href="/apply" className="btn-cta w-full text-2xl sm:w-auto sm:text-3xl">
              Apply for membership <span className="cta-arrow">→</span>
            </Link>
          </div>
        </div>
      </div>

      <div aria-hidden="true" className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 lg:block">
        <div className="land land-6 flex flex-col items-center gap-1 text-xs tracking-[0.3em] text-white/50">
          SCROLL
          <span className="scroll-cue block h-8 w-px bg-white/40" />
        </div>
      </div>
    </section>
  );
}
