import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export function formatFCFA(amount: number): string {
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/\u202f/g, " ")
    .replace(/,/g, " ");

  return `${formatted} FCFA`;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd/MM/yyyy", { locale: fr });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd/MM/yyyy HH:mm", { locale: fr });
}

export function formatPhoneCI(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("225")) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`.trim();
  }
  if (digits.length === 10) {
    return `+225 ${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
  }
  return phone;
}

export function normalizePhoneCI(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("225")) return `+${digits}`;
  if (digits.length === 10) return `+225${digits}`;
  return phone;
}
