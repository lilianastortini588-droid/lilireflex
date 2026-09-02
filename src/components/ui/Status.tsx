import { cn } from "@/lib/cn";

export function StatusDot({
  label,
  tone = "available",
}: {
  label: string;
  tone?: "available" | "occupied" | "selected";
}) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-olive-dark">
      <span
        aria-hidden="true"
        className={cn(
          "size-2 rounded-full",
          tone === "available" && "bg-olive animate-[pulse-dot_2.8s_ease-in-out_infinite]",
          tone === "occupied" && "bg-taupe",
          tone === "selected" && "bg-bronze",
        )}
      />
      {label}
    </span>
  );
}
