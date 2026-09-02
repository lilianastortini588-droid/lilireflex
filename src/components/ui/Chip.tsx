import { IconCheck } from "@/components/ui/Icons";
import { cn } from "@/lib/cn";

type ChipProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  tone?: "default" | "occupied" | "last";
};

export function Chip({
  className,
  selected,
  tone = "default",
  children,
  disabled,
  ...props
}: ChipProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "inline-flex min-h-11 min-w-[5rem] items-center justify-center gap-1.5 rounded-[var(--radius-md)] border px-4 text-sm font-medium transition-[transform,background-color,border-color,color,box-shadow] duration-[var(--motion-fast)] ease-[var(--ease-standard)]",
        tone === "default" &&
          "border-stone/80 bg-paper/70 text-graphite hover:border-olive/50",
        tone === "occupied" &&
          "border-stone/60 bg-stone/25 text-taupe line-through",
        tone === "last" && "border-bronze-soft bg-paper",
        selected &&
          "border-graphite bg-graphite text-paper shadow-[var(--shadow-interactive)]",
        disabled && "cursor-not-allowed opacity-55",
        !disabled && !selected && "active:scale-[0.98]",
        className,
      )}
      {...props}
    >
      {selected ? <IconCheck className="size-4" /> : null}
      {children}
    </button>
  );
}
