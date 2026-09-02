import { cn } from "@/lib/cn";

type IconProps = {
  className?: string;
};

function Svg({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("size-5 stroke-[1.6]", className)}
    >
      {children}
    </svg>
  );
}

export function IconArrow({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconWhatsApp({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        d="M7.6 18.3 6 21l2.9-.8A8.8 8.8 0 1 0 4 12.2c0 1.6.4 3.1 1.2 4.4Z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 9.6c.2-.5.3-.5.6-.5h.5c.2 0 .4 0 .5.4.2.7.6 1.5.7 1.6.1.2 0 .4-.1.5l-.4.5c-.1.1-.2.3 0 .5.3.4.7.8 1.2 1.2.4.3.6.3.8.1l.5-.4c.2-.2.4-.1.6 0 .5.3 1.2.7 1.2.7s.2.2.1.5c-.1.4-.6 1.1-1.3 1.1-.7 0-1.8-.3-3.1-1.3-1.5-1.1-2.4-2.6-2.6-3.1-.1-.4.1-1 .4-1.4Z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconCalendar({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" />
      <path d="M8 3v4M16 3v4M4 10h16" stroke="currentColor" strokeLinecap="round" />
    </Svg>
  );
}

export function IconCheck({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M5 13.2 9.2 17 19 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconMenu({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 8h16M4 16h16" stroke="currentColor" strokeLinecap="round" />
    </Svg>
  );
}

export function IconClose({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" />
    </Svg>
  );
}
