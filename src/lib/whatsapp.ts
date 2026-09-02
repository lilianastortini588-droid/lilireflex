import { getTechnique, site } from "./config";
import type { TechniqueId } from "./types";

export type WhatsAppRequest = {
  source: string;
  technique?: TechniqueId;
  promotion?: string;
  message?: string;
};

const GENERAL_MESSAGE =
  "Hola Lili, vi la propuesta de Reflexología Holística y quisiera conocer las experiencias disponibles, su modalidad, valor y disponibilidad.";

function messageFor(request: WhatsAppRequest): string {
  if (request.message?.trim()) return request.message.trim();

  const technique = getTechnique(request.technique);
  if (technique) return technique.message;

  if (request.promotion?.trim()) {
    return `Hola Lili, vi la propuesta “${request.promotion.trim()}” en la página de Reflexología Holística. Quisiera consultar qué incluye, duración, valor y disponibilidad.`;
  }

  return GENERAL_MESSAGE;
}

export function hasWhatsApp(): boolean {
  return /^\d{8,15}$/.test(site.contact.whatsapp);
}

export function buildWhatsAppUrl(request: WhatsAppRequest): string {
  const message = messageFor(request);
  return `https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(message)}`;
}
