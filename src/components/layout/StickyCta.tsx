"use client";

import { IconWhatsApp } from "@/components/ui/Icons";
import { useActiveSection } from "@/hooks/useActiveSection";
import { useVisualScrollThreshold } from "@/lib/visual-runtime";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const SECTION_IDS = [
  "inicio",
  "tecnicas",
  "lectura-de-pies",
  "experiencia",
  "beneficios",
  "promociones",
  "preguntas",
  "contacto",
];

export function StickyCta() {
  const active = useActiveSection(SECTION_IDS);
  const visible = useVisualScrollThreshold(420) && active !== "contacto";

  if (!visible) return null;

  return (
    <div className="sticky-whatsapp">
      <a
        href={buildWhatsAppUrl({ source: "sticky-mobile" })}
        target="_blank"
        rel="noopener noreferrer"
      >
        <IconWhatsApp />
        Coordinar por WhatsApp
      </a>
    </div>
  );
}
