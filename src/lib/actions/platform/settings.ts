"use server";

import { createServiceClient } from "@/lib/insforge/admin";
import { logPlatformAction } from "@/lib/actions/platform/audit";
import { requirePlatformSession } from "@/lib/platform/auth";
import type { PlatformSettings } from "@/types/platform";
import { revalidatePath } from "next/cache";

export async function updatePlatformSettingsAction(
  key: "general" | "pricing",
  value: PlatformSettings["general"] | PlatformSettings["pricing"]
) {
  const session = await requirePlatformSession("super_admin");
  const service = createServiceClient();

  const { error } = await service.database.from("platform_settings").upsert(
    {
      key,
      value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );

  if (error) return { error: "Impossible d'enregistrer les paramètres." };

  await logPlatformAction(session.userId, "platform.settings_update", "platform_settings", null, {
    key,
    value,
  });

  revalidatePath("/platform/parametres");
  return { success: true };
}
