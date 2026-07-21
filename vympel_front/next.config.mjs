import createNextIntlPlugin from "next-intl/plugin";
import {buildSecurityHeaders} from "./security-headers.mjs";

const withNextIntl = createNextIntlPlugin();

function mediaRemotePatterns() {
    const configured = (process.env.NEXT_PUBLIC_MEDIA_ORIGINS ?? "")
        .split(",")
        .flatMap((value) => {
            try {
                const url = new URL(value.trim());
                if (url.protocol !== "https:" && url.protocol !== "http:") return [];
                return [{
                    protocol: url.protocol.slice(0, -1),
                    hostname: url.hostname,
                    port: url.port,
                    pathname: "/**",
                }];
            } catch {
                return [];
            }
        });
    return [
        {protocol: "http", hostname: "localhost", port: "9000", pathname: "/**"},
        ...configured,
    ];
}

const nextConfig = {
    output: "standalone",
    poweredByHeader: false,
    async headers() {
        return [{source: "/:path*", headers: buildSecurityHeaders()}];
    },
    webpack(config) {
        config.module.rules.push({
            test: /\.svg$/i,
            issuer: /\.[jt]sx?$/,
            use: ["@svgr/webpack"],
        });
        return config;
    },
    images: {
        remotePatterns: mediaRemotePatterns(),
    },
};

export default withNextIntl(nextConfig);
