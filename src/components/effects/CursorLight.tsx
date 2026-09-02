import { cn } from "@/lib/cn";

export function CursorLight({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
  enabled?: boolean;
}) {
  return (
    <div className={cn("relative", className)}>
      {children}
    </div>
  );
}
