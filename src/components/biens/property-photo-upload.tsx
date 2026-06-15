"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadPropertyPhotoAction } from "@/lib/actions/properties";

interface PropertyPhotoUploadProps {
  propertyId: string;
  photos: string[];
}

export function PropertyPhotoUpload({ propertyId, photos }: PropertyPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("propertyId", propertyId);

    const result = await uploadPropertyPhotoAction(formData);
    if (result.error) {
      setError(result.error);
    }
    setLoading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((url) => (
          <div key={url} className="relative aspect-video overflow-hidden rounded-md border">
            <Image src={url} alt="Photo du bien" fill className="object-cover" unoptimized />
          </div>
        ))}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <Button
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        <Upload className="h-4 w-4" />
        {loading ? "Upload en cours…" : "Ajouter une photo"}
      </Button>
    </div>
  );
}
