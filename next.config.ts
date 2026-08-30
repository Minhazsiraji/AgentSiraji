import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  poweredByHeader: false,
  reactStrictMode: true,

  async headers() {
    const scriptPolicy =
      process.env.NODE_ENV === "development"
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.paddle.com"
        : "script-src 'self' 'unsafe-inline' https://cdn.paddle.com";

    const contentSecurityPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self' https://*.paddle.com https://*.paddle.io",
      "frame-ancestors 'none'",
      "object-src 'none'",
      scriptPolicy,

      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://res.cloudinary.com https://*.paddle.com https://*.paddle.io",

      [
        "connect-src",
        "'self'",
        "https://cdn.paddle.com",
        "https://*.paddle.com",
        "https://*.paddle.io",
      ].join(" "),

      [
        "frame-src",
        "'self'",
        "https://*.paddle.com",
        "https://*.paddle.io",
      ].join(" "),

      "manifest-src 'self'",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "off",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-origin",
          },
          {
            key: "Strict-Transport-Security",
            value:
              "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
        ],
      },
    ];
  },
};

export default nextConfig;