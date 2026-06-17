"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadOrganizationLogoAction } from "@/lib/actions/organization-settings";

interface OrganizationLogoUploadProps {
  logoUrl?: string | null;
  organizationName: string;
}

export function OrganizationLogoUpload({
  logoUrl,
  organizationName,
}: OrganizationLogoUploadProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadOrganizationLogoAction(formData);
    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border bg-muted/40">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={`Logo ${organizationName}`}
            width={80}
            height={80}
            className="h-full w-full object-contain"
            unoptimized
          />
        ) : (
          <span className="px-2 text-center text-xs text-muted-foreground">Aucun logo</span>
        )}
      </div>
      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          {loading ? "Envoi…" : logoUrl ? "Changer le logo" : "Ajouter un logo"}
        </Button>
        <p className="text-xs text-muted-foreground">PNG, JPEG ou WebP — max 5 Mo</p>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
