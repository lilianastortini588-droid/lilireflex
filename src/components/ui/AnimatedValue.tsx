import { cn } from "@/lib/cn";

export function AnimatedValue({
  value,
  format,
  className,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
}) {
  return <span className={cn(className)}>{format(Math.round(value))}</span>;
}
