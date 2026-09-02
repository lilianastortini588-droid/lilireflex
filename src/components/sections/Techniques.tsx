import { VisualAtmosphere } from "@/components/effects/VisualAtmosphere";
import { Button } from "@/components/ui/Button";
import { IconArrow, IconWhatsApp } from "@/components/ui/Icons";
import { Reveal } from "@/components/ui/Reveal";
import { site } from "@/lib/config";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export function Techniques() {
  return (
    <section
      id="tecnicas"
      className="visual-surface section techniques-section"
      data-visual-surface-anchor="techniques"
    >
      <VisualAtmosphere kind="techniques" />
      <div className="container-wide">
        <Reveal className="section-heading section-heading--wide">
          <p className="eyebrow">Técnicas</p>
          <h2>Distintas puertas hacia una misma conexión</h2>
          <p>
            Cada técnica observa el cuerpo desde un punto diferente y comparte la misma intención: regalar presencia, alivio percibido y un espacio de cuidado personal.
          </p>
        </Reveal>

        <div className="technique-list">
          {site.techniques.slice(0, 3).map((technique, index) => (
            <Reveal
              key={technique.id}
              delay={index * 70}
              className="water-window water-window--service glass-b technique-card"
            >
              <div className="technique-card__index">0{index + 1}</div>
              <div className="technique-card__body">
                <p className="eyebrow">{technique.eyebrow}</p>
                <h3>{technique.label}</h3>
                <p>{technique.description}</p>
                <p className="technique-card__detail">{technique.detail}</p>
                <ul>
                  {technique.phrases.map((phrase) => (
                    <li key={phrase}>{phrase}</li>
                  ))}
                </ul>
                <Button
                  href={buildWhatsAppUrl({ source: `technique-${technique.id}`, technique: technique.id })}
                  external
                  variant="ghost"
                >
                  <IconWhatsApp />
                  {technique.cta}
                  <IconArrow />
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
