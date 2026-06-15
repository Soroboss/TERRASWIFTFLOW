import { z } from "zod";

const uuid = z.string().uuid("Identifiant invalide.");

export const loginSchema = z.object({
  email: z.string().trim().email("Adresse e-mail invalide."),
  password: z.string().min(8, "Mot de passe : minimum 8 caractères."),
});

export const registerSchema = z.object({
  email: z.string().trim().email("Adresse e-mail invalide."),
  password: z.string().min(8, "Mot de passe : minimum 8 caractères."),
  fullName: z.string().trim().min(2, "Nom complet requis.").max(120),
  organizationName: z.string().trim().min(2, "Nom d'entreprise requis.").max(120),
  phone: z.string().trim().min(8, "Numéro de téléphone invalide.").max(20),
  plan: z.enum(["starter", "pro"]).default("starter"),
});

export const verifyEmailSchema = z.object({
  email: z.string().trim().email("Adresse e-mail invalide."),
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Le code doit contenir 6 chiffres."),
});

export const resendEmailSchema = z.object({
  email: z.string().trim().email("Adresse e-mail invalide."),
});

export const clientSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(20),
  email: z
    .union([z.string().trim().email(), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
  is_diaspora: z.boolean(),
  country: z.string().trim().min(2).max(80),
  source: z.enum(["whatsapp", "terrain", "facebook", "salon"]).nullable().optional(),
  assigned_agent_id: uuid.nullable().optional(),
});

export const propertySchema = z.object({
  type: z.enum(["terrain", "maison"]),
  title: z.string().trim().min(2).max(200),
  reference: z.string().trim().min(1).max(50),
  status: z.enum(["libre", "reserve", "vendu"]),
  price_total: z.number().positive("Le prix doit être positif."),
  surface_m2: z.number().positive().nullable().optional(),
  price_per_m2: z.number().positive().nullable().optional(),
  location_label: z.string().trim().max(200).nullable().optional(),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  lot_number: z.string().trim().max(50).nullable().optional(),
  masterplan_id: uuid.nullable().optional(),
  rooms: z.number().int().positive().nullable().optional(),
  construction_status: z.string().trim().max(100).nullable().optional(),
  photos: z.array(z.string()).optional(),
});

export const createDealSchema = z.object({
  property_id: uuid,
  client_id: uuid,
  total_amount: z.number().positive("Montant total invalide."),
});

export const recordPaymentSchema = z.object({
  deal_id: uuid,
  schedule_id: uuid,
  amount: z.number().positive("Montant invalide."),
  method: z.enum(["wave", "orange_money", "mtn", "especes", "virement"]),
  paid_at: z.string().trim().min(1, "Date de paiement requise."),
});

export const activitySchema = z.object({
  client_id: uuid,
  type: z.enum(["appel", "visite", "relance"]),
  note: z.string().trim().max(2000).nullable().optional(),
  due_at: z.string().trim().min(1, "Date d'échéance requise."),
});
