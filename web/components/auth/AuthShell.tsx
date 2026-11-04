import Link from "next/link";
import { Check } from "lucide-react";

import { BrandLockup } from "@/components/brand/Brand";

const PROOF_POINTS = [
  "See every ticket, owner and status in one place.",
  "Triage by priority and keep response times tight.",
  "Role-based access with secure, short-lived sessions.",
];

export interface AuthShellProps {
  eyebrow: string;
  headline: string;
  description: string;
  children: React.ReactNode;
}

export function AuthShell({
  eyebrow,
  headline,
  description,
  children,
}: AuthShellProps) {
  return (
    <main className="relative min-h-dvh w-full overflow-hidden px-3 py-4 sm:px-6 sm:py-6">
      <div className="relative mx-auto grid w-full max-w-[1080px] overflow-hidden rounded-panel border border-line bg-surface shadow-float lg:min-h-[660px] lg:grid-cols-[45%_55%]">
        <aside className="brand-gradient relative isolate flex flex-col justify-between overflow-hidden p-6 text-white sm:p-9 lg:p-11">
          <div
            aria-hidden="true"
            className="noise pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-soft-light"
          />
          <svg
            aria-hidden="true"
            viewBox="0 0 200 200"
            fill="none"
            className="pointer-events-none absolute -bottom-20 -right-16 size-[360px] text-white/15"
          >
            {[86, 66, 46, 26].map((radius) => (
              <circle
                key={radius}
                cx="100"
                cy="100"
                r={radius}
                stroke="currentColor"
                strokeWidth="0.8"
              />
            ))}
          </svg>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-16 -top-16 size-56 rounded-full bg-teal/30 blur-3xl"
          />

          <Link
            href="/"
            aria-label="Relay home"
            className="relative w-fit rounded-inner outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            <BrandLockup variant="inverse" subtitle="Ticket support workspace" />
          </Link>

          <div className="relative mt-10 lg:mt-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/65">
              {eyebrow}
            </p>
            <h1 className="mt-3 max-w-md font-display text-[28px] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[34px] lg:text-[40px]">
              {headline}
            </h1>
            <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-white/75 sm:text-sm">
              {description}
            </p>

            <ul className="mt-7 hidden space-y-2.5 sm:block lg:mt-9">
              {PROOF_POINTS.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-2.5 text-[12px] leading-snug text-white/80"
                >
                  <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-white/15">
                    <Check
                      className="size-2.5"
                      strokeWidth={3}
                      aria-hidden="true"
                    />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative mt-8 hidden text-[10px] font-medium uppercase tracking-[0.12em] text-white/45 sm:block">
            JWT sessions · Role-based access · Built for support teams
          </p>
        </aside>

        <section className="flex items-center justify-center bg-surface px-5 py-9 sm:px-10 lg:px-14 lg:py-12">
          <div className="w-full max-w-[360px]">{children}</div>
        </section>
      </div>
    </main>
  );
}
