import Link from "next/link";
import { Hero } from "@/components/hero/hero";
import { MobileApplyBar } from "@/components/mobile-apply-bar";
import { ScrollEffects } from "@/components/motion/scroll-effects";

const PILLARS = [
  {
    n: "01",
    title: "Connect",
    body: "Meet founders and business owners who understand the pressure of building something from the ground up in Sri Lanka.",
    sticky: "top-24",
  },
  {
    n: "02",
    title: "Learn",
    body: "Small, confidential peer forums where members share real experiences, not pitches. Learn from people who have been there.",
    sticky: "top-28",
  },
  {
    n: "03",
    title: "Build",
    body: "Turn ideas into action with practical workshops, frank feedback on your plans, and partners you can build alongside.",
    sticky: "top-32",
  },
  {
    n: "04",
    title: "Grow",
    body: "Access to mentors, investors and the voices featured on The 3i Show, plus events built around what members actually need.",
    sticky: "top-36",
  },
];

const STEPS = [
  { n: "01", title: "Apply", body: "Tell us about yourself and your business. It takes about five minutes." },
  { n: "02", title: "Review", body: "Our team reviews every application personally and may reach out for a short conversation." },
  { n: "03", title: "Join", body: "Approved members are welcomed into their first forum and the wider 3i community." },
];

const MARQUEE = ["Apply now", "✦", "Join 3i Forum", "✦", "Connect", "✦", "Learn", "✦", "Build", "✦", "Grow", "✦"];

function Marquee({ reverse = false, dark = false }: { reverse?: boolean; dark?: boolean }) {
  const items = [...MARQUEE, ...MARQUEE];
  return (
    <div className={`marquee overflow-hidden py-3 sm:py-4 ${dark ? "bg-ink text-brand" : "bg-brand text-ink"}`}>
      <div className={`marquee-track flex w-max gap-8 pr-8 ${reverse ? "reverse" : ""}`}>
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 gap-8" aria-hidden={copy === 1 ? true : undefined}>
            {items.map((word, i) => (
              <span key={i} className="display text-4xl whitespace-nowrap sm:text-6xl">
                {word === "Join 3i Forum" ? <>Join <span className="normal-case">3i</span> Forum</> : word}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* Intro statement */}
      <section className="on-brand overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-8 sm:py-36">
          <p data-anim="reveal" className="display mb-6 text-2xl sm:text-3xl">
            Why <span className="normal-case">3i</span> Forum
          </p>
          <h2 data-anim="words" className="display max-w-5xl text-5xl sm:text-7xl lg:text-8xl">
            Building a business can be lonely. It doesn&apos;t have to be. <span className="normal-case">3i</span> Forum
            is where Sri Lanka&apos;s founders, owners and leaders find people who get it.
          </h2>
        </div>
      </section>

      {/* Pillars: stacking cards */}
      <section className="bg-ink text-paper">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-8 sm:py-32">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h2 data-anim="chars" className="display text-6xl text-white sm:text-8xl lg:text-9xl">
              What you <span className="text-brand">get</span>
            </h2>
            <p data-anim="reveal" className="max-w-sm text-neutral-400">
              Connect, learn, build and grow. What every member gets, whatever stage your business is at.
            </p>
          </div>

          <div className="mt-14 space-y-6 sm:mt-20">
            {PILLARS.map((p) => (
              <article
                key={p.title}
                data-stack-card
                className={`sticky ${p.sticky} flex min-h-[26rem] origin-top flex-col justify-between overflow-hidden border border-line bg-ink-soft p-7 shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.8)] sm:min-h-[28rem] sm:p-12`}
              >
                <div aria-hidden="true" data-stack-shade className="pointer-events-none absolute inset-0 z-10 bg-black opacity-0" />
                <div className="flex items-start justify-between gap-6">
                  <span className="display text-outline text-8xl sm:text-[10rem]">{p.n}</span>
                  <span aria-hidden="true" className="display text-4xl text-brand sm:text-5xl">
                    ✦
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
                  <h3 className="display text-7xl text-brand sm:text-9xl">{p.title}</h3>
                  <p className="max-w-md text-lg text-neutral-300">{p.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Crossing marquees */}
      <section aria-label="Apply now" className="relative h-72 overflow-hidden bg-ink sm:h-96">
        <div
          aria-hidden="true"
          className="absolute inset-x-[-10%] top-1/2 -translate-y-1/2 rotate-[4deg] border-y border-brand/25"
        >
          <Marquee reverse dark />
        </div>
        <Link
          href="/apply"
          aria-label="Apply now to join 3i Forum"
          className="absolute inset-x-[-10%] top-1/2 -translate-y-1/2 -rotate-[4deg] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.9)]"
        >
          <Marquee />
        </Link>
      </section>

      {/* How it works */}
      <section className="on-brand overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-8 sm:py-32">
          <h2 data-anim="chars" className="display text-6xl sm:text-8xl lg:text-9xl">
            How it works
          </h2>
          <div data-anim="line" className="mt-12 h-0.5 w-full bg-ink" />
          <ol data-anim="stagger" className="mt-10 grid gap-12 md:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n}>
                <span className="display text-outline text-7xl [--outline-color:var(--color-ink)]">{s.n}</span>
                <h3 className="display mt-3 text-5xl sm:text-6xl">{s.title}</h3>
                <p className="mt-3 max-w-sm">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Final CTA */}
      <section id="final-cta" className="relative isolate overflow-hidden bg-ink text-white">
        <div
          aria-hidden="true"
          data-speed="0.25"
          className="display pointer-events-none absolute -right-8 bottom-0 -z-10 text-[45vw] leading-none text-white/[0.03] normal-case sm:text-[32vw]"
        >
          3i
        </div>
        <div className="mx-auto max-w-7xl px-4 py-28 sm:px-8 sm:py-40">
          <p data-anim="reveal" className="display text-2xl text-brand sm:text-3xl">
            Applications are open
          </p>
          <h2 data-anim="chars" className="display mt-4 max-w-4xl text-6xl sm:text-8xl lg:text-9xl">
            Your seat at the table is <span className="text-brand">waiting</span>
          </h2>
          <div data-anim="reveal" className="mt-12 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
            <Link href="/apply" className="btn-cta text-3xl sm:text-4xl">
              Apply for membership <span className="cta-arrow">→</span>
            </Link>
            <p className="text-neutral-400">Takes about 5 minutes · Every application reviewed personally</p>
          </div>
        </div>
      </section>

      <MobileApplyBar />
      <ScrollEffects />
    </>
  );
}
