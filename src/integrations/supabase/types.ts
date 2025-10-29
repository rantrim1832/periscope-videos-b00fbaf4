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
      properties: {
        Row: {
          address: string
          amenities: string[] | null
          baths: number | null
          beds: number | null
          city: string
          created_at: string
          created_by_user_id: string | null
          id: string
          is_verified: boolean | null
          latitude: number | null
          longitude: number | null
          management_company: string | null
          name: string
          rent: number | null
          rentcast_data: Json | null
          state: string
          status: string | null
          updated_at: string
          verification_required: boolean | null
        }
        Insert: {
          address: string
          amenities?: string[] | null
          baths?: number | null
          beds?: number | null
          city: string
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          is_verified?: boolean | null
          latitude?: number | null
          longitude?: number | null
          management_company?: string | null
          name: string
          rent?: number | null
          rentcast_data?: Json | null
          state: string
          status?: string | null
          updated_at?: string
          verification_required?: boolean | null
        }
        Update: {
          address?: string
          amenities?: string[] | null
          baths?: number | null
          beds?: number | null
          city?: string
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          is_verified?: boolean | null
          latitude?: number | null
          longitude?: number | null
          management_company?: string | null
          name?: string
          rent?: number | null
          rentcast_data?: Json | null
          state?: string
          status?: string | null
          updated_at?: string
          verification_required?: boolean | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          ai_flags: Json | null
          caption: string | null
          city: string | null
          created_at: string
          embed_code: string | null
          id: string
          is_positive: boolean | null
          likes: number | null
          moderation_score: number | null
          moderation_status: string | null
          property_id: string | null
          rating: number | null
          source: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string | null
          video_url: string | null
          views: number | null
        }
        Insert: {
          ai_flags?: Json | null
          caption?: string | null
          city?: string | null
          created_at?: string
          embed_code?: string | null
          id?: string
          is_positive?: boolean | null
          likes?: number | null
          moderation_score?: number | null
          moderation_status?: string | null
          property_id?: string | null
          rating?: number | null
          source?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id?: string | null
          video_url?: string | null
          views?: number | null
        }
        Update: {
          ai_flags?: Json | null
          caption?: string | null
          city?: string | null
          created_at?: string
          embed_code?: string | null
          id?: string
          is_positive?: boolean | null
          likes?: number | null
          moderation_score?: number | null
          moderation_status?: string | null
          property_id?: string | null
          rating?: number | null
          source?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string | null
          video_url?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      seeded_videos: {
        Row: {
          caption: string | null
          city: string | null
          created_at: string
          embed_url: string
          hashtags: string[] | null
          id: string
          is_positive: boolean | null
          moderation_status: string
          source: string
          title: string
          updated_at: string
        }
        Insert: {
          caption?: string | null
          city?: string | null
          created_at?: string
          embed_url: string
          hashtags?: string[] | null
          id?: string
          is_positive?: boolean | null
          moderation_status?: string
          source?: string
          title: string
          updated_at?: string
        }
        Update: {
          caption?: string | null
          city?: string | null
          created_at?: string
          embed_url?: string
          hashtags?: string[] | null
          id?: string
          is_positive?: boolean | null
          moderation_status?: string
          source?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      shorts: {
        Row: {
          ai_flags: Json | null
          city: string | null
          created_at: string
          embed_url: string
          id: string
          likes: number | null
          moderation_score: number | null
          moderation_status: string | null
          review_id: string | null
          source: string | null
          tags: string[] | null
          title: string
          updated_at: string
          views: number | null
        }
        Insert: {
          ai_flags?: Json | null
          city?: string | null
          created_at?: string
          embed_url: string
          id?: string
          likes?: number | null
          moderation_score?: number | null
          moderation_status?: string | null
          review_id?: string | null
          source?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          views?: number | null
        }
        Update: {
          ai_flags?: Json | null
          city?: string | null
          created_at?: string
          embed_url?: string
          id?: string
          likes?: number | null
          moderation_score?: number | null
          moderation_status?: string | null
          review_id?: string | null
          source?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shorts_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      user_limits: {
        Row: {
          created_at: string
          email: string
          id: string
          ip_address: string | null
          last_verification_at: string | null
          reviews_count: number
          updated_at: string
          user_id: string | null
          verifications_count: number
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip_address?: string | null
          last_verification_at?: string | null
          reviews_count?: number
          updated_at?: string
          user_id?: string | null
          verifications_count?: number
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          last_verification_at?: string | null
          reviews_count?: number
          updated_at?: string
          user_id?: string | null
          verifications_count?: number
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
      user_verifications: {
        Row: {
          created_at: string
          document_url: string | null
          extracted_address: string | null
          id: string
          property_id: string | null
          rejected_reason: string | null
          status: string
          user_id: string | null
          verification_type: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          document_url?: string | null
          extracted_address?: string | null
          id?: string
          property_id?: string | null
          rejected_reason?: string | null
          status?: string
          user_id?: string | null
          verification_type: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          document_url?: string | null
          extracted_address?: string | null
          id?: string
          property_id?: string | null
          rejected_reason?: string | null
          status?: string
          user_id?: string | null
          verification_type?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_verifications_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
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
    },
  },
} as const
