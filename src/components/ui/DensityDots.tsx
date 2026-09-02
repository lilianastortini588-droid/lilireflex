import { cn } from "@/lib/cn";

export function DensityDots({
  available,
  total,
  className,
}: {
  available: number;
  total: number;
  className?: string;
}) {
  const slots = Math.max(total, 1);
  const filled = Math.max(0, Math.min(slots, available));

  return (
    <div className={cn("mt-2 flex justify-center gap-1", className)} aria-hidden="true">
      {Array.from({ length: Math.min(slots, 4) }).map((_, index) => (
        <span
          key={index}
          className={cn(
            "size-1.5 rounded-full transition-colors duration-[var(--motion-fast)]",
            index < filled ? "bg-olive" : "bg-stone/70",
          )}
        />
      ))}
    </div>
  );
}
