"use client";

import { IconWhatsApp } from "@/components/ui/Icons";
import { cn } from "@/lib/cn";
import { useVisualScrollThreshold } from "@/lib/visual-runtime";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export function WhatsAppFloat() {
  const expanded = useVisualScrollThreshold(280);

  return (
    <a
      href={buildWhatsAppUrl({ source: "floating-desktop" })}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("whatsapp-float", expanded && "whatsapp-float--expanded")}
      aria-label="Consultar por WhatsApp"
    >
      <IconWhatsApp />
      <span>Consultar por WhatsApp</span>
    </a>
  );
}
