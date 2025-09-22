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
      absences: {
        Row: {
          dispatcher_id: string
          end_date: string
          id: string
          reason: string | null
          start_date: string
        }
        Insert: {
          dispatcher_id: string
          end_date: string
          id?: string
          reason?: string | null
          start_date: string
        }
        Update: {
          dispatcher_id?: string
          end_date?: string
          id?: string
          reason?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "absences_dispatcher_id_fkey"
            columns: ["dispatcher_id"]
            isOneToOne: false
            referencedRelation: "dispatchers"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          dispatcher_id: string | null
          id: string
          job_id: string
          notes: string | null
          requires_trainer: boolean
          service_date: string
          source: string
        }
        Insert: {
          dispatcher_id?: string | null
          id?: string
          job_id: string
          notes?: string | null
          requires_trainer?: boolean
          service_date: string
          source: string
        }
        Update: {
          dispatcher_id?: string | null
          id?: string
          job_id?: string
          notes?: string | null
          requires_trainer?: boolean
          service_date?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_dispatcher_id_fkey"
            columns: ["dispatcher_id"]
            isOneToOne: false
            referencedRelation: "dispatchers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      atw_jobs: {
        Row: {
          active: boolean
          default_shift: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          default_shift: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          default_shift?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      atw_rotation: {
        Row: {
          atw_job_id: string
          dow: number
          job_id: string
        }
        Insert: {
          atw_job_id: string
          dow: number
          job_id: string
        }
        Update: {
          atw_job_id?: string
          dow?: number
          job_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atw_rotation_atw_job_id_fkey"
            columns: ["atw_job_id"]
            isOneToOne: false
            referencedRelation: "atw_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atw_rotation_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor: number | null
          after_data: Json | null
          before_data: Json | null
          created_at: string | null
          entity: string
          entity_id: number
          id: number
        }
        Insert: {
          action: string
          actor?: number | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string | null
          entity: string
          entity_id: number
          id?: number
        }
        Update: {
          action?: string
          actor?: number | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string | null
          entity?: string
          entity_id?: number
          id?: number
        }
        Relationships: []
      }
      desks: {
        Row: {
          code: string
          division: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          division: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          division?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      dispatcher_qualifications: {
        Row: {
          desk_id: string
          dispatcher_id: string
          qualified: boolean
        }
        Insert: {
          desk_id: string
          dispatcher_id: string
          qualified?: boolean
        }
        Update: {
          desk_id?: string
          dispatcher_id?: string
          qualified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "dispatcher_qualifications_desk_id_fkey"
            columns: ["desk_id"]
            isOneToOne: false
            referencedRelation: "desks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatcher_qualifications_dispatcher_id_fkey"
            columns: ["dispatcher_id"]
            isOneToOne: false
            referencedRelation: "dispatchers"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatchers: {
        Row: {
          emp_id: string
          first_name: string
          id: string
          last_name: string
          seniority_date: string
          status: string
        }
        Insert: {
          emp_id: string
          first_name: string
          id?: string
          last_name: string
          seniority_date: string
          status: string
        }
        Update: {
          emp_id?: string
          first_name?: string
          id?: string
          last_name?: string
          seniority_date?: string
          status?: string
        }
        Relationships: []
      }
      divisions: {
        Row: {
          code: string
          division_id: string
          name: string
        }
        Insert: {
          code: string
          division_id?: string
          name: string
        }
        Update: {
          code?: string
          division_id?: string
          name?: string
        }
        Relationships: []
      }
      hold_downs: {
        Row: {
          actual_end: string | null
          awarded_to: number | null
          created_at: string | null
          desk_id: number
          id: number
          projected_end: string
          rule_blob: Json | null
          starts_at: string
          trick_id: number
          vacancy_reason: Database["public"]["Enums"]["vacancy_reason"]
        }
        Insert: {
          actual_end?: string | null
          awarded_to?: number | null
          created_at?: string | null
          desk_id: number
          id?: number
          projected_end: string
          rule_blob?: Json | null
          starts_at: string
          trick_id: number
          vacancy_reason: Database["public"]["Enums"]["vacancy_reason"]
        }
        Update: {
          actual_end?: string | null
          awarded_to?: number | null
          created_at?: string | null
          desk_id?: number
          id?: number
          projected_end?: string
          rule_blob?: Json | null
          starts_at?: string
          trick_id?: number
          vacancy_reason?: Database["public"]["Enums"]["vacancy_reason"]
        }
        Relationships: []
      }
      job_awards: {
        Row: {
          dispatcher_id: string
          end_date: string | null
          job_award_id: string
          kind: string
          start_date: string
          trick_id: string
        }
        Insert: {
          dispatcher_id: string
          end_date?: string | null
          job_award_id?: string
          kind: string
          start_date: string
          trick_id: string
        }
        Update: {
          dispatcher_id?: string
          end_date?: string | null
          job_award_id?: string
          kind?: string
          start_date?: string
          trick_id?: string
        }
        Relationships: []
      }
      job_ownerships: {
        Row: {
          dispatcher_id: string
          end_date: string | null
          id: string
          job_id: string
          source: string
          start_date: string
        }
        Insert: {
          dispatcher_id: string
          end_date?: string | null
          id?: string
          job_id: string
          source: string
          start_date: string
        }
        Update: {
          dispatcher_id?: string
          end_date?: string | null
          id?: string
          job_id?: string
          source?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_ownerships_dispatcher_id_fkey"
            columns: ["dispatcher_id"]
            isOneToOne: false
            referencedRelation: "dispatchers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_ownerships_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          id: string
          job_code: string
          notes: string | null
          trick_id: string
        }
        Insert: {
          id?: string
          job_code: string
          notes?: string | null
          trick_id: string
        }
        Update: {
          id?: string
          job_code?: string
          notes?: string | null
          trick_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_trick_id_fkey"
            columns: ["trick_id"]
            isOneToOne: false
            referencedRelation: "tricks"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          code: string
          ends_at: string
          shift_id: number
          starts_at: string
        }
        Insert: {
          code: string
          ends_at: string
          shift_id?: number
          starts_at: string
        }
        Update: {
          code?: string
          ends_at?: string
          shift_id?: number
          starts_at?: string
        }
        Relationships: []
      }
      tricks: {
        Row: {
          desk_id: string
          id: string
          shift: string
          work_days: number[]
        }
        Insert: {
          desk_id: string
          id?: string
          shift: string
          work_days: number[]
        }
        Update: {
          desk_id?: string
          id?: string
          shift?: string
          work_days?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "tricks_desk_id_fkey"
            columns: ["desk_id"]
            isOneToOne: false
            referencedRelation: "desks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      active_job_owner_on: {
        Args: { p_date: string; p_job_id: string }
        Returns: {
          dispatcher_id: string
          end_date: string
          source: string
          start_date: string
        }[]
      }
      clear_assignment: {
        Args: { p_date: string; p_job_id: string }
        Returns: undefined
      }
      gbt_bit_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bool_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bool_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bpchar_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bytea_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_cash_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_cash_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_date_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_date_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_enum_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_enum_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float4_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float4_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_inet_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int2_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int2_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int4_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int4_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_numeric_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_oid_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_oid_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_text_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_time_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_time_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_timetz_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_ts_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_ts_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_tstz_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_uuid_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_uuid_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_var_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_var_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey_var_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey_var_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey16_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey16_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey2_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey2_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey32_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey32_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey4_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey4_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey8_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey8_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      jobs_for_date: {
        Args: { p_date: string }
        Returns: {
          desk_id: string
          explicit_assignment_id: string
          job_code: string
          job_id: string
          shift: string
        }[]
      }
      set_job_owner: {
        Args: {
          p_dispatcher_id: string
          p_job_id: string
          p_source: string
          p_start: string
        }
        Returns: undefined
      }
      upsert_assignment: {
        Args: {
          p_date: string
          p_dispatcher_id: string
          p_job_id: string
          p_requires_trainer?: boolean
          p_source: string
        }
        Returns: string
      }
    }
    Enums: {
      absence_type: "VACATION" | "SICK" | "FMLA" | "OOS" | "OTHER"
      assignment_source: "BASE" | "HOLD_DOWN" | "ATW" | "OVERTIME"
      vacancy_reason: "VAC" | "FMLA" | "TRAINING" | "OOS" | "UNKNOWN"
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
      absence_type: ["VACATION", "SICK", "FMLA", "OOS", "OTHER"],
      assignment_source: ["BASE", "HOLD_DOWN", "ATW", "OVERTIME"],
      vacancy_reason: ["VAC", "FMLA", "TRAINING", "OOS", "UNKNOWN"],
    },
  },
} as const
