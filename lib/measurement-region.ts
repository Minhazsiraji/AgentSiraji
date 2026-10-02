export type MeasurementConsentMode = "opt-in" | "opt-out";

const optInCountryCodes = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE", "IS", "LI", "NO", "GB", "UK", "CH",
]);

export function measurementConsentModeForCountry(countryCode?: string | null): MeasurementConsentMode {
  const code = countryCode?.trim().toUpperCase();
  return code && optInCountryCodes.has(code) ? "opt-in" : "opt-out";
}
