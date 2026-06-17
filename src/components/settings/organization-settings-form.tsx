"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateOrganizationSettingsAction } from "@/lib/actions/organization-settings";
import type { CompanyProfile } from "@/types/organization-profile";
import { OrganizationLogoUpload } from "@/components/settings/organization-logo-upload";

interface OrganizationSettingsFormProps {
  organizationName: string;
  billingEmail?: string | null;
  profile: CompanyProfile;
}

export function OrganizationSettingsForm({
  organizationName,
  billingEmail,
  profile,
}: OrganizationSettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(organizationName);
  const [billing, setBilling] = useState(billingEmail ?? "");
  const [form, setForm] = useState<CompanyProfile>(profile);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const updateField = (key: keyof CompanyProfile, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value || null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await updateOrganizationSettingsAction({
      name,
      billing_email: billing || null,
      profile: { ...form, logo_url: profile.logo_url ?? form.logo_url },
    });

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Identité visuelle</h2>
        <OrganizationLogoUpload logoUrl={profile.logo_url} organizationName={name} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="org-name">Nom commercial *</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="legal-name">Raison sociale (sur contrats)</Label>
            <Input
              id="legal-name"
              value={form.legal_name ?? ""}
              onChange={(e) => updateField("legal_name", e.target.value)}
              placeholder="Ex. SARL Les Jardins d'Abatta"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="tagline">Slogan / activité</Label>
            <Input
              id="tagline"
              value={form.tagline ?? ""}
              onChange={(e) => updateField("tagline", e.target.value)}
              placeholder="Lotisseur & promoteur immobilier"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Coordonnées</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contact-email">E-mail contact</Label>
            <Input
              id="contact-email"
              type="email"
              value={form.contact_email ?? ""}
              onChange={(e) => updateField("contact_email", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billing-email">E-mail facturation</Label>
            <Input
              id="billing-email"
              type="email"
              value={billing}
              onChange={(e) => setBilling(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-phone">Téléphone</Label>
            <Input
              id="contact-phone"
              value={form.contact_phone ?? ""}
              onChange={(e) => updateField("contact_phone", e.target.value)}
              placeholder="+225 07 00 00 00 00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              value={form.whatsapp ?? ""}
              onChange={(e) => updateField("whatsapp", e.target.value)}
              placeholder="+225 07 00 00 00 00"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="website">Site web</Label>
            <Input
              id="website"
              value={form.website ?? ""}
              onChange={(e) => updateField("website", e.target.value)}
              placeholder="https://"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Siège & localisation</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Adresse</Label>
            <Textarea
              id="address"
              value={form.address ?? ""}
              onChange={(e) => updateField("address", e.target.value)}
              placeholder="Quartier, rue, immeuble…"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Ville</Label>
            <Input
              id="city"
              value={form.city ?? ""}
              onChange={(e) => updateField("city", e.target.value)}
              placeholder="Abidjan"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Pays</Label>
            <Input
              id="country"
              value={form.country ?? ""}
              onChange={(e) => updateField("country", e.target.value)}
              placeholder="Côte d'Ivoire"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Informations légales & bancaires</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="rccm">RCCM</Label>
            <Input
              id="rccm"
              value={form.rccm ?? ""}
              onChange={(e) => updateField("rccm", e.target.value)}
              placeholder="CI-ABJ-2024-B-12345"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="niu">NIU / Identifiant fiscal</Label>
            <Input
              id="niu"
              value={form.niu ?? ""}
              onChange={(e) => updateField("niu", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bank-name">Banque</Label>
            <Input
              id="bank-name"
              value={form.bank_name ?? ""}
              onChange={(e) => updateField("bank_name", e.target.value)}
              placeholder="SGBCI, Ecobank…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rib">RIB / N° de compte</Label>
            <Input
              id="rib"
              value={form.rib ?? ""}
              onChange={(e) => updateField("rib", e.target.value)}
            />
          </div>
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && (
        <p className="text-sm text-emerald-700">Paramètres enregistrés avec succès.</p>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? "Enregistrement…" : "Enregistrer les paramètres"}
      </Button>
    </form>
  );
}
