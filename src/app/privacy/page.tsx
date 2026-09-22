import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: "How 3i Forum collects, uses and protects the personal data of applicants and members.",
};

// NOTE: Draft wording. Have this reviewed by a legal advisor before launch.
const SECTIONS = [
  {
    title: "What we collect",
    body: "When you apply, we collect the details you enter in the application form: your name, contact details, location, business information, your interests and your answers. We also record a one-way hash of your IP address and your browser type to help prevent spam and abuse.",
  },
  {
    title: "Why we collect it",
    body: "We use your information only to review your membership application, contact you about it, and, if you are accepted, to match you with the right forum. If you opt in, we will also send you updates about 3i Forum events and The 3i Show.",
  },
  {
    title: "Legal basis",
    body: "We process your data based on the consent you give when you submit the application, in line with Sri Lanka's Personal Data Protection Act, No. 9 of 2022. You can withdraw consent at any time.",
  },
  {
    title: "Who can see it",
    body: "Only the 3i Forum team members responsible for reviewing applications. We do not sell, rent or share your personal data with third parties for their own marketing.",
  },
  {
    title: "How long we keep it",
    body: "If your application is unsuccessful, we delete your data within 12 months. If you become a member, we keep it for as long as your membership is active.",
  },
  {
    title: "Your rights",
    body: "You can ask to see, correct or delete your data, or withdraw your consent, at any time by contacting the 3i Forum team.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="bg-ink pt-24 text-paper">
      <div className="mx-auto max-w-3xl px-4 pt-10 pb-24 sm:px-8">
        <p className="display text-2xl text-brand">Legal</p>
        <h1 className="display mt-2 text-6xl text-white sm:text-8xl">Privacy notice</h1>
        <div className="mt-12 space-y-10">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="display text-4xl text-brand">{s.title}</h2>
              <p className="mt-2 text-neutral-300">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
