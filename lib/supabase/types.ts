export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          plan: "essencial" | "pro";
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status: "active" | "canceled" | "past_due";
          onesignal_player_id: string | null;
          notify_push: boolean;
          notify_email: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      admins: {
        Row: { id: string; user_id: string; name: string | null; created_at: string };
        Insert: { id?: string; user_id: string; name?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["admins"]["Insert"]>;
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          type: "flight" | "accumulation" | "card";
          title: string;
          status: "active" | "paused" | "completed";
          origin: string | null;
          destination: string | null;
          date_from: string | null;
          date_to: string | null;
          max_miles: number | null;
          cabin_class: "economy" | "business" | "any" | null;
          program: string | null;
          passengers: number | null;
          description: string | null;
          opportunity_types: string[] | null;
          target_program: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["goals"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["goals"]["Insert"]>;
      };
      opportunities: {
        Row: {
          id: string;
          title: string;
          type: string; // "transferencia-bonus" | "acumulo-turbinado" | "clube" | "cartao" | "passagem"
          program: string | null;
          description: string | null;
          external_url: string | null;
          is_vip: boolean;
          active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          // Flight fields
          origin: string | null;
          destination: string | null;
          cabin_class: string | null;
          miles_amount: number | null;
          tax_amount: number | null;
          available_from: string | null;
          available_to: string | null;
          // Transfer/accumulation fields
          bonus_percentage: number | null;
          min_transfer: number | null;
          max_transfer: number | null;
          valid_until: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["opportunities"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["opportunities"]["Insert"]>;
      };
      alerts: {
        Row: {
          id: string;
          opportunity_id: string;
          goal_id: string;
          user_id: string;
          notified_push: boolean;
          notified_email: boolean;
          seen_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["alerts"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["alerts"]["Insert"]>;
      };
      notifications_log: {
        Row: {
          id: string;
          user_id: string | null;
          alert_id: string | null;
          channel: "push" | "email";
          status: string;
          sent_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["notifications_log"]["Row"], "id" | "sent_at"> & {
          id?: string;
          sent_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications_log"]["Insert"]>;
      };
      agency_requests: {
        Row: {
          id: string;
          user_id: string;
          opportunity_id: string | null;
          origin: string;
          destination: string;
          travel_date: string | null;
          return_date: string | null;
          passengers: number;
          cabin_class: string;
          flexible_dates: boolean;
          notes: string | null;
          contact_name: string;
          contact_phone: string;
          contact_email: string;
          status: "new" | "quoting" | "sent" | "closed" | "lost";
          admin_notes: string | null;
          quoted_price: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["agency_requests"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["agency_requests"]["Insert"]>;
      };
      blog_posts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          excerpt: string | null;
          content: string;
          cover_image_url: string | null;
          tags: string[] | null;
          published: boolean;
          published_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["blog_posts"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["blog_posts"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Convenience types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Goal = Database["public"]["Tables"]["goals"]["Row"];
export type Opportunity = Database["public"]["Tables"]["opportunities"]["Row"];
export type Alert = Database["public"]["Tables"]["alerts"]["Row"];
export type AgencyRequest = Database["public"]["Tables"]["agency_requests"]["Row"];
export type BlogPost = Database["public"]["Tables"]["blog_posts"]["Row"];
