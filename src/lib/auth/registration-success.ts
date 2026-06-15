import type { Plan } from "@/types/database";
import { cookies } from "next/headers";

const COOKIE_NAME = "tsf_registration_success";
const COOKIE_MAX_AGE = 60 * 30;

export interface RegistrationSuccessSummary {
  email: string;
  organizationName: string;
  fullName: string;
  plan: Plan;
  trialEndsAt: string;
}

export async function setRegistrationSuccessCookie(data: RegistrationSuccessSummary) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, JSON.stringify(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function consumeRegistrationSuccessCookie(): Promise<RegistrationSuccessSummary | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  cookieStore.delete(COOKIE_NAME);

  if (!raw) return null;

  try {
    return JSON.parse(raw) as RegistrationSuccessSummary;
  } catch {
    return null;
  }
}
