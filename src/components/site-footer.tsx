import Link from "next/link";

const SOCIAL = [
  { label: "YouTube", href: "https://www.youtube.com/@The3iShow/featured" },
  { label: "LinkedIn", href: "https://lk.linkedin.com/showcase/the3ishow/" },
  { label: "Instagram", href: "https://www.instagram.com/the3i.show/" },
  { label: "Facebook", href: "https://www.facebook.com/The3iShow" },
];

export function SiteFooter() {
  return (
    <footer id="site-footer" className="bg-ink text-paper">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-8 md:grid-cols-3">
        <div>
          <p className="display text-4xl text-white">
            <span className="text-brand normal-case">3i</span> Forum
          </p>
          <p className="mt-3 max-w-xs text-sm text-neutral-400">
            A community for Sri Lanka&apos;s entrepreneurs, from the team behind The 3i Show.
          </p>
        </div>
        <div>
          <h2 className="display mb-3 text-2xl text-brand">Forum</h2>
          <ul className="space-y-1.5 text-sm">
            <li>
              <Link href="/" className="hover:text-brand">
                Home
              </Link>
            </li>
            <li>
              <Link href="/apply" className="hover:text-brand">
                Apply for membership
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-brand">
                Privacy notice
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="display mb-3 text-2xl text-brand">The <span className="normal-case">3i</span> Show</h2>
          <ul className="space-y-1.5 text-sm">
            {SOCIAL.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="hover:text-brand">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-neutral-500 sm:px-8">
          © {new Date().getFullYear()} 3i Forum. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
