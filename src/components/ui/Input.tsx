import { cn } from "@/lib/cn";

type Shared = {
  id: string;
  label: string;
  error?: string;
  valid?: boolean;
  className?: string;
};

type InputField = Shared &
  React.InputHTMLAttributes<HTMLInputElement> & {
    multiline?: false;
  };

type TextAreaField = Shared &
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    multiline: true;
  };

export function Field({
  id,
  label,
  error,
  valid,
  className,
  multiline,
  ...props
}: InputField | TextAreaField) {
  const errorId = `${id}-error`;
  const describedBy = [props["aria-describedby"], error ? errorId : null]
    .filter(Boolean)
    .join(" ") || undefined;
  const shared = cn(
    "peer w-full rounded-[var(--radius-md)] border bg-paper/80 px-4 pb-2.5 pt-6 text-[1rem] text-graphite outline-none transition-[border-color,box-shadow] duration-[var(--motion-fast)]",
    "border-stone/80 focus:border-olive focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--lili-olive)_18%,transparent),0_8px_24px_-16px_color-mix(in_srgb,var(--lili-bronze-soft)_35%,transparent)]",
    valid &&
      !error &&
      "border-olive/50 shadow-[0_0_0_3px_color-mix(in_srgb,var(--lili-olive)_10%,transparent)]",
    error &&
      "border-danger focus:border-danger focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--lili-danger)_16%,transparent)]",
    className,
  );

  return (
    <label className="relative block" htmlFor={id}>
      {multiline ? (
        <textarea
          id={id}
          className={cn(shared, "min-h-28 resize-y")}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
        />
      ) : (
        <input
          id={id}
          className={shared}
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
        />
      )}
      <span className="pointer-events-none absolute left-4 top-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-olive-dark">
        {label}
      </span>
      {error ? (
        <span id={errorId} className="mt-2 block text-sm text-danger" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}
