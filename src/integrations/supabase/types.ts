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
      email_otps: {
        Row: {
          attempts: number
          created_at: string
          email: string
          expires_at: string
          id: string
          otp: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          email: string
          expires_at: string
          id?: string
          otp: string
        }
        Update: {
          attempts?: number
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          otp?: string
        }
        Relationships: []
      }
      gym_check_ins: {
        Row: {
          check_in_time: string | null
          check_out_time: string | null
          duration_minutes: number | null
          equipment_used: string[] | null
          gym_id: string
          id: string
          member_id: string | null
          workout_type: string | null
        }
        Insert: {
          check_in_time?: string | null
          check_out_time?: string | null
          duration_minutes?: number | null
          equipment_used?: string[] | null
          gym_id: string
          id?: string
          member_id?: string | null
          workout_type?: string | null
        }
        Update: {
          check_in_time?: string | null
          check_out_time?: string | null
          duration_minutes?: number | null
          equipment_used?: string[] | null
          gym_id?: string
          id?: string
          member_id?: string | null
          workout_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_gym_check_ins_gym"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gym_check_ins_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "gym_members"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_classes: {
        Row: {
          capacity: number | null
          class_name: string
          enrolled: number | null
          gym_id: string
          id: string
          instructor: string | null
          popularity_score: number | null
          revenue_generated: number | null
          schedule: Json | null
        }
        Insert: {
          capacity?: number | null
          class_name: string
          enrolled?: number | null
          gym_id: string
          id?: string
          instructor?: string | null
          popularity_score?: number | null
          revenue_generated?: number | null
          schedule?: Json | null
        }
        Update: {
          capacity?: number | null
          class_name?: string
          enrolled?: number | null
          gym_id?: string
          id?: string
          instructor?: string | null
          popularity_score?: number | null
          revenue_generated?: number | null
          schedule?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_gym_classes_gym"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_equipment: {
        Row: {
          category: string
          gym_id: string
          id: string
          last_maintenance: string | null
          name: string
          purchase_date: string | null
          status: string | null
          usage_count: number | null
          utilization_rate: number | null
        }
        Insert: {
          category: string
          gym_id: string
          id?: string
          last_maintenance?: string | null
          name: string
          purchase_date?: string | null
          status?: string | null
          usage_count?: number | null
          utilization_rate?: number | null
        }
        Update: {
          category?: string
          gym_id?: string
          id?: string
          last_maintenance?: string | null
          name?: string
          purchase_date?: string | null
          status?: string | null
          usage_count?: number | null
          utilization_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_gym_equipment_gym"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_insights: {
        Row: {
          action_items: Json | null
          created_at: string | null
          description: string
          gym_id: string
          id: string
          insight_type: string
          is_read: boolean | null
          potential_impact: number | null
          priority: string | null
          title: string
        }
        Insert: {
          action_items?: Json | null
          created_at?: string | null
          description: string
          gym_id: string
          id?: string
          insight_type: string
          is_read?: boolean | null
          potential_impact?: number | null
          priority?: string | null
          title: string
        }
        Update: {
          action_items?: Json | null
          created_at?: string | null
          description?: string
          gym_id?: string
          id?: string
          insight_type?: string
          is_read?: boolean | null
          potential_impact?: number | null
          priority?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_gym_insights_gym"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_members: {
        Row: {
          check_ins: number | null
          churn_risk_score: number | null
          created_at: string | null
          email: string | null
          expiry_date: string | null
          full_name: string
          gym_id: string
          id: string
          join_date: string
          last_check_in: string | null
          lifetime_value: number | null
          membership_status: string
          membership_type: string
          monthly_fee: number | null
          phone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          check_ins?: number | null
          churn_risk_score?: number | null
          created_at?: string | null
          email?: string | null
          expiry_date?: string | null
          full_name: string
          gym_id: string
          id?: string
          join_date?: string
          last_check_in?: string | null
          lifetime_value?: number | null
          membership_status?: string
          membership_type?: string
          monthly_fee?: number | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          check_ins?: number | null
          churn_risk_score?: number | null
          created_at?: string | null
          email?: string | null
          expiry_date?: string | null
          full_name?: string
          gym_id?: string
          id?: string
          join_date?: string
          last_check_in?: string | null
          lifetime_value?: number | null
          membership_status?: string
          membership_type?: string
          monthly_fee?: number | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_gym_members_gym"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_revenue: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          gym_id: string
          id: string
          member_id: string | null
          revenue_type: string
          transaction_date: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          gym_id: string
          id?: string
          member_id?: string | null
          revenue_type: string
          transaction_date?: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          gym_id?: string
          id?: string
          member_id?: string | null
          revenue_type?: string
          transaction_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_gym_revenue_gym"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gym_revenue_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "gym_members"
            referencedColumns: ["id"]
          },
        ]
      }
      gyms: {
        Row: {
          created_at: string | null
          id: string
          name: string
          owner_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          owner_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      phone_otps: {
        Row: {
          attempts: number
          created_at: string
          expires_at: string
          id: string
          otp: string
          phone: string
          verified: boolean
        }
        Insert: {
          attempts?: number
          created_at?: string
          expires_at: string
          id?: string
          otp: string
          phone: string
          verified?: boolean
        }
        Update: {
          attempts?: number
          created_at?: string
          expires_at?: string
          id?: string
          otp?: string
          phone?: string
          verified?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          fitness_goal: string | null
          id: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          fitness_goal?: string | null
          id: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          fitness_goal?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      workouts: {
        Row: {
          bmi: number | null
          content: string
          created_at: string
          goal: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bmi?: number | null
          content: string
          created_at?: string
          goal?: string | null
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bmi?: number | null
          content?: string
          created_at?: string
          goal?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_otps: { Args: never; Returns: undefined }
      cleanup_expired_phone_otps: { Args: never; Returns: undefined }
      get_member_retention_rate: { Args: { p_gym_id: string }; Returns: number }
      get_monthly_revenue_trend: {
        Args: { p_gym_id: string }
        Returns: {
          month: string
          total_revenue: number
        }[]
      }
      get_peak_hours: {
        Args: { p_gym_id: string }
        Returns: {
          check_in_count: number
          hour: number
        }[]
      }
      is_gym_owner: { Args: { _gym_id: string }; Returns: boolean }
      send_welcome_email: {
        Args: { user_email: string; user_name?: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
