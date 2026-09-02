import { ReflexField } from "@/components/brand/ReflexField";
import { VisualAtmosphere } from "@/components/effects/VisualAtmosphere";
import { Button } from "@/components/ui/Button";
import { IconArrow, IconWhatsApp } from "@/components/ui/Icons";
import { Reveal } from "@/components/ui/Reveal";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export function Hero() {
  const whatsappUrl = buildWhatsAppUrl({ source: "hero" });

  return (
    <section
      id="inicio"
      className="visual-surface section hero-section"
      data-visual-surface-anchor="hero"
    >
      <VisualAtmosphere kind="hero" />
      <div className="container-wide hero-grid">
        <Reveal immediate className="water-window water-window--hero glass-a hero-copy">
          <p className="eyebrow">Bienestar que comienza desde la base</p>
          <h1>REFLEXOLOGÍA HOLÍSTICA</h1>
          <p className="hero-lead">
            Una experiencia de cuidado que integra pies, manos y rostro para acompañar la relajación, la conciencia corporal y una conexión más profunda con vos.
          </p>
          <p className="hero-note">
            Cada encuentro propone una pausa personal, un espacio de escucha y un recorrido adaptado a tu momento.
          </p>
          <div className="hero-actions">
            <Button href={whatsappUrl} external variant="whatsapp">
              <IconWhatsApp />
              Coordinar una sesión por WhatsApp
            </Button>
            <Button href="#tecnicas" variant="secondary">
              Descubrir las técnicas
              <IconArrow />
            </Button>
          </div>
          <p className="hero-microcopy">
            Atención personalizada · Consultas y coordinación directa
          </p>
        </Reveal>

        <Reveal immediate delay={100} className="hero-identity">
          <div className="hero-lotus-halo" aria-hidden="true" />
          <div className="water-window water-window--identity">
            <ReflexField
              className="h-[320px] w-full sm:h-[460px] lg:h-[620px]"
              topology="hero"
            />
          </div>
          <div className="hero-orbit hero-orbit--one" aria-hidden="true" />
          <div className="hero-orbit hero-orbit--two" aria-hidden="true" />
        </Reveal>
      </div>
      <a className="scroll-cue" href="#introduccion">
        <span>Explorar</span>
        <i aria-hidden="true" />
      </a>
    </section>
  );
}
