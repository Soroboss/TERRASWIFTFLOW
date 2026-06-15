export function getClientIp(
  headersList: Headers | { get(name: string): string | null }
): string {
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return headersList.get("x-real-ip") ?? "unknown";
}
