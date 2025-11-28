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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      business_profiles: {
        Row: {
          company_name: string
          contact_name: string
          contact_role: string | null
          created_at: string | null
          id: string
          profile_id: string
          updated_at: string | null
        }
        Insert: {
          company_name: string
          contact_name: string
          contact_role?: string | null
          created_at?: string | null
          id?: string
          profile_id: string
          updated_at?: string | null
        }
        Update: {
          company_name?: string
          contact_name?: string
          contact_role?: string | null
          created_at?: string | null
          id?: string
          profile_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      connection_requests: {
        Row: {
          business_profile_id: string
          created_at: string | null
          hours_per_week: number | null
          id: string
          message: string | null
          rate_offered: number | null
          remote_onsite: string | null
          status: Database["public"]["Enums"]["connection_status"] | null
          updated_at: string | null
          worker_profile_id: string
        }
        Insert: {
          business_profile_id: string
          created_at?: string | null
          hours_per_week?: number | null
          id?: string
          message?: string | null
          rate_offered?: number | null
          remote_onsite?: string | null
          status?: Database["public"]["Enums"]["connection_status"] | null
          updated_at?: string | null
          worker_profile_id: string
        }
        Update: {
          business_profile_id?: string
          created_at?: string | null
          hours_per_week?: number | null
          id?: string
          message?: string | null
          rate_offered?: number | null
          remote_onsite?: string | null
          status?: Database["public"]["Enums"]["connection_status"] | null
          updated_at?: string | null
          worker_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connection_requests_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_requests_worker_profile_id_fkey"
            columns: ["worker_profile_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      shortlists: {
        Row: {
          business_profile_id: string
          created_at: string | null
          id: string
          worker_profile_id: string
        }
        Insert: {
          business_profile_id: string
          created_at?: string | null
          id?: string
          worker_profile_id: string
        }
        Update: {
          business_profile_id?: string
          created_at?: string | null
          id?: string
          worker_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shortlists_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortlists_worker_profile_id_fkey"
            columns: ["worker_profile_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_statuses: {
        Row: {
          created_at: string | null
          id: string
          interview_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          notes: string | null
          references_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          testing_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          updated_at: string | null
          worker_profile_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interview_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          notes?: string | null
          references_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          testing_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          updated_at?: string | null
          worker_profile_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interview_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          notes?: string | null
          references_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          testing_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          updated_at?: string | null
          worker_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_statuses_worker_profile_id_fkey"
            columns: ["worker_profile_id"]
            isOneToOne: true
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_profiles: {
        Row: {
          availability: Json | null
          company_sizes: string[] | null
          created_at: string | null
          cv_url: string | null
          id: string
          industries: string[] | null
          languages: Json | null
          location: string | null
          max_commute_km: number | null
          max_days_onsite: number | null
          name: string
          onsite_preference:
            | Database["public"]["Enums"]["onsite_preference"]
            | null
          own_equipment: boolean | null
          profile_id: string
          pseudonym: string | null
          qualifications: string | null
          roles: Database["public"]["Enums"]["finance_role"][]
          systems: string[] | null
          updated_at: string | null
          visibility_mode: Database["public"]["Enums"]["visibility_mode"] | null
        }
        Insert: {
          availability?: Json | null
          company_sizes?: string[] | null
          created_at?: string | null
          cv_url?: string | null
          id?: string
          industries?: string[] | null
          languages?: Json | null
          location?: string | null
          max_commute_km?: number | null
          max_days_onsite?: number | null
          name: string
          onsite_preference?:
            | Database["public"]["Enums"]["onsite_preference"]
            | null
          own_equipment?: boolean | null
          profile_id: string
          pseudonym?: string | null
          qualifications?: string | null
          roles?: Database["public"]["Enums"]["finance_role"][]
          systems?: string[] | null
          updated_at?: string | null
          visibility_mode?:
            | Database["public"]["Enums"]["visibility_mode"]
            | null
        }
        Update: {
          availability?: Json | null
          company_sizes?: string[] | null
          created_at?: string | null
          cv_url?: string | null
          id?: string
          industries?: string[] | null
          languages?: Json | null
          location?: string | null
          max_commute_km?: number | null
          max_days_onsite?: number | null
          name?: string
          onsite_preference?:
            | Database["public"]["Enums"]["onsite_preference"]
            | null
          own_equipment?: boolean | null
          profile_id?: string
          pseudonym?: string | null
          qualifications?: string | null
          roles?: Database["public"]["Enums"]["finance_role"][]
          systems?: string[] | null
          updated_at?: string | null
          visibility_mode?:
            | Database["public"]["Enums"]["visibility_mode"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "worker_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_skills: {
        Row: {
          created_at: string | null
          id: string
          skill_level: number
          skill_name: string
          worker_profile_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          skill_level: number
          skill_name: string
          worker_profile_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          skill_level?: number
          skill_name?: string
          worker_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_skills_worker_profile_id_fkey"
            columns: ["worker_profile_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      app_role: "admin" | "moderator" | "user"
      connection_status: "pending" | "accepted" | "declined"
      finance_role:
        | "accounts_payable"
        | "accounts_receivable"
        | "bookkeeper"
        | "payroll_clerk"
        | "management_accountant"
        | "credit_controller"
        | "financial_controller"
      onsite_preference: "fully_remote" | "hybrid" | "onsite"
      user_type: "worker" | "business"
      verification_status:
        | "not_started"
        | "in_progress"
        | "completed"
        | "verified"
        | "passed"
      visibility_mode: "anonymous" | "fully_disclosed"
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
      app_role: ["admin", "moderator", "user"],
      connection_status: ["pending", "accepted", "declined"],
      finance_role: [
        "accounts_payable",
        "accounts_receivable",
        "bookkeeper",
        "payroll_clerk",
        "management_accountant",
        "credit_controller",
        "financial_controller",
      ],
      onsite_preference: ["fully_remote", "hybrid", "onsite"],
      user_type: ["worker", "business"],
      verification_status: [
        "not_started",
        "in_progress",
        "completed",
        "verified",
        "passed",
      ],
      visibility_mode: ["anonymous", "fully_disclosed"],
    },
  },
} as const
