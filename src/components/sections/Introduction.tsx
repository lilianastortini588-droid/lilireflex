import { ReflexField } from "@/components/brand/ReflexField";
import { VisualAtmosphere } from "@/components/effects/VisualAtmosphere";
import { Reveal } from "@/components/ui/Reveal";

export function Introduction() {
  return (
    <section
      id="introduccion"
      className="visual-surface section introduction-section"
      data-visual-surface-anchor="introduction"
    >
      <VisualAtmosphere kind="introduction" />
      <div className="container-wide introduction-grid">
        <Reveal className="introduction-copy">
          <p className="eyebrow">Una práctica de presencia</p>
          <h2>El bienestar también se construye desde los pies</h2>
          <p>
            La reflexología podal es una práctica manual inspirada en principios holísticos. Trabaja con presiones y estímulos suaves sobre zonas específicas de los pies para crear un momento de pausa, descanso y reconexión corporal.
          </p>
          <p>
            Los pies sostienen cada paso, expresan hábitos de apoyo y reúnen señales sobre la manera en que transitamos el día. Dedicarles atención puede convertirse en una forma consciente de volver al eje.
          </p>
          <blockquote>La vida cotidiana se sostiene desde abajo.</blockquote>
          <p className="editorial-note">Tus pies cuentan cómo venís caminando tu presente.</p>
        </Reveal>

        <Reveal delay={100} className="water-window water-window--content glass-b introduction-field">
          <ReflexField
            className="aspect-[5/4] w-full min-h-[340px] lg:min-h-[500px]"
            focus={0.5}
            topology="reflexology"
            identitySrc="/brand/reflexology/IMG_4048.PNG"
          />
        </Reveal>
      </div>
      <div className="organic-divider" aria-hidden="true">
        <svg viewBox="0 0 1200 80" preserveAspectRatio="none">
          <path d="M0 48 C180 10 320 70 500 36 C700 -2 860 78 1200 28" />
          <path d="M0 60 C240 34 360 80 620 42 C840 10 1010 62 1200 45" />
        </svg>
      </div>
    </section>
  );
}
