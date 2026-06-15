import type { ZodType } from "zod";

export function parseInput<T>(
  schema: ZodType<T>,
  input: unknown
): { data: T } | { error: string } {
  const result = schema.safeParse(input);

  if (!result.success) {
    const issue = result.error.issues[0];
    return { error: issue?.message ?? "Données invalides." };
  }

  return { data: result.data };
}
