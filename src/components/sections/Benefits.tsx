import { ReflexField } from "@/components/brand/ReflexField";
import { VisualAtmosphere } from "@/components/effects/VisualAtmosphere";
import { Reveal } from "@/components/ui/Reveal";
import { site } from "@/lib/config";

export function Benefits() {
  return (
    <section
      id="beneficios"
      className="visual-surface section benefits-section"
      data-visual-surface-anchor="benefits"
    >
      <VisualAtmosphere kind="benefits" />
      <div className="container-wide">
        <Reveal className="section-heading">
          <p className="eyebrow">Beneficios percibidos</p>
          <h2>Un espacio pensado para vos</h2>
          <p>
            La experiencia se orienta a crear una pausa consciente y un momento de cuidado personalizado.
          </p>
        </Reveal>

        <div className="benefits-grid">
          <Reveal className="benefits-list">
            {site.benefits.map((benefit, index) => (
              <article key={benefit.id} className="benefit-item">
                <span>0{index + 1}</span>
                <div>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.body}</p>
                </div>
              </article>
            ))}
          </Reveal>

          <Reveal delay={100} className="water-window glass-b benefits-identity">
            <ReflexField
              className="h-[360px] w-full md:min-h-[560px]"
              focus={0.72}
              topology="benefits"
              ambientSrc="/brand/reflexology/IMG_4047.PNG"
            />
            <p>Presencia, suavidad y conexión.</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
