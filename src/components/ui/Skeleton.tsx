import { cn } from "@/lib/cn";

export function Skeleton({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  const visual = (
    <div
      className={cn("shimmer min-h-4 rounded-[var(--radius-md)]", className)}
      aria-hidden="true"
    />
  );

  if (!label) return visual;

  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      {visual}
    </div>
  );
}
