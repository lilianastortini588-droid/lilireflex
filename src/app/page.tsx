import { VisualStage } from "@/components/effects/VisualStage";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { StickyCta } from "@/components/layout/StickyCta";
import { WhatsAppFloat } from "@/components/layout/WhatsAppFloat";
import { Benefits } from "@/components/sections/Benefits";
import { Experience } from "@/components/sections/Experience";
import { FinalCta } from "@/components/sections/FinalCta";
import { FootReading } from "@/components/sections/FootReading";
import { Hero } from "@/components/sections/Hero";
import { Introduction } from "@/components/sections/Introduction";
import { Promotions } from "@/components/sections/Promotions";
import { Questions } from "@/components/sections/Questions";
import { TechniqueMap } from "@/components/sections/TechniqueMap";
import { Techniques } from "@/components/sections/Techniques";

export default function Home() {
  return (
    <>
      <VisualStage />
      <Header />
      <main id="contenido" tabIndex={-1}>
        <Hero />
        <Introduction />
        <Techniques />
        <TechniqueMap />
        <FootReading />
        <Benefits />
        <Experience />
        <Promotions />
        <Questions />
        <FinalCta />
      </main>
      <Footer />
      <WhatsAppFloat />
      <StickyCta />
    </>
  );
}
