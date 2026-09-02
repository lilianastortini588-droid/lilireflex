import type { MetadataRoute } from "next";
import { site } from "@/lib/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.brand.fullName,
    short_name: site.brand.descriptor,
    description:
      "Reflexología podal, manos, cráneo-facial y lectura de pies con coordinación directa por WhatsApp.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0712",
    theme_color: "#0b0712",
    lang: "es-AR",
    icons: [
      { src: "/icon", sizes: "64x64", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
