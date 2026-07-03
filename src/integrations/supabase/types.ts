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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      canonical_property: {
        Row: {
          address_line1: string | null
          city: string | null
          confidence_score: number
          created_at: string
          geo_confidence: number | null
          geocode_status: Database["public"]["Enums"]["geocode_status"]
          id: string
          latitude: number | null
          longitude: number | null
          merged_into: string | null
          name: string | null
          normalized_address: string
          phone_e164: string | null
          property_class: Database["public"]["Enums"]["property_class"]
          state: string | null
          status: Database["public"]["Enums"]["property_status"]
          units_count: number | null
          updated_at: string
          year_built: number | null
          zip5: string | null
        }
        Insert: {
          address_line1?: string | null
          city?: string | null
          confidence_score?: number
          created_at?: string
          geo_confidence?: number | null
          geocode_status?: Database["public"]["Enums"]["geocode_status"]
          id?: string
          latitude?: number | null
          longitude?: number | null
          merged_into?: string | null
          name?: string | null
          normalized_address: string
          phone_e164?: string | null
          property_class?: Database["public"]["Enums"]["property_class"]
          state?: string | null
          status?: Database["public"]["Enums"]["property_status"]
          units_count?: number | null
          updated_at?: string
          year_built?: number | null
          zip5?: string | null
        }
        Update: {
          address_line1?: string | null
          city?: string | null
          confidence_score?: number
          created_at?: string
          geo_confidence?: number | null
          geocode_status?: Database["public"]["Enums"]["geocode_status"]
          id?: string
          latitude?: number | null
          longitude?: number | null
          merged_into?: string | null
          name?: string | null
          normalized_address?: string
          phone_e164?: string | null
          property_class?: Database["public"]["Enums"]["property_class"]
          state?: string | null
          status?: Database["public"]["Enums"]["property_status"]
          units_count?: number | null
          updated_at?: string
          year_built?: number | null
          zip5?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "canonical_property_merged_into_fkey"
            columns: ["merged_into"]
            isOneToOne: false
            referencedRelation: "canonical_property"
            referencedColumns: ["id"]
          },
        ]
      }
      canonical_review: {
        Row: {
          ai_flags: Json
          author_pseudonym: string | null
          body: string | null
          canonical_property_id: string
          content_type: string
          created_at: string
          embed_platform: string | null
          embed_url: string | null
          has_video: boolean
          id: string
          life_stage: Database["public"]["Enums"]["review_life_stage"]
          media_asset_id: string | null
          moderation_score: number
          moderation_status: Database["public"]["Enums"]["review_moderation_status"]
          ratings: Json
          resident_id: string | null
          source: string
          title: string
          trust_tier: Database["public"]["Enums"]["resident_trust_tier"]
          updated_at: string
          views: number
          would_lease_again: boolean | null
        }
        Insert: {
          ai_flags?: Json
          author_pseudonym?: string | null
          body?: string | null
          canonical_property_id: string
          content_type?: string
          created_at?: string
          embed_platform?: string | null
          embed_url?: string | null
          has_video?: boolean
          id?: string
          life_stage?: Database["public"]["Enums"]["review_life_stage"]
          media_asset_id?: string | null
          moderation_score?: number
          moderation_status?: Database["public"]["Enums"]["review_moderation_status"]
          ratings?: Json
          resident_id?: string | null
          source?: string
          title: string
          trust_tier?: Database["public"]["Enums"]["resident_trust_tier"]
          updated_at?: string
          views?: number
          would_lease_again?: boolean | null
        }
        Update: {
          ai_flags?: Json
          author_pseudonym?: string | null
          body?: string | null
          canonical_property_id?: string
          content_type?: string
          created_at?: string
          embed_platform?: string | null
          embed_url?: string | null
          has_video?: boolean
          id?: string
          life_stage?: Database["public"]["Enums"]["review_life_stage"]
          media_asset_id?: string | null
          moderation_score?: number
          moderation_status?: Database["public"]["Enums"]["review_moderation_status"]
          ratings?: Json
          resident_id?: string | null
          source?: string
          title?: string
          trust_tier?: Database["public"]["Enums"]["resident_trust_tier"]
          updated_at?: string
          views?: number
          would_lease_again?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "canonical_review_canonical_property_id_fkey"
            columns: ["canonical_property_id"]
            isOneToOne: false
            referencedRelation: "canonical_property"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canonical_review_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "resident_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_audit: {
        Row: {
          action: string
          actor: string | null
          claim_id: string
          created_at: string
          detail: Json | null
          id: string
        }
        Insert: {
          action: string
          actor?: string | null
          claim_id: string
          created_at?: string
          detail?: Json | null
          id?: string
        }
        Update: {
          action?: string
          actor?: string | null
          claim_id?: string
          created_at?: string
          detail?: Json | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "claim_audit_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "property_claim"
            referencedColumns: ["id"]
          },
        ]
      }
      connected_source: {
        Row: {
          access_ref: string | null
          auto_sync: boolean
          canonical_property_id: string
          connected_by_user_id: string | null
          created_at: string
          handle: string
          id: string
          kind: string
          last_synced_at: string | null
          status: string
        }
        Insert: {
          access_ref?: string | null
          auto_sync?: boolean
          canonical_property_id: string
          connected_by_user_id?: string | null
          created_at?: string
          handle: string
          id?: string
          kind: string
          last_synced_at?: string | null
          status?: string
        }
        Update: {
          access_ref?: string | null
          auto_sync?: boolean
          canonical_property_id?: string
          connected_by_user_id?: string | null
          created_at?: string
          handle?: string
          id?: string
          kind?: string
          last_synced_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "connected_source_canonical_property_id_fkey"
            columns: ["canonical_property_id"]
            isOneToOne: false
            referencedRelation: "canonical_property"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_follow: {
        Row: {
          created_at: string
          creator_id: string
          follower_user_id: string
          id: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          follower_user_id: string
          id?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          follower_user_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_follow_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "resident_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      data_source: {
        Row: {
          created_at: string
          id: string
          key: string
          name: string
          trust_tier: number
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          name: string
          trust_tier?: number
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          name?: string
          trust_tier?: number
        }
        Relationships: []
      }
      imported_properties: {
        Row: {
          address: string | null
          avg_eff_price_per_sqft: number | null
          avg_eff_rent: number | null
          avg_price_per_sqft: number | null
          avg_rent: number | null
          avg_sqft: number | null
          baths: string | null
          beds: string | null
          built_type: string | null
          city: string | null
          classification: string | null
          concessions: string | null
          county: string | null
          created_at: string
          former_name: string | null
          housing_type: string | null
          id: string
          imported_by_user_id: string | null
          management_company: string | null
          market: string | null
          min_lease_term: number | null
          name: string
          neighborhood: string | null
          occupancy_percent: number | null
          onsite_manager: string | null
          phone: string | null
          software_system: string | null
          source: string | null
          state: string | null
          stories: number | null
          submarket: string | null
          total_rentable_sqft: number | null
          units: number | null
          updated_at: string
          url: string | null
          year_built: number | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          avg_eff_price_per_sqft?: number | null
          avg_eff_rent?: number | null
          avg_price_per_sqft?: number | null
          avg_rent?: number | null
          avg_sqft?: number | null
          baths?: string | null
          beds?: string | null
          built_type?: string | null
          city?: string | null
          classification?: string | null
          concessions?: string | null
          county?: string | null
          created_at?: string
          former_name?: string | null
          housing_type?: string | null
          id?: string
          imported_by_user_id?: string | null
          management_company?: string | null
          market?: string | null
          min_lease_term?: number | null
          name: string
          neighborhood?: string | null
          occupancy_percent?: number | null
          onsite_manager?: string | null
          phone?: string | null
          software_system?: string | null
          source?: string | null
          state?: string | null
          stories?: number | null
          submarket?: string | null
          total_rentable_sqft?: number | null
          units?: number | null
          updated_at?: string
          url?: string | null
          year_built?: number | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          avg_eff_price_per_sqft?: number | null
          avg_eff_rent?: number | null
          avg_price_per_sqft?: number | null
          avg_rent?: number | null
          avg_sqft?: number | null
          baths?: string | null
          beds?: string | null
          built_type?: string | null
          city?: string | null
          classification?: string | null
          concessions?: string | null
          county?: string | null
          created_at?: string
          former_name?: string | null
          housing_type?: string | null
          id?: string
          imported_by_user_id?: string | null
          management_company?: string | null
          market?: string | null
          min_lease_term?: number | null
          name?: string
          neighborhood?: string | null
          occupancy_percent?: number | null
          onsite_manager?: string | null
          phone?: string | null
          software_system?: string | null
          source?: string | null
          state?: string | null
          stories?: number | null
          submarket?: string | null
          total_rentable_sqft?: number | null
          units?: number | null
          updated_at?: string
          url?: string | null
          year_built?: number | null
          zip_code?: string | null
        }
        Relationships: []
      }
      notification: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          property_id: string | null
          review_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          property_id?: string | null
          review_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          property_id?: string | null
          review_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "canonical_review"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          address_line1: string | null
          address_line2: string | null
          amenities: string[] | null
          assessor_id: string | null
          baths: number | null
          beds: number | null
          city: string
          county: string | null
          county_fips: string | null
          created_at: string
          created_by_user_id: string | null
          features: Json | null
          history: Json | null
          hoa_fee: number | null
          id: string
          is_verified: boolean | null
          last_sale_date: string | null
          last_sale_price: number | null
          latitude: number | null
          legal_description: string | null
          longitude: number | null
          lot_size: number | null
          management_company: string | null
          name: string
          owner: Json | null
          property_taxes: Json | null
          property_type: string | null
          rent: number | null
          rentcast_data: Json | null
          rentcast_id: string | null
          square_footage: number | null
          state: string
          state_fips: string | null
          status: string | null
          subdivision: string | null
          tax_assessments: Json | null
          units_count: number | null
          updated_at: string
          verification_required: boolean | null
          year_built: number | null
          zip_code: string | null
          zoning: string | null
        }
        Insert: {
          address: string
          address_line1?: string | null
          address_line2?: string | null
          amenities?: string[] | null
          assessor_id?: string | null
          baths?: number | null
          beds?: number | null
          city: string
          county?: string | null
          county_fips?: string | null
          created_at?: string
          created_by_user_id?: string | null
          features?: Json | null
          history?: Json | null
          hoa_fee?: number | null
          id?: string
          is_verified?: boolean | null
          last_sale_date?: string | null
          last_sale_price?: number | null
          latitude?: number | null
          legal_description?: string | null
          longitude?: number | null
          lot_size?: number | null
          management_company?: string | null
          name: string
          owner?: Json | null
          property_taxes?: Json | null
          property_type?: string | null
          rent?: number | null
          rentcast_data?: Json | null
          rentcast_id?: string | null
          square_footage?: number | null
          state: string
          state_fips?: string | null
          status?: string | null
          subdivision?: string | null
          tax_assessments?: Json | null
          units_count?: number | null
          updated_at?: string
          verification_required?: boolean | null
          year_built?: number | null
          zip_code?: string | null
          zoning?: string | null
        }
        Update: {
          address?: string
          address_line1?: string | null
          address_line2?: string | null
          amenities?: string[] | null
          assessor_id?: string | null
          baths?: number | null
          beds?: number | null
          city?: string
          county?: string | null
          county_fips?: string | null
          created_at?: string
          created_by_user_id?: string | null
          features?: Json | null
          history?: Json | null
          hoa_fee?: number | null
          id?: string
          is_verified?: boolean | null
          last_sale_date?: string | null
          last_sale_price?: number | null
          latitude?: number | null
          legal_description?: string | null
          longitude?: number | null
          lot_size?: number | null
          management_company?: string | null
          name?: string
          owner?: Json | null
          property_taxes?: Json | null
          property_type?: string | null
          rent?: number | null
          rentcast_data?: Json | null
          rentcast_id?: string | null
          square_footage?: number | null
          state?: string
          state_fips?: string | null
          status?: string | null
          subdivision?: string | null
          tax_assessments?: Json | null
          units_count?: number | null
          updated_at?: string
          verification_required?: boolean | null
          year_built?: number | null
          zip_code?: string | null
          zoning?: string | null
        }
        Relationships: []
      }
      property_alias: {
        Row: {
          alias_address: string | null
          alias_name: string | null
          canonical_property_id: string
          created_at: string
          id: string
          source: string | null
        }
        Insert: {
          alias_address?: string | null
          alias_name?: string | null
          canonical_property_id: string
          created_at?: string
          id?: string
          source?: string | null
        }
        Update: {
          alias_address?: string | null
          alias_name?: string | null
          canonical_property_id?: string
          created_at?: string
          id?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_alias_canonical_property_id_fkey"
            columns: ["canonical_property_id"]
            isOneToOne: false
            referencedRelation: "canonical_property"
            referencedColumns: ["id"]
          },
        ]
      }
      property_answer: {
        Row: {
          body: string
          created_at: string
          id: string
          question_id: string
          responder_user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          question_id: string
          responder_user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          question_id?: string
          responder_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_answer_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "property_question"
            referencedColumns: ["id"]
          },
        ]
      }
      property_channel: {
        Row: {
          canonical_property_id: string
          created_at: string
          embed_url: string | null
          id: string
          is_verified: boolean
          kind: string
          label: string | null
          source: string
          url: string
        }
        Insert: {
          canonical_property_id: string
          created_at?: string
          embed_url?: string | null
          id?: string
          is_verified?: boolean
          kind: string
          label?: string | null
          source?: string
          url: string
        }
        Update: {
          canonical_property_id?: string
          created_at?: string
          embed_url?: string | null
          id?: string
          is_verified?: boolean
          kind?: string
          label?: string | null
          source?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_channel_canonical_property_id_fkey"
            columns: ["canonical_property_id"]
            isOneToOne: false
            referencedRelation: "canonical_property"
            referencedColumns: ["id"]
          },
        ]
      }
      property_claim: {
        Row: {
          canonical_property_id: string
          claimant_user_id: string
          company_name: string | null
          contact_email: string | null
          created_at: string
          evidence_url: string | null
          id: string
          rejected_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          role: Database["public"]["Enums"]["claim_role"]
          status: Database["public"]["Enums"]["claim_status"]
          verification_method: string
        }
        Insert: {
          canonical_property_id: string
          claimant_user_id: string
          company_name?: string | null
          contact_email?: string | null
          created_at?: string
          evidence_url?: string | null
          id?: string
          rejected_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role?: Database["public"]["Enums"]["claim_role"]
          status?: Database["public"]["Enums"]["claim_status"]
          verification_method?: string
        }
        Update: {
          canonical_property_id?: string
          claimant_user_id?: string
          company_name?: string | null
          contact_email?: string | null
          created_at?: string
          evidence_url?: string | null
          id?: string
          rejected_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role?: Database["public"]["Enums"]["claim_role"]
          status?: Database["public"]["Enums"]["claim_status"]
          verification_method?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_claim_canonical_property_id_fkey"
            columns: ["canonical_property_id"]
            isOneToOne: false
            referencedRelation: "canonical_property"
            referencedColumns: ["id"]
          },
        ]
      }
      property_event: {
        Row: {
          canonical_property_id: string
          created_at: string
          delta: number | null
          event_date: string
          id: string
          kind: string
          label: string
        }
        Insert: {
          canonical_property_id: string
          created_at?: string
          delta?: number | null
          event_date?: string
          id?: string
          kind: string
          label: string
        }
        Update: {
          canonical_property_id?: string
          created_at?: string
          delta?: number | null
          event_date?: string
          id?: string
          kind?: string
          label?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_event_canonical_property_id_fkey"
            columns: ["canonical_property_id"]
            isOneToOne: false
            referencedRelation: "canonical_property"
            referencedColumns: ["id"]
          },
        ]
      }
      property_fact: {
        Row: {
          attribute: string
          canonical_property_id: string
          confidence: number
          created_at: string
          id: string
          is_public: boolean
          observed_at: string
          source_key: string
          value: Json | null
        }
        Insert: {
          attribute: string
          canonical_property_id: string
          confidence?: number
          created_at?: string
          id?: string
          is_public?: boolean
          observed_at?: string
          source_key: string
          value?: Json | null
        }
        Update: {
          attribute?: string
          canonical_property_id?: string
          confidence?: number
          created_at?: string
          id?: string
          is_public?: boolean
          observed_at?: string
          source_key?: string
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "property_fact_canonical_property_id_fkey"
            columns: ["canonical_property_id"]
            isOneToOne: false
            referencedRelation: "canonical_property"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_fact_source_key_fkey"
            columns: ["source_key"]
            isOneToOne: false
            referencedRelation: "data_source"
            referencedColumns: ["key"]
          },
        ]
      }
      property_manager: {
        Row: {
          canonical_property_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["claim_role"]
          user_id: string
        }
        Insert: {
          canonical_property_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["claim_role"]
          user_id: string
        }
        Update: {
          canonical_property_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["claim_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_manager_canonical_property_id_fkey"
            columns: ["canonical_property_id"]
            isOneToOne: false
            referencedRelation: "canonical_property"
            referencedColumns: ["id"]
          },
        ]
      }
      property_question: {
        Row: {
          asker_user_id: string
          body: string
          canonical_property_id: string
          created_at: string
          id: string
        }
        Insert: {
          asker_user_id: string
          body: string
          canonical_property_id: string
          created_at?: string
          id?: string
        }
        Update: {
          asker_user_id?: string
          body?: string
          canonical_property_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_question_canonical_property_id_fkey"
            columns: ["canonical_property_id"]
            isOneToOne: false
            referencedRelation: "canonical_property"
            referencedColumns: ["id"]
          },
        ]
      }
      property_rating_aggregate: {
        Row: {
          canonical_property_id: string
          categories: Json
          confidence: string
          effective_weight: number
          review_count: number
          truth_score: number | null
          updated_at: string
          verified_resident_count: number
          video_count: number
        }
        Insert: {
          canonical_property_id: string
          categories?: Json
          confidence?: string
          effective_weight?: number
          review_count?: number
          truth_score?: number | null
          updated_at?: string
          verified_resident_count?: number
          video_count?: number
        }
        Update: {
          canonical_property_id?: string
          categories?: Json
          confidence?: string
          effective_weight?: number
          review_count?: number
          truth_score?: number | null
          updated_at?: string
          verified_resident_count?: number
          video_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "property_rating_aggregate_canonical_property_id_fkey"
            columns: ["canonical_property_id"]
            isOneToOne: true
            referencedRelation: "canonical_property"
            referencedColumns: ["id"]
          },
        ]
      }
      property_source_record: {
        Row: {
          canonical_property_id: string | null
          created_at: string
          geocode_status: Database["public"]["Enums"]["geocode_status"]
          id: string
          match_score: number | null
          match_status: Database["public"]["Enums"]["match_status"]
          normalized: Json | null
          notes: string | null
          raw: Json
          source_key: string
        }
        Insert: {
          canonical_property_id?: string | null
          created_at?: string
          geocode_status?: Database["public"]["Enums"]["geocode_status"]
          id?: string
          match_score?: number | null
          match_status?: Database["public"]["Enums"]["match_status"]
          normalized?: Json | null
          notes?: string | null
          raw: Json
          source_key: string
        }
        Update: {
          canonical_property_id?: string | null
          created_at?: string
          geocode_status?: Database["public"]["Enums"]["geocode_status"]
          id?: string
          match_score?: number | null
          match_status?: Database["public"]["Enums"]["match_status"]
          normalized?: Json | null
          notes?: string | null
          raw?: Json
          source_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_source_record_canonical_property_id_fkey"
            columns: ["canonical_property_id"]
            isOneToOne: false
            referencedRelation: "canonical_property"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_source_record_source_key_fkey"
            columns: ["source_key"]
            isOneToOne: false
            referencedRelation: "data_source"
            referencedColumns: ["key"]
          },
        ]
      }
      residency_claim: {
        Row: {
          canonical_property_id: string
          created_at: string
          id: string
          is_current: boolean
          resident_id: string
          tenure_end: string | null
          tenure_start: string | null
          updated_at: string
          verification_method: Database["public"]["Enums"]["verification_method"]
          verification_tier: Database["public"]["Enums"]["resident_trust_tier"]
          would_lease_again: boolean | null
        }
        Insert: {
          canonical_property_id: string
          created_at?: string
          id?: string
          is_current?: boolean
          resident_id: string
          tenure_end?: string | null
          tenure_start?: string | null
          updated_at?: string
          verification_method?: Database["public"]["Enums"]["verification_method"]
          verification_tier?: Database["public"]["Enums"]["resident_trust_tier"]
          would_lease_again?: boolean | null
        }
        Update: {
          canonical_property_id?: string
          created_at?: string
          id?: string
          is_current?: boolean
          resident_id?: string
          tenure_end?: string | null
          tenure_start?: string | null
          updated_at?: string
          verification_method?: Database["public"]["Enums"]["verification_method"]
          verification_tier?: Database["public"]["Enums"]["resident_trust_tier"]
          would_lease_again?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "residency_claim_canonical_property_id_fkey"
            columns: ["canonical_property_id"]
            isOneToOne: false
            referencedRelation: "canonical_property"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "residency_claim_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "resident_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      residency_verification: {
        Row: {
          canonical_property_id: string
          created_at: string
          evidence_ref: string | null
          id: string
          method: Database["public"]["Enums"]["verification_method"]
          resident_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target_tier: Database["public"]["Enums"]["resident_trust_tier"]
        }
        Insert: {
          canonical_property_id: string
          created_at?: string
          evidence_ref?: string | null
          id?: string
          method: Database["public"]["Enums"]["verification_method"]
          resident_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_tier: Database["public"]["Enums"]["resident_trust_tier"]
        }
        Update: {
          canonical_property_id?: string
          created_at?: string
          evidence_ref?: string | null
          id?: string
          method?: Database["public"]["Enums"]["verification_method"]
          resident_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_tier?: Database["public"]["Enums"]["resident_trust_tier"]
        }
        Relationships: [
          {
            foreignKeyName: "residency_verification_canonical_property_id_fkey"
            columns: ["canonical_property_id"]
            isOneToOne: false
            referencedRelation: "canonical_property"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "residency_verification_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "resident_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      resident_badge: {
        Row: {
          badge_key: string
          earned_at: string
          id: string
          label: string
          resident_id: string
        }
        Insert: {
          badge_key: string
          earned_at?: string
          id?: string
          label: string
          resident_id: string
        }
        Update: {
          badge_key?: string
          earned_at?: string
          id?: string
          label?: string
          resident_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resident_badge_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "resident_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      resident_expertise: {
        Row: {
          created_at: string
          domain: string
          id: string
          resident_id: string
          scope: string | null
          score: number
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          resident_id: string
          scope?: string | null
          score?: number
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          resident_id?: string
          scope?: string | null
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "resident_expertise_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "resident_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      resident_profile: {
        Row: {
          avatar_url: string | null
          bio: string | null
          contributor_reputation: number
          created_at: string
          creator_type: string | null
          display_name: string | null
          id: string
          intent: string | null
          is_creator: boolean
          level: number
          points: number
          pseudonym: string | null
          trust_tier: Database["public"]["Enums"]["resident_trust_tier"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          contributor_reputation?: number
          created_at?: string
          creator_type?: string | null
          display_name?: string | null
          id: string
          intent?: string | null
          is_creator?: boolean
          level?: number
          points?: number
          pseudonym?: string | null
          trust_tier?: Database["public"]["Enums"]["resident_trust_tier"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          contributor_reputation?: number
          created_at?: string
          creator_type?: string | null
          display_name?: string | null
          id?: string
          intent?: string | null
          is_creator?: boolean
          level?: number
          points?: number
          pseudonym?: string | null
          trust_tier?: Database["public"]["Enums"]["resident_trust_tier"]
          updated_at?: string
        }
        Relationships: []
      }
      review_helpful: {
        Row: {
          created_at: string
          id: string
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_helpful_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "canonical_review"
            referencedColumns: ["id"]
          },
        ]
      }
      review_response: {
        Row: {
          body: string
          created_at: string
          id: string
          responder_user_id: string
          review_id: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          responder_user_id: string
          review_id: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          responder_user_id?: string
          review_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_response_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "canonical_review"
            referencedColumns: ["id"]
          },
        ]
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
      scrape_logs: {
        Row: {
          city: string | null
          completed_at: string | null
          created_at: string
          created_by_user_id: string | null
          duration_ms: number | null
          error_count: number
          errors: Json | null
          id: string
          inserted_count: number
          skipped_count: number
          started_at: string
          state: string
          status: string
          total_properties: number
        }
        Insert: {
          city?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          duration_ms?: number | null
          error_count?: number
          errors?: Json | null
          id?: string
          inserted_count?: number
          skipped_count?: number
          started_at?: string
          state: string
          status?: string
          total_properties?: number
        }
        Update: {
          city?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          duration_ms?: number | null
          error_count?: number
          errors?: Json | null
          id?: string
          inserted_count?: number
          skipped_count?: number
          started_at?: string
          state?: string
          status?: string
          total_properties?: number
        }
        Relationships: []
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
      synced_content: {
        Row: {
          canonical_property_id: string
          connected_source_id: string
          created_at: string
          embed_url: string | null
          external_id: string
          id: string
          kind: string
          permalink: string
          published_at: string | null
          status: string
          thumbnail_url: string | null
          title: string | null
        }
        Insert: {
          canonical_property_id: string
          connected_source_id: string
          created_at?: string
          embed_url?: string | null
          external_id: string
          id?: string
          kind: string
          permalink: string
          published_at?: string | null
          status?: string
          thumbnail_url?: string | null
          title?: string | null
        }
        Update: {
          canonical_property_id?: string
          connected_source_id?: string
          created_at?: string
          embed_url?: string | null
          external_id?: string
          id?: string
          kind?: string
          permalink?: string
          published_at?: string | null
          status?: string
          thumbnail_url?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "synced_content_canonical_property_id_fkey"
            columns: ["canonical_property_id"]
            isOneToOne: false
            referencedRelation: "canonical_property"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "synced_content_connected_source_id_fkey"
            columns: ["connected_source_id"]
            isOneToOne: false
            referencedRelation: "connected_source"
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
      watch: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          label: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          label?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          label?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_property_manager: {
        Args: { _pid: string; _uid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_review_views: {
        Args: { _review_id: string }
        Returns: undefined
      }
      recompute_property_truth_score: {
        Args: { p_property_id: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      upgrade_trust_tier: {
        Args: {
          _resident: string
          _tier: Database["public"]["Enums"]["resident_trust_tier"]
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      claim_role: "manager" | "staff" | "owner"
      claim_status: "pending" | "approved" | "rejected"
      geocode_status: "pending" | "geocoded" | "failed" | "manual"
      match_status: "created" | "merged" | "needs_review" | "quarantined"
      property_class:
        | "single_family"
        | "small_multifamily"
        | "midsize"
        | "large_community"
        | "unknown"
      property_status: "active" | "closed" | "quarantined" | "merged"
      resident_trust_tier:
        | "unverified"
        | "likely_resident"
        | "verified_resident"
      review_life_stage:
        | "moveIn"
        | "living"
        | "maintenance"
        | "moveOut"
        | "deposit"
      review_moderation_status: "pending" | "approved" | "rejected"
      verification_method:
        | "none"
        | "gps_dwell"
        | "lease"
        | "utility"
        | "payment"
        | "community"
        | "historical"
        | "email"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      claim_role: ["manager", "staff", "owner"],
      claim_status: ["pending", "approved", "rejected"],
      geocode_status: ["pending", "geocoded", "failed", "manual"],
      match_status: ["created", "merged", "needs_review", "quarantined"],
      property_class: [
        "single_family",
        "small_multifamily",
        "midsize",
        "large_community",
        "unknown",
      ],
      property_status: ["active", "closed", "quarantined", "merged"],
      resident_trust_tier: [
        "unverified",
        "likely_resident",
        "verified_resident",
      ],
      review_life_stage: [
        "moveIn",
        "living",
        "maintenance",
        "moveOut",
        "deposit",
      ],
      review_moderation_status: ["pending", "approved", "rejected"],
      verification_method: [
        "none",
        "gps_dwell",
        "lease",
        "utility",
        "payment",
        "community",
        "historical",
        "email",
      ],
    },
  },
} as const
