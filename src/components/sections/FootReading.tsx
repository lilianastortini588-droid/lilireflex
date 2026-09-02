import Image from "next/image";
import { VisualAtmosphere } from "@/components/effects/VisualAtmosphere";
import { Button } from "@/components/ui/Button";
import { IconWhatsApp } from "@/components/ui/Icons";
import { Reveal } from "@/components/ui/Reveal";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const observations = [
  "Los apoyos muestran cómo distribuís tu energía cotidiana.",
  "Las tensiones cuentan dónde aparece el esfuerzo.",
  "La movilidad expresa adaptación y disponibilidad.",
  "La forma de pisar acompaña una manera de estar en el mundo.",
  "Cada dedo, apoyo y movimiento aporta una parte del relato.",
  "Observar los pies es observar la base desde la que avanzás.",
];

export function FootReading() {
  return (
    <section
      id="lectura-de-pies"
      className="visual-surface section foot-reading-section"
      data-visual-surface-anchor="reading"
    >
      <VisualAtmosphere kind="reading" />
      <div className="container-wide foot-reading-grid">
        <Reveal className="foot-reading-visual">
          <div className="foot-reading-halo" aria-hidden="true" />
          <Image
            src="/brand/pearlescent-foot.png"
            alt="Composición nacarada de un pie con líneas y puntos de conexión"
            width={1024}
            height={1536}
            sizes="(max-width: 900px) 88vw, 46vw"
            className="foot-reading-image"
          />
          <span className="reading-label reading-label--support">Apoyos</span>
          <span className="reading-label reading-label--movement">Movimiento</span>
          <span className="reading-label reading-label--presence">Presencia</span>
        </Reveal>

        <Reveal delay={100} className="water-window water-window--content glass-a foot-reading-copy">
          <p className="eyebrow">Lectura y autoconocimiento</p>
          <h2>Lectura de pies</h2>
          <p className="reading-lead">
            Para decodificar la historia y el presente que el cuerpo revela.
          </p>
          <p>
            La lectura de pies propone una observación holística de la forma, los apoyos, la textura, la movilidad, las tensiones y las huellas del caminar.
          </p>
          <p>
            Cada pie reúne una manera de sostenerse, avanzar, protegerse y vincularse con el entorno. La lectura transforma señales sutiles en preguntas, conversación y autoconocimiento.
          </p>
          <ul className="reading-observations">
            {observations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="reading-clarification">
            La experiencia se presenta como una herramienta holística de observación, conversación y autoconocimiento.
          </p>
          <Button
            href={buildWhatsAppUrl({ source: "foot-reading", technique: "lectura" })}
            external
            variant="whatsapp"
          >
            <IconWhatsApp />
            Consultar por una lectura de pies
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
