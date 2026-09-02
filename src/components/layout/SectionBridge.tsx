export function SectionBridge({ variant = "light" }: { variant?: "light" | "dark" | "to-dark" }) {
  return (
    <div
      className="section-bridge"
      data-variant={variant}
      aria-hidden="true"
    />
  );
}
