import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const paths = [
    "",
    "/about",
    "/services",
    "/contact",
    "/faq",
    "/support",
    "/pricing",
    "/products/commerce",
    "/products/leadpilot",
    "/products/adintel",
    "/products/doctors-diary",
    "/privacy",
    "/security",
    "/terms",
    "/refunds",
  ];

  return paths.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path === "" || path === "/products/commerce" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path.startsWith("/products") || path === "/pricing" ? 0.8 : 0.6,
  }));
}
