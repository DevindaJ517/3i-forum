"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// A thumb-reachable Apply button on phones. Appears once the hero has
// scrolled away and hides again near the final call-to-action and footer.
export function MobileApplyBar() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("intro");
    if (!hero) return;
    // Hide while any of these are on screen.
    const blockers = [hero, document.getElementById("final-cta"), document.getElementById("site-footer")].filter(
      (el): el is HTMLElement => el !== null,
    );
    const visible = new Map<Element, boolean>(blockers.map((el) => [el, el === hero]));

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => visible.set(entry.target, entry.isIntersecting));
      setShow(![...visible.values()].some(Boolean));
    });
    blockers.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div
      inert={!show}
      className={`fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-ink via-ink/90 to-transparent px-4 pt-6 pb-[max(env(safe-area-inset-bottom),0.85rem)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <Link href="/apply" className="btn-cta w-full text-2xl">
        Apply for membership <span className="cta-arrow">→</span>
      </Link>
    </div>
  );
}
