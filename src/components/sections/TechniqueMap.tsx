"use client";

import Image from "next/image";
import { useState } from "react";
import { VisualAtmosphere } from "@/components/effects/VisualAtmosphere";
import { Button } from "@/components/ui/Button";
import { IconWhatsApp } from "@/components/ui/Icons";
import { site } from "@/lib/config";
import type { TechniqueId } from "@/lib/types";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const mapTechniques = site.techniques.slice(0, 3);

export function TechniqueMap() {
  const [activeId, setActiveId] = useState<TechniqueId>("podal");
  const [backgroundTechniqueId, setBackgroundTechniqueId] =
    useState<TechniqueId>("podal");
  const active = site.techniques.find((item) => item.id === activeId) ?? site.techniques[0];

  return (
    <section
      className="visual-surface section technique-map-section"
      data-visual-surface-anchor="map"
      data-background-technique={backgroundTechniqueId}
      aria-labelledby="technique-map-title"
    >
      <VisualAtmosphere kind="map" />
      <div className="container-wide technique-map-grid">
        <div className="technique-map-copy">
          <p className="eyebrow">Mapa de conexión</p>
          <h2 id="technique-map-title">Pies, manos y rostro en un mismo recorrido</h2>
          <p>
            Explorá cada puerta de entrada. La composición es editorial y acompaña la navegación entre técnicas.
          </p>

          <div className="technique-map-tabs glass-c" role="tablist" aria-label="Técnicas del mapa">
            {mapTechniques.map((technique) => (
              <button
                key={technique.id}
                id={`map-tab-${technique.id}`}
                type="button"
                role="tab"
                aria-selected={activeId === technique.id}
                aria-controls="map-technique-panel"
                tabIndex={activeId === technique.id ? 0 : -1}
                data-overlay-technique={technique.id}
                onMouseEnter={() => setActiveId(technique.id)}
                onFocus={() => {
                  setActiveId(technique.id);
                  setBackgroundTechniqueId(technique.id);
                }}
                onClick={() => {
                  setActiveId(technique.id);
                  setBackgroundTechniqueId(technique.id);
                }}
                onKeyDown={(event) => {
                  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
                  event.preventDefault();
                  const currentIndex = mapTechniques.findIndex((item) => item.id === activeId);
                  const delta = event.key === "ArrowDown" ? 1 : -1;
                  const next = mapTechniques[(currentIndex + delta + mapTechniques.length) % mapTechniques.length];
                  setActiveId(next.id);
                  setBackgroundTechniqueId(next.id);
                  requestAnimationFrame(() => document.getElementById(`map-tab-${next.id}`)?.focus());
                }}
              >
                <span>{technique.eyebrow}</span>
                <strong>{technique.label}</strong>
              </button>
            ))}
          </div>

          <div
            id="map-technique-panel"
            role="tabpanel"
            aria-labelledby={`map-tab-${active.id}`}
            className="water-window glass-c map-technique-panel"
          >
            <p>{active.description}</p>
            <Button
              href={buildWhatsAppUrl({ source: "technique-map", technique: active.id })}
              external
              variant="whatsapp"
            >
              <IconWhatsApp />
              {active.cta}
            </Button>
          </div>
        </div>

        <div className="water-window glass-b technique-map-visual" data-active-technique={activeId}>
          <Image
            src="/brand/reflexology/technique-map-connection.png"
            alt="Pie, mano y rostro como puntos de conexión de la reflexología."
            width={1254}
            height={1254}
            sizes="(max-width: 900px) calc(100vw - 2rem), 50vw"
            loading="eager"
            className="technique-map-photo"
          />
        </div>
      </div>
    </section>
  );
}
