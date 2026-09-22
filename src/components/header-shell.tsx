"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

// Fixed header that gains a solid, blurred background once the page scrolls,
// so the Apply button is always reachable.
export function HeaderShell({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 40);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header data-scrolled={scrolled} className="site-header fixed inset-x-0 top-0 z-30">
      {children}
    </header>
  );
}
