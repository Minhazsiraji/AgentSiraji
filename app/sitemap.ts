import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";
export default function sitemap():MetadataRoute.Sitemap{const base=getSiteUrl();return ["","/about","/services","/contact","/faq","/products/leadpilot","/products/doctors-diary","/privacy","/terms"].map(path=>({url:`${base}${path}`,lastModified:new Date(),changeFrequency:path===""?"weekly":"monthly",priority:path===""?1:path.startsWith("/products")?0.8:0.6}))}
