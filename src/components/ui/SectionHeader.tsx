"use client";

import { LineReveal } from "@/components/ui/LineReveal";

export function SectionHeader({
  eyebrow,
  title,
  body,
  invert = false,
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  body?: string;
  invert?: boolean;
  className?: string;
}) {
  return (
    <div className={className ?? "mx-auto max-w-2xl text-center"}>
      <p className={`eyebrow ${invert ? "text-bronze-soft" : ""}`}>{eyebrow}</p>
      <LineReveal
        className={`mt-3 font-serif text-[length:var(--text-3xl)] leading-[1.08] tracking-[-0.03em] ${
          invert ? "text-paper" : "text-graphite"
        }`}
      >
        {title}
      </LineReveal>
      {body ? (
        <p className={`mx-auto mt-3 max-w-xl text-[length:var(--text-lg)] ${invert ? "text-stone" : "text-charcoal/80"}`}>
          {body}
        </p>
      ) : null}
    </div>
  );
}
