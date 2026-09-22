import Link from "next/link";
import { HeaderShell } from "./header-shell";

export function SiteHeader() {
  return (
    <HeaderShell>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-8">
        <Link href="/" className="display flex items-baseline gap-2 text-3xl text-white" aria-label="3i Forum home">
          <span className="text-brand normal-case">3i</span>
          <span>Forum</span>
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
