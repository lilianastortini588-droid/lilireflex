"use client";

import { cn } from "@/lib/cn";

export function Crossfade({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div key={id} className={cn("crossfade-panel", className)}>
      {children}
    </div>
  );
}
