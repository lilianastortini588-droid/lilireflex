import Image from "next/image";
import { Wordmark } from "@/components/brand/Wordmark";
import { VisualAtmosphere } from "@/components/effects/VisualAtmosphere";
import { IconWhatsApp } from "@/components/ui/Icons";
import { site } from "@/lib/config";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export function Footer() {
  const whatsappUrl = buildWhatsAppUrl({ source: "footer" });

  return (
    <footer className="visual-surface site-footer" data-visual-surface-anchor="footer">
      <VisualAtmosphere kind="footer" />
      <div className="container-wide site-footer__grid">
        <div>
          <a href="#inicio" className="brand-logo-link" aria-label="Volver al inicio">
            <Wordmark size="footer" />
          </a>
          <p className="site-footer__lead">
            Una propuesta de bienestar, presencia y cuidado personalizado.
          </p>
          <p className="site-footer__disclaimer">
            Esta experiencia acompaña el bienestar y se integra de manera complementaria al cuidado profesional de la salud.
          </p>
        </div>

        <div>
          <p className="footer-label">Secciones</p>
          <ul className="footer-links">
            {site.nav.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="site-footer__contact">
          <p className="footer-label">Contacto</p>
          <a
            href={whatsappUrl}
            className="footer-whatsapp"
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconWhatsApp />
            WhatsApp
          </a>
          {site.contact.locationLabel ? <p>{site.contact.locationLabel}</p> : null}
          <a
            href="https://capacero.ar"
            className="site-footer__credit"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Hecho por Capa Cero — visitar capacero.ar (se abre en una pestaña nueva)"
          >
            <span className="site-footer__credit-pins" aria-hidden="true" />
            <span className="site-footer__credit-core" aria-hidden="true">
              <span className="site-footer__credit-label">Hecho por</span>
              <span className="site-footer__credit-logo-frame">
                <Image
                  src="/brand/capacero/image2.png"
                  alt=""
                  width={1536}
                  height={1024}
                  sizes="112px"
                  className="site-footer__credit-logo"
                />
              </span>
              <span className="site-footer__credit-led">↗</span>
            </span>
          </a>
          <p className="site-footer__copyright" suppressHydrationWarning>
            © {new Date().getFullYear()} {site.brand.fullName}
          </p>
        </div>
      </div>
    </footer>
  );
}
