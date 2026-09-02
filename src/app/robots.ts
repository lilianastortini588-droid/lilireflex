import type { MetadataRoute } from "next";
import { site } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  const ready = process.env.PUBLICATION_STATUS === "ready";
  return {
    rules: {
      userAgent: "*",
      ...(ready ? { allow: "/" } : { disallow: "/" }),
    },
    sitemap: ready ? `${site.url}/sitemap.xml` : undefined,
  };
}
