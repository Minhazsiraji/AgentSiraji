import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  poweredByHeader: false,
  reactStrictMode: true,

  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.agentsiraji.com" }],
        destination: "https://agentsiraji.com/:path*",
        permanent: true,
      },
    ];
  },

  async headers() {
    const googleScripts = "https://www.googletagmanager.com https://www.googleadservices.com https://www.google.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net";
    const scriptPolicy =
      process.env.NODE_ENV === "development"
        ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.paddle.com https://connect.facebook.net ${googleScripts}`
        : `script-src 'self' 'unsafe-inline' https://cdn.paddle.com https://connect.facebook.net ${googleScripts}`;

    const contentSecurityPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self' https://*.paddle.com https://*.paddle.io",
      "frame-ancestors 'none'",
      "object-src 'none'",
      scriptPolicy,

      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      [
        "img-src",
        "'self'",
        "data:",
        "blob:",
        "https://*.paddle.com",
        "https://*.paddle.io",
        "https://www.facebook.com",
        "https://www.googletagmanager.com",
        "https://*.google-analytics.com",
        "https://*.g.doubleclick.net",
        "https://*.google.com",
        "https://pagead2.googlesyndication.com",
        "https://www.googleadservices.com",
      ].join(" "),

      [
        "connect-src",
        "'self'",
        "https://cdn.paddle.com",
        "https://www.facebook.com",
        "https://connect.facebook.net",
        "https://*.paddle.com",
        "https://*.paddle.io",
        "https://www.googletagmanager.com",
        "https://*.google-analytics.com",
        "https://*.analytics.google.com",
        "https://*.g.doubleclick.net",
        "https://*.google.com",
        "https://pagead2.googlesyndication.com",
        "https://www.googleadservices.com",
        "https://googleads.g.doubleclick.net",
        "https://ad.doubleclick.net",
      ].join(" "),

      [
        "frame-src",
        "'self'",
        "https://*.paddle.com",
        "https://*.paddle.io",
        "https://www.googletagmanager.com",
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
