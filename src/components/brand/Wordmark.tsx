"use client";

import Image from "next/image";
import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { cn } from "@/lib/cn";
import liliLogo from "../../../logo.png";

const MAX_TILT_DEGREES = 3;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function Wordmark({
  className,
  priority = false,
  size = "header",
}: {
  size?: "header" | "footer";
  className?: string;
  priority?: boolean;
}) {
  const wordmarkRef = useRef<HTMLSpanElement>(null);

  function handlePointerMove(event: ReactPointerEvent<HTMLSpanElement>) {
    if (
      (event.pointerType !== "mouse" && event.pointerType !== "pen") ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const wordmark = wordmarkRef.current;
    if (!wordmark) return;

    const rect = wordmark.getBoundingClientRect();
    const horizontal = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
    const vertical = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);

    wordmark.style.setProperty("--brand-rotate-x", `${(-vertical * MAX_TILT_DEGREES).toFixed(2)}deg`);
    wordmark.style.setProperty("--brand-rotate-y", `${(horizontal * MAX_TILT_DEGREES).toFixed(2)}deg`);
    wordmark.style.setProperty("--brand-shift-x", `${(horizontal * 1.8).toFixed(2)}px`);
    wordmark.style.setProperty("--brand-shift-y", `${(vertical * 1.4).toFixed(2)}px`);
    wordmark.style.setProperty("--brand-sheen-x", `${(horizontal * 42).toFixed(2)}%`);
    wordmark.dataset.brandEngaged = "true";
  }

  function resetPointerMotion() {
    const wordmark = wordmarkRef.current;
    if (!wordmark) return;

    wordmark.style.removeProperty("--brand-rotate-x");
    wordmark.style.removeProperty("--brand-rotate-y");
    wordmark.style.removeProperty("--brand-shift-x");
    wordmark.style.removeProperty("--brand-shift-y");
    wordmark.style.removeProperty("--brand-sheen-x");
    delete wordmark.dataset.brandEngaged;
  }

  return (
    <span
      ref={wordmarkRef}
      className={cn("brand-wordmark", size === "footer" && "brand-wordmark--footer", className)}
      data-brand-size={size}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointerMotion}
    >
      <span className="brand-wordmark__plane" aria-hidden="true">
        <Image
          className="brand-wordmark__image"
          src={liliLogo}
          alt=""
          fetchPriority={priority ? "high" : undefined}
          sizes={
            size === "footer"
              ? "(max-width: 600px) 330px, 440px"
              : "(max-width: 600px) 180px, (max-width: 900px) 210px, 235px"
          }
        />
      </span>
    </span>
  );
}
