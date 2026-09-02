import { VisualAtmosphere } from "@/components/effects/VisualAtmosphere";
import { Button } from "@/components/ui/Button";
import { IconArrow, IconWhatsApp } from "@/components/ui/Icons";
import { Reveal } from "@/components/ui/Reveal";
import { site } from "@/lib/config";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export function Experience() {
  return (
    <section
      id="experiencia"
      className="visual-surface section experience-section"
      data-visual-surface-anchor="experience"
    >
      <VisualAtmosphere kind="experience" />
      <div className="container-wide experience-grid">
        <Reveal className="experience-intro">
          <p className="eyebrow">Cómo es la experiencia</p>
          <h2>Una experiencia personal, de principio a fin</h2>
          <p>
            Cada encuentro comienza con escucha y se construye alrededor de la experiencia que estás buscando.
          </p>
          <Button
            href={buildWhatsAppUrl({ source: "experience" })}
            external
            variant="whatsapp"
          >
            <IconWhatsApp />
            Empezar mi consulta
            <IconArrow />
          </Button>
        </Reveal>

        <div className="experience-steps glass-b">
          {site.experienceSteps.map((step, index) => (
            <Reveal key={step.id} delay={index * 60} className="experience-step">
              <span>{step.id}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
