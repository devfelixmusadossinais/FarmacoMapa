import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  // Os JPGs (~120 MB) não entram na função. Na Netlify a rota lê o blob do deploy.
  outputFileTracingExcludes: {
    "*": ["./content/mapas/**/*"],
  },
};

export default nextConfig;
