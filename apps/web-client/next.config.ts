import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    // Type checking runs as a dedicated CI step (tsc --noEmit).
    // Skipping here avoids duplicate checks and a TS version conflict
    // with @vitejs/plugin-react's declaration files.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
