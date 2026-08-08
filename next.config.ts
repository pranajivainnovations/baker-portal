import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Same as OPS and the storefront — produces a self-contained server bundle so the container
  // does not need node_modules copied in.
  output: "standalone",
}

export default nextConfig
