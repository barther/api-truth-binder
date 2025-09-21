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
          created_at: string | null
          dispatcher_id: number
          ends_at: string
          id: number
          note: string | null
          starts_at: string
          type: Database["public"]["Enums"]["absence_type"]
        }
        Insert: {
          created_at?: string | null
          dispatcher_id: number
          ends_at: string
          id?: number
          note?: string | null
          starts_at: string
          type: Database["public"]["Enums"]["absence_type"]
        }
        Update: {
          created_at?: string | null
          dispatcher_id?: number
          ends_at?: string
          id?: number
          note?: string | null
          starts_at?: string
          type?: Database["public"]["Enums"]["absence_type"]
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
          created_at: string | null
          created_by: number | null
          deleted_at: string | null
          dispatcher_id: number
          ends_at: string
          id: number
          requires_trainer: boolean | null
          source: Database["public"]["Enums"]["assignment_source"]
          starts_at: string
          trainer_id: number | null
          trick_instance_id: number
          version: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: number | null
          deleted_at?: string | null
          dispatcher_id: number
          ends_at: string
          id?: number
          requires_trainer?: boolean | null
          source?: Database["public"]["Enums"]["assignment_source"]
          starts_at: string
          trainer_id?: number | null
          trick_instance_id: number
          version?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: number | null
          deleted_at?: string | null
          dispatcher_id?: number
          ends_at?: string
          id?: number
          requires_trainer?: boolean | null
          source?: Database["public"]["Enums"]["assignment_source"]
          starts_at?: string
          trainer_id?: number | null
          trick_instance_id?: number
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "dispatchers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_dispatcher_id_fkey"
            columns: ["dispatcher_id"]
            isOneToOne: false
            referencedRelation: "dispatchers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "dispatchers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_trick_instance_id_fkey"
            columns: ["trick_instance_id"]
            isOneToOne: false
            referencedRelation: "trick_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      atw_jobs: {
        Row: {
          created_at: string | null
          description: string | null
          desk_id: number | null
          id: number
          is_active: boolean | null
          required_rank: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          desk_id?: number | null
          id?: number
          is_active?: boolean | null
          required_rank?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          desk_id?: number | null
          id?: number
          is_active?: boolean | null
          required_rank?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_fkey"
            columns: ["actor"]
            isOneToOne: false
            referencedRelation: "dispatchers"
            referencedColumns: ["id"]
          },
        ]
      }
      desks: {
        Row: {
          code: string
          created_at: string | null
          id: number
          is_active: boolean | null
          name: string
          territory: string | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          name: string
          territory?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          name?: string
          territory?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      dispatchers: {
        Row: {
          badge: string
          created_at: string | null
          first_name: string
          hire_date: string
          id: number
          is_active: boolean | null
          last_name: string
          rank: string | null
          updated_at: string | null
        }
        Insert: {
          badge: string
          created_at?: string | null
          first_name: string
          hire_date: string
          id?: number
          is_active?: boolean | null
          last_name: string
          rank?: string | null
          updated_at?: string | null
        }
        Update: {
          badge?: string
          created_at?: string | null
          first_name?: string
          hire_date?: string
          id?: number
          is_active?: boolean | null
          last_name?: string
          rank?: string | null
          updated_at?: string | null
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
        Relationships: [
          {
            foreignKeyName: "hold_downs_awarded_to_fkey"
            columns: ["awarded_to"]
            isOneToOne: false
            referencedRelation: "dispatchers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hold_downs_desk_id_fkey"
            columns: ["desk_id"]
            isOneToOne: false
            referencedRelation: "desks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hold_downs_trick_id_fkey"
            columns: ["trick_id"]
            isOneToOne: false
            referencedRelation: "tricks"
            referencedColumns: ["id"]
          },
        ]
      }
      qualifications: {
        Row: {
          created_at: string | null
          desk_id: number
          dispatcher_id: number
          id: number
          is_active: boolean | null
          notes: string | null
          qualified_on: string
          trainer_id: number | null
        }
        Insert: {
          created_at?: string | null
          desk_id: number
          dispatcher_id: number
          id?: number
          is_active?: boolean | null
          notes?: string | null
          qualified_on: string
          trainer_id?: number | null
        }
        Update: {
          created_at?: string | null
          desk_id?: number
          dispatcher_id?: number
          id?: number
          is_active?: boolean | null
          notes?: string | null
          qualified_on?: string
          trainer_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "qualifications_desk_id_fkey"
            columns: ["desk_id"]
            isOneToOne: false
            referencedRelation: "desks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qualifications_dispatcher_id_fkey"
            columns: ["dispatcher_id"]
            isOneToOne: false
            referencedRelation: "dispatchers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qualifications_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "dispatchers"
            referencedColumns: ["id"]
          },
        ]
      }
      seniority: {
        Row: {
          created_at: string | null
          dispatcher_id: number
          rank: string
          tie_breaker: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dispatcher_id: number
          rank: string
          tie_breaker?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dispatcher_id?: number
          rank?: string
          tie_breaker?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seniority_dispatcher_id_fkey"
            columns: ["dispatcher_id"]
            isOneToOne: true
            referencedRelation: "dispatchers"
            referencedColumns: ["id"]
          },
        ]
      }
      trick_instances: {
        Row: {
          created_at: string | null
          ends_at: string
          id: number
          is_holiday: boolean | null
          starts_at: string
          trick_id: number
        }
        Insert: {
          created_at?: string | null
          ends_at: string
          id?: number
          is_holiday?: boolean | null
          starts_at: string
          trick_id: number
        }
        Update: {
          created_at?: string | null
          ends_at?: string
          id?: number
          is_holiday?: boolean | null
          starts_at?: string
          trick_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "trick_instances_trick_id_fkey"
            columns: ["trick_id"]
            isOneToOne: false
            referencedRelation: "tricks"
            referencedColumns: ["id"]
          },
        ]
      }
      tricks: {
        Row: {
          created_at: string | null
          days_mask: unknown
          desk_id: number
          id: number
          is_active: boolean | null
          name: string
          shift_end: string
          shift_start: string
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          days_mask: unknown
          desk_id: number
          id?: number
          is_active?: boolean | null
          name: string
          shift_end: string
          shift_start: string
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          days_mask?: unknown
          desk_id?: number
          id?: number
          is_active?: boolean | null
          name?: string
          shift_end?: string
          shift_start?: string
          timezone?: string | null
          updated_at?: string | null
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
      [_ in never]: never
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
