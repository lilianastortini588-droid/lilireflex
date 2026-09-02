import Image from "next/image";
import { VisualAtmosphere } from "@/components/effects/VisualAtmosphere";
import { Button } from "@/components/ui/Button";
import { IconWhatsApp } from "@/components/ui/Icons";
import { Reveal } from "@/components/ui/Reveal";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export function FinalCta() {
  return (
    <section
      id="contacto"
      className="visual-surface final-cta-section"
      data-visual-surface-anchor="cta"
    >
      <VisualAtmosphere kind="cta" />
      <div className="container-wide">
        <Reveal className="water-window water-window--cta glass-a final-cta-window">
          <div className="final-cta-copy">
            <p className="eyebrow">Tu momento</p>
            <h2>Tu pausa puede empezar hoy</h2>
            <p>
              Escribile a Lili y conocé la experiencia que mejor acompaña tu presente.
            </p>
            <p className="final-cta-secondary">
              Podal, manos, cráneo-facial o lectura de pies: cada recorrido comienza con una conversación.
            </p>
            <Button
              href={buildWhatsAppUrl({ source: "final-cta" })}
              external
              variant="whatsapp"
            >
              <IconWhatsApp />
              Hablar con Lili por WhatsApp
            </Button>
            <span className="final-cta-microcopy">
              Consultas, modalidad, valores y coordinación
            </span>
          </div>
          <div className="final-cta-art" aria-hidden="true">
            <Image
              src="/brand/pearlescent-foot.png"
              alt=""
              width={1024}
              height={1536}
              sizes="(max-width: 900px) 80vw, 38vw"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
