"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deletePropertyAction } from "@/lib/actions/properties";

export function DeletePropertyButton({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Supprimer ce bien ? Cette action est irréversible.")) return;
    setLoading(true);
    const result = await deletePropertyAction(propertyId);
    if (result?.error) {
      alert(result.error);
      setLoading(false);
      return;
    }
    router.refresh();
  };

  return (
    <Button variant="destructive" onClick={handleDelete} disabled={loading}>
      <Trash2 className="h-4 w-4" />
      {loading ? "Suppression…" : "Supprimer"}
    </Button>
  );
}
