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

export const platformStaffMemberSchema = z.object({
  email: z.string().trim().email("Adresse e-mail invalide."),
  password: z
    .union([z.literal(""), z.string().min(8, "Mot de passe : minimum 8 caractères.")])
    .default(""),
  fullName: z.string().trim().min(2, "Nom affiché requis.").max(120),
  role: z.enum(["super_admin", "support", "billing"]),
});

export const tenantTeamMemberSchema = z.object({
  email: z.string().trim().email("Adresse e-mail invalide."),
  password: z
    .union([z.literal(""), z.string().min(8, "Mot de passe : minimum 8 caractères.")])
    .default(""),
  fullName: z.string().trim().min(2, "Nom complet requis.").max(120),
  phone: z
    .union([z.literal(""), z.string().trim().min(8, "Numéro invalide.").max(20)])
    .default(""),
  role: z.enum(["manager", "agent"]),
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

export const createDealSchema = z
  .object({
    property_id: uuid,
    client_id: uuid,
    total_amount: z.number().positive("Montant total invalide."),
    payment_mode: z.enum(["cash", "echelonne"]),
    contract_type: z.enum(["acd", "lettre_villageoise", "approbation_travaux"]),
    deposit_amount: z.number().nonnegative().optional(),
    num_months: z.number().int().min(0).max(120).optional(),
    first_due_date: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.payment_mode === "echelonne") {
      if (data.deposit_amount === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "L'acompte est requis pour un paiement échelonné.",
          path: ["deposit_amount"],
        });
      } else if (data.deposit_amount >= data.total_amount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "L'acompte doit être inférieur au montant total.",
          path: ["deposit_amount"],
        });
      }
      if (!data.first_due_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La date de première échéance est requise.",
          path: ["first_due_date"],
        });
      }
    }
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

export const organizationSettingsSchema = z.object({
  name: z.string().trim().min(2, "Nom d'entreprise requis.").max(120),
  billing_email: z
    .union([z.string().trim().email("E-mail invalide."), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
  profile: z.object({
    logo_url: z
      .union([z.string().url(), z.literal(""), z.null()])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : v)),
    legal_name: z.string().trim().max(160).nullable().optional(),
    tagline: z.string().trim().max(200).nullable().optional(),
    contact_email: z
      .union([z.string().trim().email(), z.literal(""), z.null()])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : v)),
    contact_phone: z
      .union([z.string().trim().min(8).max(20), z.literal(""), z.null()])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : v)),
    whatsapp: z
      .union([z.string().trim().min(8).max(20), z.literal(""), z.null()])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : v)),
    address: z.string().trim().max(300).nullable().optional(),
    city: z.string().trim().max(80).nullable().optional(),
    country: z.string().trim().max(80).nullable().optional(),
    rccm: z.string().trim().max(80).nullable().optional(),
    niu: z.string().trim().max(80).nullable().optional(),
    bank_name: z.string().trim().max(120).nullable().optional(),
    rib: z.string().trim().max(80).nullable().optional(),
    website: z
      .union([z.string().trim().url(), z.literal(""), z.null()])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : v)),
  }),
});
