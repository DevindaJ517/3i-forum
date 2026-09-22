import type { Metadata } from "next";
import { createFormToken } from "@/lib/security/crypto";
import { ApplicationForm } from "./application-form";

export const metadata: Metadata = {
  title: "Apply for membership",
  description: "Apply to join 3i Forum, Sri Lanka's community for entrepreneurs.",
};

export default async function ApplyPage() {
  // The root layout renders per request, so every visitor gets a freshly
  // signed form token.
  const formToken = createFormToken();

  return (
    <div className="bg-ink pt-24 text-paper">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 pt-10 pb-24 sm:px-8 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <aside className="lg:sticky lg:top-10 lg:self-start">
          <p className="display text-2xl text-brand">Membership application</p>
          <h1 className="display mt-2 text-6xl text-white sm:text-8xl">
            Join the <span className="text-brand">forum</span>
          </h1>
          <p className="mt-6 max-w-md text-neutral-300">
            Tell us about yourself and your business. Every application is reviewed personally by the 3i team, and
            we&apos;ll be in touch by email.
          </p>
          <ul className="mt-8 space-y-2 text-sm text-neutral-400">
            <li>• Takes about 5 minutes</li>
            <li>• Your details are kept private and never sold</li>
            <li>• You can ask us to delete your data at any time</li>
          </ul>
        </aside>

        <ApplicationForm formToken={formToken} />
      </div>
    </div>
  );
}
