export type CampaignAttribution = {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  referrer: string | null;
  landingPath: string;
};

export function attributionFromRequest(request: Request, fallbackPath: string): CampaignAttribution {
  const raw = request.headers.get("referer");
  if (!raw) {
    return { utmSource: null, utmMedium: null, utmCampaign: null, utmContent: null, utmTerm: null, referrer: null, landingPath: fallbackPath };
  }
  try {
    const url = new URL(raw);
    const value = (name: string, max: number) => url.searchParams.get(name)?.trim().slice(0, max) || null;
    return {
      utmSource: value("utm_source", 120),
      utmMedium: value("utm_medium", 120),
      utmCampaign: value("utm_campaign", 160),
      utmContent: value("utm_content", 160),
      utmTerm: value("utm_term", 160),
      referrer: raw.slice(0, 500),
      landingPath: `${url.pathname}${url.search}`.slice(0, 500),
    };
  } catch {
    return { utmSource: null, utmMedium: null, utmCampaign: null, utmContent: null, utmTerm: null, referrer: raw.slice(0, 500), landingPath: fallbackPath };
  }
}
