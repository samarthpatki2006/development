export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_roles: {
        Row: {
          admin_role_type: Database["public"]["Enums"]["admin_role_type"]
          assigned_at: string | null
          assigned_by: string | null
          college_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          permissions: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_role_type: Database["public"]["Enums"]["admin_role_type"]
          assigned_at?: string | null
          assigned_by?: string | null
          college_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_role_type?: Database["public"]["Enums"]["admin_role_type"]
          assigned_at?: string | null
          assigned_by?: string | null
          college_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_roles_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_metrics: {
        Row: {
          academic_year: string | null
          college_id: string
          id: string
          metric_data: Json
          metric_type: string
          recorded_at: string | null
          semester: string | null
        }
        Insert: {
          academic_year?: string | null
          college_id: string
          id?: string
          metric_data: Json
          metric_type: string
          recorded_at?: string | null
          semester?: string | null
        }
        Update: {
          academic_year?: string | null
          college_id?: string
          id?: string
          metric_data?: Json
          metric_type?: string
          recorded_at?: string | null
          semester?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_metrics_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action_description: string | null
          action_type: string
          admin_user_id: string
          college_id: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          module: string | null
          new_values: Json | null
          old_values: Json | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action_description?: string | null
          action_type: string
          admin_user_id: string
          college_id: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          module?: string | null
          new_values?: Json | null
          old_values?: Json | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action_description?: string | null
          action_type?: string
          admin_user_id?: string
          college_id?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          module?: string | null
          new_values?: Json | null
          old_values?: Json | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      colleges: {
        Row: {
          code: string
          created_at: string | null
          id: string
          logo: string | null
          name: string
          primary_color: string | null
          secondary_color: string | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          logo?: string | null
          name: string
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          logo?: string | null
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      communications: {
        Row: {
          college_id: string
          communication_type: string
          content: string
          created_at: string | null
          delivery_stats: Json | null
          id: string
          scheduled_at: string | null
          sender_id: string
          sent_at: string | null
          status: string | null
          target_audience: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          college_id: string
          communication_type: string
          content: string
          created_at?: string | null
          delivery_stats?: Json | null
          id?: string
          scheduled_at?: string | null
          sender_id: string
          sent_at?: string | null
          status?: string | null
          target_audience?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          college_id?: string
          communication_type?: string
          content?: string
          created_at?: string | null
          delivery_stats?: Json | null
          id?: string
          scheduled_at?: string | null
          sender_id?: string
          sent_at?: string | null
          status?: string | null
          target_audience?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communications_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_resources: {
        Row: {
          access_level: string | null
          category: string | null
          college_id: string
          content_type: string
          content_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          target_users: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          access_level?: string | null
          category?: string | null
          college_id: string
          content_type: string
          content_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          target_users?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          access_level?: string | null
          category?: string | null
          college_id?: string
          content_type?: string
          content_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          target_users?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_resources_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_resources_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          academic_year: string | null
          college_id: string
          course_code: string
          course_name: string
          created_at: string | null
          credits: number | null
          description: string | null
          id: string
          instructor_id: string | null
          is_active: boolean | null
          max_students: number | null
          semester: string | null
          updated_at: string | null
        }
        Insert: {
          academic_year?: string | null
          college_id: string
          course_code: string
          course_name: string
          created_at?: string | null
          credits?: number | null
          description?: string | null
          id?: string
          instructor_id?: string | null
          is_active?: boolean | null
          max_students?: number | null
          semester?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_year?: string | null
          college_id?: string
          course_code?: string
          course_name?: string
          created_at?: string | null
          credits?: number | null
          description?: string | null
          id?: string
          instructor_id?: string | null
          is_active?: boolean | null
          max_students?: number | null
          semester?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          course_id: string
          created_at: string | null
          enrollment_date: string | null
          grade: string | null
          id: string
          status: string | null
          student_id: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          enrollment_date?: string | null
          grade?: string | null
          id?: string
          status?: string | null
          student_id: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          enrollment_date?: string | null
          grade?: string | null
          id?: string
          status?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          college_id: string
          created_at: string | null
          description: string | null
          end_date: string
          event_name: string
          event_type: string | null
          id: string
          is_active: boolean | null
          location: string | null
          max_participants: number | null
          organizer_id: string | null
          registration_required: boolean | null
          start_date: string
          updated_at: string | null
        }
        Insert: {
          college_id: string
          created_at?: string | null
          description?: string | null
          end_date: string
          event_name: string
          event_type?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          max_participants?: number | null
          organizer_id?: string | null
          registration_required?: boolean | null
          start_date: string
          updated_at?: string | null
        }
        Update: {
          college_id?: string
          created_at?: string | null
          description?: string | null
          end_date?: string
          event_name?: string
          event_type?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          max_participants?: number | null
          organizer_id?: string | null
          registration_required?: boolean | null
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      facilities: {
        Row: {
          amenities: Json | null
          capacity: number | null
          college_id: string
          created_at: string | null
          facility_name: string
          facility_type: string
          id: string
          is_available: boolean | null
          location: string | null
          maintenance_schedule: Json | null
          updated_at: string | null
        }
        Insert: {
          amenities?: Json | null
          capacity?: number | null
          college_id: string
          created_at?: string | null
          facility_name: string
          facility_type: string
          id?: string
          is_available?: boolean | null
          location?: string | null
          maintenance_schedule?: Json | null
          updated_at?: string | null
        }
        Update: {
          amenities?: Json | null
          capacity?: number | null
          college_id?: string
          created_at?: string | null
          facility_name?: string
          facility_type?: string
          id?: string
          is_available?: boolean | null
          location?: string | null
          maintenance_schedule?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facilities_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_payments: {
        Row: {
          amount_paid: number
          college_id: string
          created_at: string | null
          fee_structure_id: string
          id: string
          payment_date: string | null
          payment_method: string | null
          status: string | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount_paid: number
          college_id: string
          created_at?: string | null
          fee_structure_id: string
          id?: string
          payment_date?: string | null
          payment_method?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number
          college_id?: string
          created_at?: string | null
          fee_structure_id?: string
          id?: string
          payment_date?: string | null
          payment_method?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_payments_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payments_fee_structure_id_fkey"
            columns: ["fee_structure_id"]
            isOneToOne: false
            referencedRelation: "fee_structures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structures: {
        Row: {
          academic_year: string
          amount: number
          college_id: string
          created_at: string | null
          fee_type: string
          id: string
          is_active: boolean | null
          semester: string | null
          updated_at: string | null
          user_type: string | null
        }
        Insert: {
          academic_year: string
          amount: number
          college_id: string
          created_at?: string | null
          fee_type: string
          id?: string
          is_active?: boolean | null
          semester?: string | null
          updated_at?: string | null
          user_type?: string | null
        }
        Update: {
          academic_year?: string
          amount?: number
          college_id?: string
          created_at?: string | null
          fee_type?: string
          id?: string
          is_active?: boolean | null
          semester?: string | null
          updated_at?: string | null
          user_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_structures_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      security_settings: {
        Row: {
          backup_codes: string[] | null
          college_id: string
          created_at: string | null
          id: string
          last_login_at: string | null
          locked_until: string | null
          login_attempts: number | null
          password_expires_at: string | null
          two_factor_enabled: boolean | null
          two_factor_secret: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          college_id: string
          created_at?: string | null
          id?: string
          last_login_at?: string | null
          locked_until?: string | null
          login_attempts?: number | null
          password_expires_at?: string | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          college_id?: string
          created_at?: string | null
          id?: string
          last_login_at?: string | null
          locked_until?: string | null
          login_attempts?: number | null
          password_expires_at?: string | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_settings_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          college_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          setting_category: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          college_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          setting_category: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          college_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          setting_category?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_onboarding: {
        Row: {
          college_id: string
          created_at: string | null
          first_login_completed: boolean | null
          id: string
          onboarding_completed: boolean | null
          password_reset_required: boolean | null
          temp_password: string
          updated_at: string | null
          user_id: string
          welcome_email_delivered: boolean | null
          welcome_email_failed: boolean | null
          welcome_email_opened: boolean | null
          welcome_email_sent: boolean | null
        }
        Insert: {
          college_id: string
          created_at?: string | null
          first_login_completed?: boolean | null
          id?: string
          onboarding_completed?: boolean | null
          password_reset_required?: boolean | null
          temp_password: string
          updated_at?: string | null
          user_id: string
          welcome_email_delivered?: boolean | null
          welcome_email_failed?: boolean | null
          welcome_email_opened?: boolean | null
          welcome_email_sent?: boolean | null
        }
        Update: {
          college_id?: string
          created_at?: string | null
          first_login_completed?: boolean | null
          id?: string
          onboarding_completed?: boolean | null
          password_reset_required?: boolean | null
          temp_password?: string
          updated_at?: string | null
          user_id?: string
          welcome_email_delivered?: boolean | null
          welcome_email_failed?: boolean | null
          welcome_email_opened?: boolean | null
          welcome_email_sent?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "user_onboarding_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_onboarding_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          college_id: string
          created_at: string | null
          email: string | null
          first_name: string | null
          hierarchy_level:
            | Database["public"]["Enums"]["user_hierarchy_level"]
            | null
          id: string
          is_active: boolean | null
          last_name: string | null
          password: string | null
          updated_at: string | null
          user_code: string
          user_type: Database["public"]["Enums"]["user_type_enum"]
        }
        Insert: {
          college_id: string
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          hierarchy_level?:
            | Database["public"]["Enums"]["user_hierarchy_level"]
            | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          password?: string | null
          updated_at?: string | null
          user_code: string
          user_type: Database["public"]["Enums"]["user_type_enum"]
        }
        Update: {
          college_id?: string
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          hierarchy_level?:
            | Database["public"]["Enums"]["user_hierarchy_level"]
            | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          password?: string | null
          updated_at?: string | null
          user_code?: string
          user_type?: Database["public"]["Enums"]["user_type_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_temp_password: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_user_code: {
        Args: { college_code: string; user_type_param: string }
        Returns: string
      }
      get_college_by_code: {
        Args: { college_code: string }
        Returns: {
          id: string
          code: string
          name: string
          logo: string
          primary_color: string
          secondary_color: string
        }[]
      }
      get_user_admin_roles: {
        Args: { user_uuid: string; college_uuid: string }
        Returns: {
          role_type: Database["public"]["Enums"]["admin_role_type"]
          permissions: Json
          assigned_at: string
        }[]
      }
      has_admin_permission: {
        Args: {
          user_uuid: string
          college_uuid: string
          required_role: Database["public"]["Enums"]["admin_role_type"]
        }
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          college_uuid: string
          admin_uuid: string
          target_uuid: string
          action_type_param: string
          action_desc: string
          module_param: string
          old_vals?: Json
          new_vals?: Json
        }
        Returns: string
      }
      validate_college_user: {
        Args: { college_code: string; user_code: string }
        Returns: {
          college_id: string
          college_name: string
          college_logo: string
          primary_color: string
          secondary_color: string
          user_exists: boolean
        }[]
      }
      validate_user_login: {
        Args: { college_code: string; user_code: string; user_password: string }
        Returns: {
          login_success: boolean
          user_id: string
          user_type: string
          first_name: string
          last_name: string
          error_message: string
        }[]
      }
    }
    Enums: {
      admin_role_type:
        | "super_admin"
        | "course_management_admin"
        | "estate_logistics_admin"
        | "event_admin"
        | "finance_admin"
        | "it_admin"
      user_hierarchy_level:
        | "super_admin"
        | "admin"
        | "faculty"
        | "student"
        | "parent"
        | "alumni"
      user_type: "student" | "faculty" | "admin" | "parent" | "alumni"
      user_type_enum:
        | "student"
        | "faculty"
        | "admin"
        | "staff"
        | "parent"
        | "alumni"
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
      admin_role_type: [
        "super_admin",
        "course_management_admin",
        "estate_logistics_admin",
        "event_admin",
        "finance_admin",
        "it_admin",
      ],
      user_hierarchy_level: [
        "super_admin",
        "admin",
        "faculty",
        "student",
        "parent",
        "alumni",
      ],
      user_type: ["student", "faculty", "admin", "parent", "alumni"],
      user_type_enum: [
        "student",
        "faculty",
        "admin",
        "staff",
        "parent",
        "alumni",
      ],
    },
  },
} as const
