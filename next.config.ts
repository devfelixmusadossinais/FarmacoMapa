import { readdirSync } from "node:fs";
import type { NextConfig } from "next";

// Páginas da landing (index.html, obrigado.html...) ficam na raiz do repo e são
// copiadas para public/ no prebuild. Sem .html na URL também funciona (/obrigado).
const paginasLanding = readdirSync(process.cwd())
  .filter((f) => f.endsWith(".html") && f !== "index.html")
  .map((f) => f.slice(0, -".html".length));

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  // Os JPGs (~120 MB) não entram na função. Na Netlify a rota lê o blob do deploy.
  outputFileTracingExcludes: {
    "*": ["./content/mapas/**/*", "./content/variantes/**/*"],
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/index.html" },
        ...paginasLanding.map((p) => ({ source: `/${p}`, destination: `/${p}.html` })),
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;