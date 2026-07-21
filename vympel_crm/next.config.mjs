import { buildSecurityHeaders } from "./security-headers.mjs";

const nextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: buildSecurityHeaders() }];
  },
};

export default nextConfig;
