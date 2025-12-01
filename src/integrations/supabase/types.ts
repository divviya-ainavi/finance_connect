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
      reviews: {
        Row: {
          connection_request_id: string
          content: string
          created_at: string | null
          helpful_count: number | null
          id: string
          rating: number
          rating_categories: Json | null
          reviewee_profile_id: string
          reviewer_profile_id: string
          reviewer_type: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          connection_request_id: string
          content: string
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          rating: number
          rating_categories?: Json | null
          reviewee_profile_id: string
          reviewer_profile_id: string
          reviewer_type: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          connection_request_id?: string
          content?: string
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          rating?: number
          rating_categories?: Json | null
          reviewee_profile_id?: string
          reviewer_profile_id?: string
          reviewer_type?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_connection_request_id_fkey"
            columns: ["connection_request_id"]
            isOneToOne: false
            referencedRelation: "connection_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_profile_id_fkey"
            columns: ["reviewee_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_profile_id_fkey"
            columns: ["reviewer_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      test_attempts: {
        Row: {
          attempted_at: string | null
          id: string
          lockout_until: string | null
          passed: boolean
          questions_answered: Json | null
          role: Database["public"]["Enums"]["finance_role"]
          score: number
          worker_profile_id: string
        }
        Insert: {
          attempted_at?: string | null
          id?: string
          lockout_until?: string | null
          passed: boolean
          questions_answered?: Json | null
          role: Database["public"]["Enums"]["finance_role"]
          score: number
          worker_profile_id: string
        }
        Update: {
          attempted_at?: string | null
          id?: string
          lockout_until?: string | null
          passed?: boolean
          questions_answered?: Json | null
          role?: Database["public"]["Enums"]["finance_role"]
          score?: number
          worker_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_attempts_worker_profile_id_fkey"
            columns: ["worker_profile_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      test_questions: {
        Row: {
          correct_answer: number
          created_at: string | null
          id: string
          options: Json
          question_text: string
          role: Database["public"]["Enums"]["finance_role"]
        }
        Insert: {
          correct_answer: number
          created_at?: string | null
          id?: string
          options: Json
          question_text: string
          role: Database["public"]["Enums"]["finance_role"]
        }
        Update: {
          correct_answer?: number
          created_at?: string | null
          id?: string
          options?: Json
          question_text?: string
          role?: Database["public"]["Enums"]["finance_role"]
        }
        Relationships: []
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
      worker_languages: {
        Row: {
          created_at: string | null
          id: string
          language_name: string
          spoken_level: string | null
          worker_profile_id: string
          written_level: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          language_name: string
          spoken_level?: string | null
          worker_profile_id: string
          written_level?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          language_name?: string
          spoken_level?: string | null
          worker_profile_id?: string
          written_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "worker_languages_worker_profile_id_fkey"
            columns: ["worker_profile_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_profiles: {
        Row: {
          availability: Json | null
          availability_exceptions: Json | null
          available_from: string | null
          company_sizes: string[] | null
          created_at: string | null
          cv_url: string | null
          hourly_rate_max: number | null
          hourly_rate_min: number | null
          id: string
          industries: string[] | null
          languages: Json | null
          location: string | null
          location_constraints: string | null
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
          rate_negotiable: boolean | null
          roles: Database["public"]["Enums"]["finance_role"][]
          systems: string[] | null
          total_hours_per_week: number | null
          travel_time_minutes: number | null
          updated_at: string | null
          visibility_mode: Database["public"]["Enums"]["visibility_mode"] | null
        }
        Insert: {
          availability?: Json | null
          availability_exceptions?: Json | null
          available_from?: string | null
          company_sizes?: string[] | null
          created_at?: string | null
          cv_url?: string | null
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          id?: string
          industries?: string[] | null
          languages?: Json | null
          location?: string | null
          location_constraints?: string | null
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
          rate_negotiable?: boolean | null
          roles?: Database["public"]["Enums"]["finance_role"][]
          systems?: string[] | null
          total_hours_per_week?: number | null
          travel_time_minutes?: number | null
          updated_at?: string | null
          visibility_mode?:
            | Database["public"]["Enums"]["visibility_mode"]
            | null
        }
        Update: {
          availability?: Json | null
          availability_exceptions?: Json | null
          available_from?: string | null
          company_sizes?: string[] | null
          created_at?: string | null
          cv_url?: string | null
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          id?: string
          industries?: string[] | null
          languages?: Json | null
          location?: string | null
          location_constraints?: string | null
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
          rate_negotiable?: boolean | null
          roles?: Database["public"]["Enums"]["finance_role"][]
          systems?: string[] | null
          total_hours_per_week?: number | null
          travel_time_minutes?: number | null
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
      worker_qualifications: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          qualification_type: Database["public"]["Enums"]["qualification_type"]
          worker_profile_id: string
          year_obtained: number | null
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          qualification_type: Database["public"]["Enums"]["qualification_type"]
          worker_profile_id: string
          year_obtained?: number | null
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string
          qualification_type?: Database["public"]["Enums"]["qualification_type"]
          worker_profile_id?: string
          year_obtained?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "worker_qualifications_worker_profile_id_fkey"
            columns: ["worker_profile_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_references: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          id: string
          referee_company: string | null
          referee_email: string
          referee_name: string
          referee_role: string | null
          status: string | null
          updated_at: string | null
          worker_profile_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          referee_company?: string | null
          referee_email: string
          referee_name: string
          referee_role?: string | null
          status?: string | null
          updated_at?: string | null
          worker_profile_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          referee_company?: string | null
          referee_email?: string
          referee_name?: string
          referee_role?: string | null
          status?: string | null
          updated_at?: string | null
          worker_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_references_worker_profile_id_fkey"
            columns: ["worker_profile_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
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
      worker_system_proficiency: {
        Row: {
          created_at: string | null
          id: string
          proficiency_level: number
          system_name: string
          worker_profile_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          proficiency_level: number
          system_name: string
          worker_profile_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          proficiency_level?: number
          system_name?: string
          worker_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_system_proficiency_worker_profile_id_fkey"
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
        | "finance_manager"
        | "cfo_fpa"
      onsite_preference: "fully_remote" | "hybrid" | "onsite"
      qualification_type:
        | "aat_level_2"
        | "aat_level_3"
        | "aat_level_4"
        | "acca_part_qualified"
        | "acca_qualified"
        | "cima_part_qualified"
        | "cima_qualified"
        | "aca_part_qualified"
        | "aca_qualified"
        | "degree"
        | "masters"
        | "other"
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
        "finance_manager",
        "cfo_fpa",
      ],
      onsite_preference: ["fully_remote", "hybrid", "onsite"],
      qualification_type: [
        "aat_level_2",
        "aat_level_3",
        "aat_level_4",
        "acca_part_qualified",
        "acca_qualified",
        "cima_part_qualified",
        "cima_qualified",
        "aca_part_qualified",
        "aca_qualified",
        "degree",
        "masters",
        "other",
      ],
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
