"use client";

import { useEffect } from "react";

// Scroll-driven animations, declared in markup with data attributes:
//   data-anim="chars"   heading letters rise out of a mask
//   data-anim="words"   words fill in from dim to solid as you scroll
//   data-anim="reveal"  element fades up
//   data-anim="stagger" children fade up one after another
//   data-anim="line"    horizontal rule draws itself with scroll
//   data-speed="0.2"    parallax drift
//   data-stack-card     sticky cards shrink as the next one covers them
//
// Content is fully visible without JS or with reduced motion; animations are
// only applied on top.
export function ScrollEffects() {
  useEffect(() => {
    let cancelled = false;
    let revert = () => {};

    (async () => {
      const [{ gsap }, { ScrollTrigger }, { SplitText }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
        import("gsap/SplitText"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger, SplitText);
      // Phones resize the viewport whenever the address bar shows or hides.
      // Don't recalculate every trigger on that, it causes jumps and jank.
      ScrollTrigger.config({ ignoreMobileResize: true });
      await document.fonts.ready;
      if (cancelled) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const all = <T extends HTMLElement>(selector: string) => gsap.utils.toArray<T>(selector);

        all("[data-anim='chars']").forEach((el) => {
          SplitText.create(el, {
            type: "lines,chars",
            mask: "lines",
            autoSplit: true,
            onSplit: (self) =>
              gsap.from(self.chars, {
                yPercent: 115,
                duration: 1,
                ease: "expo.out",
                stagger: 0.018,
                scrollTrigger: { trigger: el, start: "top 88%", once: true },
              }),
          });
        });

        all("[data-anim='words']").forEach((el) => {
          SplitText.create(el, {
            type: "words",
            autoSplit: true,
            onSplit: (self) =>
              gsap.fromTo(
                self.words,
                { opacity: 0.14 },
                {
                  opacity: 1,
                  ease: "none",
                  stagger: 0.1,
                  scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 55%", scrub: true },
                },
              ),
          });
        });

        all("[data-anim='reveal']").forEach((el) => {
          gsap.from(el, {
            y: 60,
            opacity: 0,
            duration: 1.1,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          });
        });

        all("[data-anim='stagger']").forEach((el) => {
          gsap.from(el.children, {
            y: 60,
            opacity: 0,
            duration: 1,
            ease: "power3.out",
            stagger: 0.14,
            scrollTrigger: { trigger: el, start: "top 85%", once: true },
          });
        });

        all("[data-anim='line']").forEach((el) => {
          gsap.from(el, {
            scaleX: 0,
            transformOrigin: "left center",
            ease: "none",
            scrollTrigger: { trigger: el, start: "top 90%", end: "top 45%", scrub: true },
          });
        });

        all("[data-speed]").forEach((el) => {
          const speed = Number(el.dataset.speed) || 0.2;
          gsap.to(el, {
            yPercent: -speed * 100,
            ease: "none",
            scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: true },
          });
        });

        const cards = all("[data-stack-card]");
        cards.forEach((card, i) => {
          const next = cards[i + 1];
          if (!next) return;
          // Dim with an overlay's opacity, not a CSS filter: filters on large
          // elements are very expensive on phones (especially iOS Safari).
          const shade = card.querySelector("[data-stack-shade]");
          const scrollTrigger = { trigger: next, start: "top 85%", end: "top 25%", scrub: true };
          gsap.to(card, { scale: 0.92, ease: "none", scrollTrigger });
          if (shade) gsap.to(shade, { opacity: 0.5, ease: "none", scrollTrigger });
        });
      });

      revert = () => mm.revert();
      ScrollTrigger.refresh();
    })();

    return () => {
      cancelled = true;
      revert();
    };
  }, []);

  return null;
}
