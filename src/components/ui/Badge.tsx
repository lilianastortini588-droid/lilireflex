import { cn } from "@/lib/cn";

export function Badge({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-pill)] border border-bronze-soft/80 bg-[color-mix(in_srgb,var(--lili-bronze-soft)_35%,white)] px-3 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-bronze",
        className,
      )}
    >
      {children}
    </span>
  );
}
