import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "whatsapp" | "dark";

const variants: Record<Variant, string> = {
  primary: "button-primary",
  secondary: "button-secondary",
  ghost: "button-ghost",
  whatsapp: "button-whatsapp",
  dark: "button-dark",
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  href?: string;
  external?: boolean;
};

export function Button({
  className,
  variant = "primary",
  href,
  external,
  children,
  disabled,
  type,
  ...props
}: ButtonProps) {
  const classes = cn("button-base", variants[variant], className);

  if (href && !disabled) {
    const { tabIndex, onClick, ...rest } = props;
    return (
      <a
        href={href}
        className={classes}
        tabIndex={tabIndex}
        onClick={onClick as React.MouseEventHandler<HTMLAnchorElement> | undefined}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </a>
    );
  }

  return (
    <button className={classes} disabled={disabled} type={type ?? "button"} {...props}>
      {children}
    </button>
  );
}
