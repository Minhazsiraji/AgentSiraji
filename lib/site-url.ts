export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const value = configured || (vercelHost ? `https://${vercelHost}` : "https://agent-siraji.vercel.app");

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.hostname !== "localhost") throw new Error("Insecure site URL");
    return url.origin;
  } catch {
    return "https://agent-siraji.vercel.app";
  }
}
