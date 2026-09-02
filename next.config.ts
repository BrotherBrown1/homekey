import type { NextConfig } from "next";

// The old Vercel hostname stays attached to the project so existing links
// and search results keep working, but every request to it is sent
// permanently to the real domain so there is a single canonical address.
const LEGACY_HOSTS = ["homekey-psi.vercel.app"];
const CANONICAL_HOST = "www.mypocketgrants.com";

const nextConfig: NextConfig = {
  async redirects() {
    return LEGACY_HOSTS.map((host) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: host }],
      destination: `https://${CANONICAL_HOST}/:path*`,
      permanent: true,
    }));
  },
};

export default nextConfig;
