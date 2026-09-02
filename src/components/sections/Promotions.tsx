import { VisualAtmosphere } from "@/components/effects/VisualAtmosphere";
import { Button } from "@/components/ui/Button";
import { IconWhatsApp } from "@/components/ui/Icons";
import { Reveal } from "@/components/ui/Reveal";
import { site } from "@/lib/config";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export function Promotions() {
  return (
    <section
      id="promociones"
      className="visual-surface section proposals-section"
      data-visual-surface-anchor="promotions"
    >
      <VisualAtmosphere kind="promotions" />
      <div className="container-wide">
        <Reveal className="section-heading section-heading--wide">
          <p className="eyebrow">Tu recorrido</p>
          <h2>Elegí la experiencia que mejor acompañe tu momento</h2>
          <p>
            Modalidad, duración, valores y propuestas vigentes se comparten directamente por WhatsApp.
          </p>
        </Reveal>

        <div className="proposal-grid">
          {site.techniques.map((technique, index) => (
            <Reveal
              key={technique.id}
              delay={index * 55}
              className="water-window glass-b proposal-card"
            >
              <span className="proposal-card__number">0{index + 1}</span>
              <p className="eyebrow">{technique.eyebrow}</p>
              <h3>{technique.label}</h3>
              <p>{technique.detail}</p>
              <Button
                href={buildWhatsAppUrl({
                  source: `proposal-${technique.id}`,
                  technique: technique.id,
                })}
                external
                variant="secondary"
              >
                <IconWhatsApp />
                Consultar por WhatsApp
              </Button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
