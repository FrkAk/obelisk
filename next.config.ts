import type { NextConfig } from "next";
import { networkInterfaces } from "os";

const isProd = process.env.NODE_ENV === "production";

/**
 * Collects non-loopback IPv4 addresses from all network interfaces
 * so Next.js allows dev access from the local network.
 *
 * @returns Array of local IPv4 address strings.
 */
function getLocalIps(): string[] {
  const ips: string[] = [];
  for (const addrs of Object.values(networkInterfaces())) {
    if (!addrs) continue;
    for (const addr of addrs) {
      if (addr.family === "IPv4" && !addr.internal) ips.push(addr.address);
    }
  }
  return ips;
}

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.mapbox.com https://*.mapillary.com https://*.fbcdn.net https://*.wikipedia.org https://*.wikimedia.org",
      "connect-src 'self' https://*.mapbox.com https://*.mapillary.com https://*.fbcdn.net https://nominatim.openstreetmap.org",
      "worker-src 'self' blob:",
      "frame-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: isProd ? [] : getLocalIps(),
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  async headers() {
    if (!isProd) return [];
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
