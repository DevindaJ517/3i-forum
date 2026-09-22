import type { Metadata, Viewport } from "next";
import { Teko } from "next/font/google";
import { connection } from "next/server";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import "./globals.css";

const teko = Teko({
  variable: "--font-teko",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "3i Forum with Stefan de Alwis | Connect, Learn, Build, Grow",
    template: "%s | 3i Forum with Stefan de Alwis",
  },
  description:
    "3i Forum with Stefan de Alwis: a community where Sri Lanka's entrepreneurs connect, learn, build and grow. From the team behind The 3i Show.",
};

export const viewport: Viewport = {
  themeColor: "#151415",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // The CSP in src/proxy.ts uses a per-request nonce, which Next.js can only
  // attach to scripts when pages render per request. Static pages would ship
  // without the nonce and have their scripts blocked.
  await connection();

  return (
    <html lang="en" className={`${teko.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only bg-ink px-4 py-2 text-brand focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <SmoothScroll />
      </body>
    </html>
  );
}
