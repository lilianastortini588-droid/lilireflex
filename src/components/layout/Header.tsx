"use client";

import { useEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
import { VisualAtmosphere } from "@/components/effects/VisualAtmosphere";
import { Button } from "@/components/ui/Button";
import { IconClose, IconMenu, IconWhatsApp } from "@/components/ui/Icons";
import { useActiveSection } from "@/hooks/useActiveSection";
import { cn } from "@/lib/cn";
import { site } from "@/lib/config";
import { scrollToId } from "@/lib/scroll";
import { useVisualScrollThreshold, visualRuntime } from "@/lib/visual-runtime";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const SECTION_IDS = site.nav.map((item) => item.href.slice(1));

export function Header() {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const active = useActiveSection(SECTION_IDS);
  const elevated = useVisualScrollThreshold(0);
  const whatsappUrl = buildWhatsAppUrl({ source: "header" });

  useEffect(() => {
    if (!open) return;
    const panel = menuPanelRef.current;
    const focusable = panel?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    focusable?.[0]?.focus();
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        menuButtonRef.current?.focus();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (CSS.supports("animation-timeline: scroll()")) return;
    const updateProgress = () => {
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${visualRuntime.getScrollSnapshot().progress})`;
      }
    };
    updateProgress();
    const unsubscribe = visualRuntime.subscribeScroll(updateProgress);
    return () => {
      unsubscribe();
    };
  }, []);

  function go(href: string) {
    setOpen(false);
    scrollToId(href.slice(1));
  }

  return (
    <header
      className={cn(
        "site-header visual-surface",
        elevated || open ? "site-header--elevated" : "site-header--top",
      )}
      data-visual-surface-anchor="header"
    >
      <VisualAtmosphere kind="header" />
      <div className="container-wide site-header__inner">
        <a
          href="#inicio"
          className="brand-logo-link"
          aria-label="Reflexología Holística, ir al inicio"
          onClick={(event) => {
            event.preventDefault();
            go("#inicio");
          }}
        >
          <Wordmark priority />
        </a>

        <nav className="site-nav" aria-label="Principal">
          {site.nav.map((item) => {
            const id = item.href.slice(1);
            return (
              <a
                key={item.href}
                href={item.href}
                aria-current={active === id ? "page" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  go(item.href);
                }}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="site-header__actions">
          <Button href={whatsappUrl} external variant="whatsapp" className="site-header__cta">
            <IconWhatsApp />
            Coordinar por WhatsApp
          </Button>
          <button
            ref={menuButtonRef}
            type="button"
            className="menu-toggle"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <IconClose /> : <IconMenu />}
            <span className="sr-only">{open ? "Cerrar menú" : "Abrir menú"}</span>
          </button>
        </div>
      </div>

      <div className="scroll-progress" aria-hidden="true">
        <div ref={progressRef} className="scroll-progress__fill" />
      </div>

      {open ? (
        <div
          id="mobile-nav"
          ref={menuPanelRef}
          className="mobile-nav-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Navegación móvil"
        >
          <nav aria-label="Móvil">
            {site.nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(event) => {
                  event.preventDefault();
                  go(item.href);
                }}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <Button href={whatsappUrl} external variant="whatsapp" className="w-full">
            <IconWhatsApp />
            Coordinar por WhatsApp
          </Button>
        </div>
      ) : null}
    </header>
  );
}
