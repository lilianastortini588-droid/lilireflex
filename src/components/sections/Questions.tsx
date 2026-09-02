"use client";

import { useState } from "react";
import { VisualAtmosphere } from "@/components/effects/VisualAtmosphere";
import { Button } from "@/components/ui/Button";
import { IconWhatsApp } from "@/components/ui/Icons";
import { cn } from "@/lib/cn";
import { site } from "@/lib/config";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export function Questions() {
  const [openId, setOpenId] = useState(site.faqs[0]?.id ?? "");

  return (
    <section
      id="preguntas"
      className="visual-surface section questions-section"
      data-visual-surface-anchor="questions"
    >
      <VisualAtmosphere kind="questions" />
      <div className="container-wide questions-grid">
        <div className="questions-intro">
          <p className="eyebrow">Preguntas frecuentes</p>
          <h2>Antes de tu sesión</h2>
          <p>
            Cada recorrido se conversa con claridad. Lili comparte por WhatsApp la información actualizada para tu momento.
          </p>
          <Button
            href={buildWhatsAppUrl({ source: "faq" })}
            external
            variant="whatsapp"
          >
            <IconWhatsApp />
            Consultar por WhatsApp
          </Button>
        </div>

        <div className="faq-list glass-c">
          {site.faqs.map((item, index) => {
            const open = item.id === openId;
            return (
              <article key={item.id} className={cn("faq-item", open && "is-open")}>
                <h3>
                  <button
                    id={`faq-trigger-${item.id}`}
                    type="button"
                    aria-expanded={open}
                    aria-controls={`faq-panel-${item.id}`}
                    onClick={() => setOpenId(open ? "" : item.id)}
                  >
                    <span className="faq-index">0{index + 1}</span>
                    <span>{item.question}</span>
                    <i aria-hidden="true" />
                  </button>
                </h3>
                <div
                  id={`faq-panel-${item.id}`}
                  role="region"
                  aria-labelledby={`faq-trigger-${item.id}`}
                  hidden={!open}
                >
                  <p>{item.answer}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
