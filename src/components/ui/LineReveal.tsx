"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";

function subscribe() {
  return () => undefined;
}

export function LineReveal({
  children,
  className,
  as: Tag = "h2",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p";
}) {
  const ready = useSyncExternalStore(subscribe, () => true, () => false);

  return (
    <Tag className={cn("line-reveal", ready && "is-ready", className)}>
      <span className="line-reveal-inner">{children}</span>
    </Tag>
  );
}
