import { cookies } from "next/headers";
import { cache } from "react";
import { createServerClient } from "@insforge/sdk/ssr";

export const createClient = cache(async () => {
  const cookieStore = await cookies();
  return createServerClient({ cookies: cookieStore });
});
