import Link from "next/link";
import { HeaderShell } from "./header-shell";
import { LogoMark } from "./logo-mark";

export function SiteHeader() {
  return (
    <HeaderShell>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-3 text-white sm:gap-4"
          aria-label="3i Forum with Stefan de Alwis, home"
        >
          <LogoMark className="h-12 w-auto shrink-0 text-brand sm:h-14" />
          <span className="flex flex-col items-start font-wordmark leading-tight">
            <span className="text-[1.15rem] font-semibold tracking-tight sm:text-[1.45rem]">
              Forum
            </span>
            <span className="text-[0.78rem] font-medium sm:text-[0.98rem]">With Stefan de Alwis</span>
          </span>
        </Link>
        <nav aria-label="Main">
          <Link href="/apply" className="btn-cta btn-cta-sm">
            Apply now <span className="cta-arrow">→</span>
          </Link>
        </nav>
      </div>
    </HeaderShell>
  );
}
