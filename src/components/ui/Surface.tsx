import { cn } from "@/lib/cn";

type Level = 1 | 2 | 3 | 4;

export function Surface({
  level = 2,
  className,
  children,
  as: Tag = "div",
  ...props
}: {
  level?: Level;
  className?: string;
  children: React.ReactNode;
  as?: "div" | "article" | "section" | "aside";
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag className={cn(`surface-${level} rounded-[var(--radius-xl)]`, className)} {...props}>
      {children}
    </Tag>
  );
}
