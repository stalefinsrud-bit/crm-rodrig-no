export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_text: string
          activity_type: Database["public"]["Enums"]["activity_type"]
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          is_system_generated: boolean
        }
        Insert: {
          activity_text: string
          activity_type?: Database["public"]["Enums"]["activity_type"]
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_system_generated?: boolean
        }
        Update: {
          activity_text?: string
          activity_type?: Database["public"]["Enums"]["activity_type"]
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_system_generated?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      board_snapshots: {
        Row: {
          created_at: string
          created_by: string | null
          filters: Json
          funnel_data: Json
          id: string
          kpi_data: Json
          partner_conversion_rate: number | null
          snapshot_date: string
          total_pipeline: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          filters?: Json
          funnel_data?: Json
          id?: string
          kpi_data?: Json
          partner_conversion_rate?: number | null
          snapshot_date?: string
          total_pipeline?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          filters?: Json
          funnel_data?: Json
          id?: string
          kpi_data?: Json
          partner_conversion_rate?: number | null
          snapshot_date?: string
          total_pipeline?: number
        }
        Relationships: []
      }
      companies: {
        Row: {
          code: string | null
          company: string
          company_type: string | null
          country: string | null
          created_at: string
          created_by: string | null
          email: string | null
          first_name: string | null
          fleet_size: number | null
          id: string
          last_contact_date: string | null
          last_name: string | null
          next_action: string | null
          partner_stage: string | null
          phone: string | null
          priority: string
          region: string | null
          role: string | null
          size: string | null
          source: string | null
          status: string
          strategic_insight: string | null
          updated_at: string
          vessel_segment: string | null
          vessel_type: string | null
          website: string | null
        }
        Insert: {
          code?: string | null
          company: string
          company_type?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          first_name?: string | null
          fleet_size?: number | null
          id?: string
          last_contact_date?: string | null
          last_name?: string | null
          next_action?: string | null
          partner_stage?: string | null
          phone?: string | null
          priority?: string
          region?: string | null
          role?: string | null
          size?: string | null
          source?: string | null
          status?: string
          strategic_insight?: string | null
          updated_at?: string
          vessel_segment?: string | null
          vessel_type?: string | null
          website?: string | null
        }
        Update: {
          code?: string | null
          company?: string
          company_type?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          first_name?: string | null
          fleet_size?: number | null
          id?: string
          last_contact_date?: string | null
          last_name?: string | null
          next_action?: string | null
          partner_stage?: string | null
          phone?: string | null
          priority?: string
          region?: string | null
          role?: string | null
          size?: string | null
          source?: string | null
          status?: string
          strategic_insight?: string | null
          updated_at?: string
          vessel_segment?: string | null
          vessel_type?: string | null
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      prospects: {
        Row: {
          company: string
          contact_person: string | null
          country: string | null
          created_at: string
          created_by: string | null
          date_contacted: string | null
          email: string | null
          estimated_value: number | null
          fleet_size: number | null
          id: string
          next_followup: string | null
          notes_internal: string | null
          phone: string | null
          priority: Database["public"]["Enums"]["prospect_priority"]
          probability: number
          prospect_list: Database["public"]["Enums"]["prospect_list"]
          segment: string | null
          status: Database["public"]["Enums"]["prospect_status"]
          updated_at: string
          weighted_value: number | null
        }
        Insert: {
          company: string
          contact_person?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          date_contacted?: string | null
          email?: string | null
          estimated_value?: number | null
          fleet_size?: number | null
          id?: string
          next_followup?: string | null
          notes_internal?: string | null
          phone?: string | null
          priority?: Database["public"]["Enums"]["prospect_priority"]
          probability?: number
          prospect_list?: Database["public"]["Enums"]["prospect_list"]
          segment?: string | null
          status?: Database["public"]["Enums"]["prospect_status"]
          updated_at?: string
          weighted_value?: number | null
        }
        Update: {
          company?: string
          contact_person?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          date_contacted?: string | null
          email?: string | null
          estimated_value?: number | null
          fleet_size?: number | null
          id?: string
          next_followup?: string | null
          notes_internal?: string | null
          phone?: string | null
          priority?: Database["public"]["Enums"]["prospect_priority"]
          probability?: number
          prospect_list?: Database["public"]["Enums"]["prospect_list"]
          segment?: string | null
          status?: Database["public"]["Enums"]["prospect_status"]
          updated_at?: string
          weighted_value?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      activity_type:
        | "email"
        | "phone"
        | "meeting"
        | "linkedin"
        | "presentation"
        | "internal"
      app_role: "admin" | "user"
      prospect_list:
        | "December 2025 – Dealers/Partners"
        | "Master Ship Operator – End Users"
      prospect_priority: "High" | "Medium" | "Low"
      prospect_status:
        | "New Lead"
        | "Contacted"
        | "Meeting Scheduled"
        | "Proposal Sent"
        | "Negotiation"
        | "Agreement Signed"
        | "Lost"
        | "On Hold"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_type: [
        "email",
        "phone",
        "meeting",
        "linkedin",
        "presentation",
        "internal",
      ],
      app_role: ["admin", "user"],
      prospect_list: [
        "December 2025 – Dealers/Partners",
        "Master Ship Operator – End Users",
      ],
      prospect_priority: ["High", "Medium", "Low"],
      prospect_status: [
        "New Lead",
        "Contacted",
        "Meeting Scheduled",
        "Proposal Sent",
        "Negotiation",
        "Agreement Signed",
        "Lost",
        "On Hold",
      ],
    },
  },
} as const
