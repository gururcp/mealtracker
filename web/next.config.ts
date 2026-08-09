import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the dev server to serve HMR/RSC to devices on the LAN
  // (phone testing over http://192.168.x.x:3000). Without this, Next 16
  // blocks the cross-origin HMR websocket and client-side React on the
  // mobile browser silently breaks (state updates, form actions).
  // This applies only in dev; production build ignores it.
  allowedDevOrigins: [
    "192.168.29.136",
    // Add other LAN IPs here if you switch networks (`ipconfig` on Windows
    // shows your current one under "IPv4 Address").
  ],
};

export default nextConfig;
