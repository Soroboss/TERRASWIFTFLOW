export interface CompanyProfile {
  logo_url?: string | null;
  legal_name?: string | null;
  tagline?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  rccm?: string | null;
  niu?: string | null;
  bank_name?: string | null;
  rib?: string | null;
  website?: string | null;
}

export const EMPTY_COMPANY_PROFILE: CompanyProfile = {};

export function parseCompanyProfile(raw: unknown): CompanyProfile {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...EMPTY_COMPANY_PROFILE };
  }
  const data = raw as Record<string, unknown>;
  const str = (key: keyof CompanyProfile) => {
    const value = data[key];
    return typeof value === "string" && value.trim() ? value.trim() : null;
  };

  return {
    logo_url: str("logo_url"),
    legal_name: str("legal_name"),
    tagline: str("tagline"),
    contact_email: str("contact_email"),
    contact_phone: str("contact_phone"),
    whatsapp: str("whatsapp"),
    address: str("address"),
    city: str("city"),
    country: str("country"),
    rccm: str("rccm"),
    niu: str("niu"),
    bank_name: str("bank_name"),
    rib: str("rib"),
    website: str("website"),
  };
}

export function formatOrganizationDocumentFooter(
  organizationName: string,
  profile: CompanyProfile
): string {
  const parts: string[] = [];
  const displayName = profile.legal_name ?? organizationName;
  parts.push(displayName);

  if (profile.address) parts.push(profile.address);
  if (profile.city) parts.push(profile.city);
  if (profile.rccm) parts.push(`RCCM ${profile.rccm}`);
  if (profile.contact_phone) parts.push(`Tél. ${profile.contact_phone}`);

  return parts.join(" — ");
}
