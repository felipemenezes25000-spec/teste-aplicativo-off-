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
      chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean | null
          request_id: string
          request_type: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean | null
          request_id: string
          request_type: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          request_id?: string
          request_type?: string
          sender_id?: string
        }
        Relationships: []
      }
      consultation_requests: {
        Row: {
          created_at: string
          doctor_id: string | null
          doctor_notes: string | null
          duration_minutes: number
          ended_at: string | null
          id: string
          patient_id: string
          patient_notes: string | null
          price_per_minute: number
          scheduled_at: string | null
          specialty: string
          started_at: string | null
          status: Database["public"]["Enums"]["request_status"]
          total_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctor_id?: string | null
          doctor_notes?: string | null
          duration_minutes: number
          ended_at?: string | null
          id?: string
          patient_id: string
          patient_notes?: string | null
          price_per_minute: number
          scheduled_at?: string | null
          specialty: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          total_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string | null
          doctor_notes?: string | null
          duration_minutes?: number
          ended_at?: string | null
          id?: string
          patient_id?: string
          patient_notes?: string | null
          price_per_minute?: number
          scheduled_at?: string | null
          specialty?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          total_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      doctor_profiles: {
        Row: {
          available: boolean | null
          bio: string | null
          created_at: string
          crm: string
          crm_state: string
          id: string
          rating: number | null
          specialty: string
          total_consultations: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          available?: boolean | null
          bio?: string | null
          created_at?: string
          crm: string
          crm_state: string
          id?: string
          rating?: number | null
          specialty: string
          total_consultations?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          available?: boolean | null
          bio?: string | null
          created_at?: string
          crm?: string
          crm_state?: string
          id?: string
          rating?: number | null
          specialty?: string
          total_consultations?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exam_requests: {
        Row: {
          created_at: string
          doctor_id: string | null
          doctor_notes: string | null
          exam_type: Database["public"]["Enums"]["exam_type"]
          exams: Json | null
          id: string
          image_url: string | null
          patient_id: string
          patient_notes: string | null
          pdf_url: string | null
          price: number
          rejection_reason: string | null
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
          validated_at: string | null
        }
        Insert: {
          created_at?: string
          doctor_id?: string | null
          doctor_notes?: string | null
          exam_type: Database["public"]["Enums"]["exam_type"]
          exams?: Json | null
          id?: string
          image_url?: string | null
          patient_id: string
          patient_notes?: string | null
          pdf_url?: string | null
          price: number
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          validated_at?: string | null
        }
        Update: {
          created_at?: string
          doctor_id?: string | null
          doctor_notes?: string | null
          exam_type?: Database["public"]["Enums"]["exam_type"]
          exams?: Json | null
          id?: string
          image_url?: string | null
          patient_id?: string
          patient_notes?: string | null
          pdf_url?: string | null
          price?: number
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          validated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          checkout_url: string | null
          created_at: string
          expires_at: string | null
          external_id: string | null
          id: string
          mercadopago_payment_id: string | null
          mercadopago_preference_id: string | null
          method: Database["public"]["Enums"]["payment_method"] | null
          paid_at: string | null
          pix_code: string | null
          qr_code: string | null
          qr_code_base64: string | null
          request_id: string
          request_type: string
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          checkout_url?: string | null
          created_at?: string
          expires_at?: string | null
          external_id?: string | null
          id?: string
          mercadopago_payment_id?: string | null
          mercadopago_preference_id?: string | null
          method?: Database["public"]["Enums"]["payment_method"] | null
          paid_at?: string | null
          pix_code?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          request_id: string
          request_type: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          checkout_url?: string | null
          created_at?: string
          expires_at?: string | null
          external_id?: string | null
          id?: string
          mercadopago_payment_id?: string | null
          mercadopago_preference_id?: string | null
          method?: Database["public"]["Enums"]["payment_method"] | null
          paid_at?: string | null
          pix_code?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          request_id?: string
          request_type?: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      prescription_requests: {
        Row: {
          created_at: string
          doctor_id: string | null
          doctor_notes: string | null
          id: string
          image_url: string | null
          medications: Json | null
          patient_id: string
          patient_notes: string | null
          pdf_url: string | null
          prescription_type: Database["public"]["Enums"]["prescription_type"]
          price: number
          rejection_reason: string | null
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
          validated_at: string | null
        }
        Insert: {
          created_at?: string
          doctor_id?: string | null
          doctor_notes?: string | null
          id?: string
          image_url?: string | null
          medications?: Json | null
          patient_id: string
          patient_notes?: string | null
          pdf_url?: string | null
          prescription_type: Database["public"]["Enums"]["prescription_type"]
          price: number
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          validated_at?: string | null
        }
        Update: {
          created_at?: string
          doctor_id?: string | null
          doctor_notes?: string | null
          id?: string
          image_url?: string | null
          medications?: Json | null
          patient_id?: string
          patient_notes?: string | null
          pdf_url?: string | null
          prescription_type?: Database["public"]["Enums"]["prescription_type"]
          price?: number
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          validated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: Json | null
          avatar_url: string | null
          birth_date: string | null
          cpf: string | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: Json | null
          avatar_url?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: Json | null
          avatar_url?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      app_role: "patient" | "doctor" | "admin"
      exam_type: "laboratory" | "imaging"
      payment_method: "pix" | "credit_card" | "debit_card"
      payment_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "refunded"
      prescription_type: "simple" | "controlled" | "blue"
      request_status:
        | "pending"
        | "analyzing"
        | "approved"
        | "rejected"
        | "correction_needed"
        | "completed"
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
      app_role: ["patient", "doctor", "admin"],
      exam_type: ["laboratory", "imaging"],
      payment_method: ["pix", "credit_card", "debit_card"],
      payment_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "refunded",
      ],
      prescription_type: ["simple", "controlled", "blue"],
      request_status: [
        "pending",
        "analyzing",
        "approved",
        "rejected",
        "correction_needed",
        "completed",
      ],
    },
  },
} as const
