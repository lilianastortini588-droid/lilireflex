import { cn } from "@/lib/cn";

export function MagneticWrap({
  children,
  className,
}: {
  children: React.ReactElement;
  className?: string;
  strength?: number;
}) {
  return (
    <div className={cn("inline-flex", className)}>
      <div>{children}</div>
    </div>
  );
}
