export type ClientSource = "whatsapp" | "terrain" | "facebook" | "salon";
export type ActivityType = "appel" | "visite" | "relance";
export type Plan = "starter" | "pro" | "business";
export type SubscriptionStatus = "trial" | "active" | "past_due" | "cancelled";
export type UserRole = "owner" | "manager" | "agent";
export type PropertyType = "terrain" | "maison";
export type PropertyStatus = "libre" | "reserve" | "vendu";
export type DealStatus = "en_cours" | "solde" | "annule";
export type PaymentMode = "cash" | "echelonne";
export type ContractType = "acd" | "lettre_villageoise" | "approbation_travaux";
export type ContractStage = "provisoire" | "definitif";
export type ScheduleLineType = "acompte" | "mensualite" | "reliquat" | "cash";
export type PaymentMethod = "wave" | "orange_money" | "mtn" | "especes" | "virement";

export interface Organization {
  id: string;
  name: string;
  plan: Plan;
  modules: Record<string, unknown>;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string | null;
  receipt_counter: number;
  suspended_at?: string | null;
  billing_email?: string | null;
  notes?: string | null;
  company_profile?: Record<string, unknown>;
  created_at: string;
}

export interface Profile {
  id: string;
  organization_id: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  active: boolean;
  created_at: string;
}

export interface Masterplan {
  id: string;
  organization_id: string;
  name: string;
  image_url: string | null;
  total_lots: number;
  created_at: string;
}

export interface Property {
  id: string;
  organization_id: string;
  type: PropertyType;
  title: string;
  reference: string;
  status: PropertyStatus;
  price_total: number;
  surface_m2: number | null;
  price_per_m2: number | null;
  location_label: string | null;
  lat: number | null;
  lng: number | null;
  photos: string[];
  lot_number: string | null;
  masterplan_id: string | null;
  rooms: number | null;
  construction_status: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Client {
  id: string;
  organization_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  is_diaspora: boolean;
  country: string;
  assigned_agent_id: string | null;
  source: ClientSource | null;
  created_at: string;
}

export interface Deal {
  id: string;
  organization_id: string;
  property_id: string;
  client_id: string;
  agent_id: string;
  total_amount: number;
  status: DealStatus;
  payment_mode: PaymentMode;
  contract_type: ContractType;
  deposit_amount: number | null;
  balance_amount: number | null;
  contract_stage: ContractStage;
  definitive_contract_at: string | null;
  num_months: number | null;
  signed_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: Organization;
        Insert: {
          id?: string;
          name: string;
          plan?: Plan;
          modules?: Record<string, unknown>;
          subscription_status?: SubscriptionStatus;
          trial_ends_at?: string | null;
          receipt_counter?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          plan?: Plan;
          modules?: Record<string, unknown>;
          subscription_status?: SubscriptionStatus;
          trial_ends_at?: string | null;
          receipt_counter?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          organization_id: string;
          full_name: string;
          role?: UserRole;
          phone?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          full_name?: string;
          role?: UserRole;
          phone?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      masterplans: {
        Row: Masterplan;
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          image_url?: string | null;
          total_lots?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          image_url?: string | null;
          total_lots?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      properties: {
        Row: Property;
        Insert: {
          id?: string;
          organization_id: string;
          type: PropertyType;
          title: string;
          reference: string;
          status?: PropertyStatus;
          price_total: number;
          surface_m2?: number | null;
          price_per_m2?: number | null;
          location_label?: string | null;
          lat?: number | null;
          lng?: number | null;
          photos?: string[];
          lot_number?: string | null;
          masterplan_id?: string | null;
          rooms?: number | null;
          construction_status?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          type?: PropertyType;
          title?: string;
          reference?: string;
          status?: PropertyStatus;
          price_total?: number;
          surface_m2?: number | null;
          price_per_m2?: number | null;
          location_label?: string | null;
          lat?: number | null;
          lng?: number | null;
          photos?: string[];
          lot_number?: string | null;
          masterplan_id?: string | null;
          rooms?: number | null;
          construction_status?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: Client;
        Insert: {
          id?: string;
          organization_id: string;
          full_name: string;
          phone: string;
          email?: string | null;
          is_diaspora?: boolean;
          country?: string;
          assigned_agent_id?: string | null;
          source?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          full_name?: string;
          phone?: string;
          email?: string | null;
          is_diaspora?: boolean;
          country?: string;
          assigned_agent_id?: string | null;
          source?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      deals: {
        Row: Deal;
        Insert: {
          id?: string;
          organization_id: string;
          property_id: string;
          client_id: string;
          agent_id: string;
          total_amount: number;
          status?: DealStatus;
          signed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          property_id?: string;
          client_id?: string;
          agent_id?: string;
          total_amount?: number;
          status?: DealStatus;
          signed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
