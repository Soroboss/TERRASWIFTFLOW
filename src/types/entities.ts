import type {
  ActivityType,
  Client,
  ClientSource,
  Deal,
  PaymentMethod,
  Profile,
  Property,
} from "@/types/database";

export interface PaymentSchedule {
  id: string;
  deal_id: string;
  organization_id: string;
  due_date: string;
  amount_due: number;
  label: string;
}

export interface Payment {
  id: string;
  schedule_id: string | null;
  deal_id: string;
  organization_id: string;
  amount: number;
  method: PaymentMethod;
  paid_at: string;
  receipt_number: string;
  recorded_by: string | null;
}

export interface Document {
  id: string;
  organization_id: string;
  property_id: string | null;
  doc_type: string;
  status: string;
  file_url: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface Activity {
  id: string;
  organization_id: string;
  client_id: string | null;
  agent_id: string | null;
  type: ActivityType;
  note: string | null;
  due_at: string | null;
  done: boolean;
  created_at: string;
}

export interface DealWithRelations extends Deal {
  property?: Property;
  client?: Client;
  agent?: Profile;
}

export interface ScheduleWithPayments extends PaymentSchedule {
  paid_amount: number;
  is_paid: boolean;
  is_overdue: boolean;
}

export interface DealFinancials {
  total_amount: number;
  total_paid: number;
  remaining: number;
  next_schedule: PaymentSchedule | null;
  schedules: ScheduleWithPayments[];
}

export interface DashboardKPIs {
  collected_this_month: number;
  total_remaining: number;
  overdue_count: number;
  overdue_amount: number;
  upcoming_payments: Array<{
    schedule_id: string;
    deal_id: string;
    client_name: string;
    property_title: string;
    due_date: string;
    amount_due: number;
    remaining: number;
  }>;
  overdue_schedules: Array<{
    schedule_id: string;
    deal_id: string;
    client_name: string;
    property_title: string;
    due_date: string;
    amount_due: number;
    remaining: number;
  }>;
}

export const CLIENT_SOURCE_LABELS: Record<ClientSource, string> = {
  whatsapp: "WhatsApp",
  terrain: "Sur le terrain",
  facebook: "Facebook",
  salon: "Salon / Événement",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  wave: "Wave",
  orange_money: "Orange Money",
  mtn: "MTN MoMo",
  especes: "Espèces",
  virement: "Virement bancaire",
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  appel: "Appel",
  visite: "Visite",
  relance: "Relance",
};

export type { ActivityType, ClientSource };
