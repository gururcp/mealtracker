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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      audit_events: {
        Row: {
          action: string
          actor_member_id: string | null
          actor_user_id: string | null
          id: string
          new_data: Json | null
          occurred_at: string
          old_data: Json | null
          row_id: string
          table_name: string
        }
        Insert: {
          action: string
          actor_member_id?: string | null
          actor_user_id?: string | null
          id?: string
          new_data?: Json | null
          occurred_at?: string
          old_data?: Json | null
          row_id: string
          table_name: string
        }
        Update: {
          action?: string
          actor_member_id?: string | null
          actor_user_id?: string | null
          id?: string
          new_data?: Json | null
          occurred_at?: string
          old_data?: Json | null
          row_id?: string
          table_name?: string
        }
        Relationships: []
      }
      clinic_members: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["clinic_role"]
          user_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["clinic_role"]
          user_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["clinic_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_members_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_logs: {
        Row: {
          created_at: string
          id: string
          log_date: string
          member_id: string
          plan_version_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          log_date: string
          member_id: string
          plan_version_id: string
        }
        Update: {
          created_at?: string
          id?: string
          log_date?: string
          member_id?: string
          plan_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_logs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_logs_plan_version_id_fkey"
            columns: ["plan_version_id"]
            isOneToOne: false
            referencedRelation: "plan_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      food_aliases: {
        Row: {
          added_by_user_id: string | null
          alias_name: string
          created_at: string
          food_id: string
          id: string
          language: string
        }
        Insert: {
          added_by_user_id?: string | null
          alias_name: string
          created_at?: string
          food_id: string
          id?: string
          language?: string
        }
        Update: {
          added_by_user_id?: string | null
          alias_name?: string
          created_at?: string
          food_id?: string
          id?: string
          language?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_aliases_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
        ]
      }
      food_clinic_overrides: {
        Row: {
          cal: number | null
          carbs_g: number | null
          clinic_id: string
          created_at: string
          fat_g: number | null
          fiber_g: number | null
          food_id: string
          id: string
          override_note: string | null
          protein_g: number | null
        }
        Insert: {
          cal?: number | null
          carbs_g?: number | null
          clinic_id: string
          created_at?: string
          fat_g?: number | null
          fiber_g?: number | null
          food_id: string
          id?: string
          override_note?: string | null
          protein_g?: number | null
        }
        Update: {
          cal?: number | null
          carbs_g?: number | null
          clinic_id?: string
          created_at?: string
          fat_g?: number | null
          fiber_g?: number | null
          food_id?: string
          id?: string
          override_note?: string | null
          protein_g?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "food_clinic_overrides_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_clinic_overrides_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
        ]
      }
      food_nutrition_versions: {
        Row: {
          cal: number | null
          calcium_mg: number | null
          carbs_g: number | null
          content_version: number
          fat_g: number | null
          fiber_g: number | null
          folate_ug: number | null
          food_id: string
          iron_mg: number | null
          magnesium_mg: number | null
          niacin_mg: number | null
          phosphorus_mg: number | null
          potassium_mg: number | null
          protein_g: number | null
          riboflavin_mg: number | null
          snapshotted_at: string
          sodium_mg: number | null
          thiamin_mg: number | null
          vit_a_ug: number | null
          vit_b12_ug: number | null
          vit_b6_mg: number | null
          vit_c_mg: number | null
          vit_d_ug: number | null
          vit_e_mg: number | null
          vit_k_ug: number | null
          zinc_mg: number | null
        }
        Insert: {
          cal?: number | null
          calcium_mg?: number | null
          carbs_g?: number | null
          content_version: number
          fat_g?: number | null
          fiber_g?: number | null
          folate_ug?: number | null
          food_id: string
          iron_mg?: number | null
          magnesium_mg?: number | null
          niacin_mg?: number | null
          phosphorus_mg?: number | null
          potassium_mg?: number | null
          protein_g?: number | null
          riboflavin_mg?: number | null
          snapshotted_at?: string
          sodium_mg?: number | null
          thiamin_mg?: number | null
          vit_a_ug?: number | null
          vit_b12_ug?: number | null
          vit_b6_mg?: number | null
          vit_c_mg?: number | null
          vit_d_ug?: number | null
          vit_e_mg?: number | null
          vit_k_ug?: number | null
          zinc_mg?: number | null
        }
        Update: {
          cal?: number | null
          calcium_mg?: number | null
          carbs_g?: number | null
          content_version?: number
          fat_g?: number | null
          fiber_g?: number | null
          folate_ug?: number | null
          food_id?: string
          iron_mg?: number | null
          magnesium_mg?: number | null
          niacin_mg?: number | null
          phosphorus_mg?: number | null
          potassium_mg?: number | null
          protein_g?: number | null
          riboflavin_mg?: number | null
          snapshotted_at?: string
          sodium_mg?: number | null
          thiamin_mg?: number | null
          vit_a_ug?: number | null
          vit_b12_ug?: number | null
          vit_b6_mg?: number | null
          vit_c_mg?: number | null
          vit_d_ug?: number | null
          vit_e_mg?: number | null
          vit_k_ug?: number | null
          zinc_mg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "food_nutrition_versions_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
        ]
      }
      foods: {
        Row: {
          cal: number | null
          calcium_mg: number | null
          carbs_g: number | null
          category: Database["public"]["Enums"]["food_category"]
          content_version: number
          created_at: string
          en_name: string
          fat_g: number | null
          fiber_g: number | null
          folate_ug: number | null
          hi_name: string | null
          id: string
          iron_mg: number | null
          magnesium_mg: number | null
          niacin_mg: number | null
          per_100_unit: Database["public"]["Enums"]["unit_type"]
          phosphorus_mg: number | null
          piece_grams: number | null
          potassium_mg: number | null
          protein_g: number | null
          riboflavin_mg: number | null
          sodium_mg: number | null
          source: Database["public"]["Enums"]["food_source"]
          source_ref: string | null
          thiamin_mg: number | null
          tsp_grams: number | null
          updated_at: string
          vit_a_ug: number | null
          vit_b12_ug: number | null
          vit_b6_mg: number | null
          vit_c_mg: number | null
          vit_d_ug: number | null
          vit_e_mg: number | null
          vit_k_ug: number | null
          zinc_mg: number | null
        }
        Insert: {
          cal?: number | null
          calcium_mg?: number | null
          carbs_g?: number | null
          category?: Database["public"]["Enums"]["food_category"]
          content_version?: number
          created_at?: string
          en_name: string
          fat_g?: number | null
          fiber_g?: number | null
          folate_ug?: number | null
          hi_name?: string | null
          id?: string
          iron_mg?: number | null
          magnesium_mg?: number | null
          niacin_mg?: number | null
          per_100_unit?: Database["public"]["Enums"]["unit_type"]
          phosphorus_mg?: number | null
          piece_grams?: number | null
          potassium_mg?: number | null
          protein_g?: number | null
          riboflavin_mg?: number | null
          sodium_mg?: number | null
          source?: Database["public"]["Enums"]["food_source"]
          source_ref?: string | null
          thiamin_mg?: number | null
          tsp_grams?: number | null
          updated_at?: string
          vit_a_ug?: number | null
          vit_b12_ug?: number | null
          vit_b6_mg?: number | null
          vit_c_mg?: number | null
          vit_d_ug?: number | null
          vit_e_mg?: number | null
          vit_k_ug?: number | null
          zinc_mg?: number | null
        }
        Update: {
          cal?: number | null
          calcium_mg?: number | null
          carbs_g?: number | null
          category?: Database["public"]["Enums"]["food_category"]
          content_version?: number
          created_at?: string
          en_name?: string
          fat_g?: number | null
          fiber_g?: number | null
          folate_ug?: number | null
          hi_name?: string | null
          id?: string
          iron_mg?: number | null
          magnesium_mg?: number | null
          niacin_mg?: number | null
          per_100_unit?: Database["public"]["Enums"]["unit_type"]
          phosphorus_mg?: number | null
          piece_grams?: number | null
          potassium_mg?: number | null
          protein_g?: number | null
          riboflavin_mg?: number | null
          sodium_mg?: number | null
          source?: Database["public"]["Enums"]["food_source"]
          source_ref?: string | null
          thiamin_mg?: number | null
          tsp_grams?: number | null
          updated_at?: string
          vit_a_ug?: number | null
          vit_b12_ug?: number | null
          vit_b6_mg?: number | null
          vit_c_mg?: number | null
          vit_d_ug?: number | null
          vit_e_mg?: number | null
          vit_k_ug?: number | null
          zinc_mg?: number | null
        }
        Relationships: []
      }
      habit_ticks: {
        Row: {
          daily_log_id: string
          done: boolean
          id: string
          plan_habit_id: string
          ticked_at: string
          value: number | null
          value_unit: string | null
        }
        Insert: {
          daily_log_id: string
          done?: boolean
          id?: string
          plan_habit_id: string
          ticked_at?: string
          value?: number | null
          value_unit?: string | null
        }
        Update: {
          daily_log_id?: string
          done?: boolean
          id?: string
          plan_habit_id?: string
          ticked_at?: string
          value?: number | null
          value_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "habit_ticks_daily_log_id_fkey"
            columns: ["daily_log_id"]
            isOneToOne: false
            referencedRelation: "daily_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_ticks_plan_habit_id_fkey"
            columns: ["plan_habit_id"]
            isOneToOne: false
            referencedRelation: "plan_habits"
            referencedColumns: ["id"]
          },
        ]
      }
      household_clinic_history: {
        Row: {
          clinic_id: string
          created_at: string
          from_date: string
          household_id: string
          id: string
          to_date: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          from_date: string
          household_id: string
          id?: string
          to_date?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          from_date?: string
          household_id?: string
          id?: string
          to_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "household_clinic_history_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "household_clinic_history_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          billing_status: Database["public"]["Enums"]["billing_status"]
          clinic_id: string | null
          created_at: string
          id: string
          name: string
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          billing_status?: Database["public"]["Enums"]["billing_status"]
          clinic_id?: string | null
          created_at?: string
          id?: string
          name: string
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          billing_status?: Database["public"]["Enums"]["billing_status"]
          clinic_id?: string | null
          created_at?: string
          id?: string
          name?: string
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "households_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_slots: {
        Row: {
          id: string
          name: string
          plan_version_id: string
          position: number
        }
        Insert: {
          id?: string
          name: string
          plan_version_id: string
          position: number
        }
        Update: {
          id?: string
          name?: string
          plan_version_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "meal_slots_plan_version_id_fkey"
            columns: ["plan_version_id"]
            isOneToOne: false
            referencedRelation: "plan_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_ticks: {
        Row: {
          chosen_food_id: string | null
          daily_log_id: string
          eaten: boolean
          id: string
          plan_item_id: string
          quantity_eaten_g: number | null
          ticked_at: string
        }
        Insert: {
          chosen_food_id?: string | null
          daily_log_id: string
          eaten?: boolean
          id?: string
          plan_item_id: string
          quantity_eaten_g?: number | null
          ticked_at?: string
        }
        Update: {
          chosen_food_id?: string | null
          daily_log_id?: string
          eaten?: boolean
          id?: string
          plan_item_id?: string
          quantity_eaten_g?: number | null
          ticked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_ticks_chosen_food_id_fkey"
            columns: ["chosen_food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_ticks_daily_log_id_fkey"
            columns: ["daily_log_id"]
            isOneToOne: false
            referencedRelation: "daily_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_ticks_plan_item_id_fkey"
            columns: ["plan_item_id"]
            isOneToOne: false
            referencedRelation: "plan_items"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          auth_user_id: string | null
          created_at: string
          deactivated_at: string | null
          deactivated_by_member_id: string | null
          deactivated_by_user_id: string | null
          dob: string | null
          height_cm: number | null
          household_id: string
          id: string
          is_active: boolean
          is_family_admin: boolean
          name: string
          pin_hash: string | null
          sex: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          deactivated_at?: string | null
          deactivated_by_member_id?: string | null
          deactivated_by_user_id?: string | null
          dob?: string | null
          height_cm?: number | null
          household_id: string
          id?: string
          is_active?: boolean
          is_family_admin?: boolean
          name: string
          pin_hash?: string | null
          sex?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          deactivated_at?: string | null
          deactivated_by_member_id?: string | null
          deactivated_by_user_id?: string | null
          dob?: string | null
          height_cm?: number | null
          household_id?: string
          id?: string
          is_active?: boolean
          is_family_admin?: boolean
          name?: string
          pin_hash?: string | null
          sex?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_allowed_vegs: {
        Row: {
          food_id: string
          id: string
          plan_version_id: string
        }
        Insert: {
          food_id: string
          id?: string
          plan_version_id: string
        }
        Update: {
          food_id?: string
          id?: string
          plan_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_allowed_vegs_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_allowed_vegs_plan_version_id_fkey"
            columns: ["plan_version_id"]
            isOneToOne: false
            referencedRelation: "plan_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_habits: {
        Row: {
          en_label: string
          hi_label: string | null
          id: string
          is_boolean: boolean
          plan_version_id: string
          position: number
          target_max_value: number | null
          target_unit: string | null
          target_value: number | null
        }
        Insert: {
          en_label: string
          hi_label?: string | null
          id?: string
          is_boolean?: boolean
          plan_version_id: string
          position: number
          target_max_value?: number | null
          target_unit?: string | null
          target_value?: number | null
        }
        Update: {
          en_label?: string
          hi_label?: string | null
          id?: string
          is_boolean?: boolean
          plan_version_id?: string
          position?: number
          target_max_value?: number | null
          target_unit?: string | null
          target_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_habits_plan_version_id_fkey"
            columns: ["plan_version_id"]
            isOneToOne: false
            referencedRelation: "plan_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_item_alternates: {
        Row: {
          food_content_version: number | null
          food_id: string | null
          id: string
          is_default: boolean
          kind: Database["public"]["Enums"]["alternate_kind"]
          plan_item_id: string
          position: number
          quantity: number
          unit: Database["public"]["Enums"]["unit_type"]
        }
        Insert: {
          food_content_version?: number | null
          food_id?: string | null
          id?: string
          is_default?: boolean
          kind?: Database["public"]["Enums"]["alternate_kind"]
          plan_item_id: string
          position: number
          quantity: number
          unit?: Database["public"]["Enums"]["unit_type"]
        }
        Update: {
          food_content_version?: number | null
          food_id?: string | null
          id?: string
          is_default?: boolean
          kind?: Database["public"]["Enums"]["alternate_kind"]
          plan_item_id?: string
          position?: number
          quantity?: number
          unit?: Database["public"]["Enums"]["unit_type"]
        }
        Relationships: [
          {
            foreignKeyName: "plan_item_alternates_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_item_alternates_plan_item_id_fkey"
            columns: ["plan_item_id"]
            isOneToOne: false
            referencedRelation: "plan_items"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_items: {
        Row: {
          id: string
          kind: Database["public"]["Enums"]["plan_item_kind"]
          meal_slot_id: string
          note: string | null
          plan_version_id: string
          position: number
        }
        Insert: {
          id?: string
          kind: Database["public"]["Enums"]["plan_item_kind"]
          meal_slot_id: string
          note?: string | null
          plan_version_id: string
          position: number
        }
        Update: {
          id?: string
          kind?: Database["public"]["Enums"]["plan_item_kind"]
          meal_slot_id?: string
          note?: string | null
          plan_version_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "plan_items_meal_slot_id_fkey"
            columns: ["meal_slot_id"]
            isOneToOne: false
            referencedRelation: "meal_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_items_plan_version_id_fkey"
            columns: ["plan_version_id"]
            isOneToOne: false
            referencedRelation: "plan_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_versions: {
        Row: {
          authored_by_member_id: string | null
          authored_by_user_id: string | null
          clinic_id: string | null
          created_at: string
          effective_date: string
          id: string
          member_id: string
          note: string | null
          published_at: string | null
          status: Database["public"]["Enums"]["plan_version_status"]
        }
        Insert: {
          authored_by_member_id?: string | null
          authored_by_user_id?: string | null
          clinic_id?: string | null
          created_at?: string
          effective_date: string
          id?: string
          member_id: string
          note?: string | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["plan_version_status"]
        }
        Update: {
          authored_by_member_id?: string | null
          authored_by_user_id?: string | null
          clinic_id?: string | null
          created_at?: string
          effective_date?: string
          id?: string
          member_id?: string
          note?: string | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["plan_version_status"]
        }
        Relationships: [
          {
            foreignKeyName: "plan_versions_authored_by_member_id_fkey"
            columns: ["authored_by_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_versions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_versions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      scale_extractions: {
        Row: {
          confirmed_at: string | null
          confirmed_by_member_id: string | null
          confirmed_by_user_id: string | null
          extracted_values: Json | null
          id: string
          member_id: string
          raw_extraction_json: Json | null
          source_file_url: string
          status: Database["public"]["Enums"]["extraction_status"]
          uploaded_at: string
        }
        Insert: {
          confirmed_at?: string | null
          confirmed_by_member_id?: string | null
          confirmed_by_user_id?: string | null
          extracted_values?: Json | null
          id?: string
          member_id: string
          raw_extraction_json?: Json | null
          source_file_url: string
          status?: Database["public"]["Enums"]["extraction_status"]
          uploaded_at?: string
        }
        Update: {
          confirmed_at?: string | null
          confirmed_by_member_id?: string | null
          confirmed_by_user_id?: string | null
          extracted_values?: Json | null
          id?: string
          member_id?: string
          raw_extraction_json?: Json | null
          source_file_url?: string
          status?: Database["public"]["Enums"]["extraction_status"]
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scale_extractions_confirmed_by_member_id_fkey"
            columns: ["confirmed_by_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scale_extractions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      serving_units: {
        Row: {
          food_category: Database["public"]["Enums"]["food_category"] | null
          grams_per_unit: number
          id: string
          name: string
        }
        Insert: {
          food_category?: Database["public"]["Enums"]["food_category"] | null
          grams_per_unit: number
          id?: string
          name: string
        }
        Update: {
          food_category?: Database["public"]["Enums"]["food_category"] | null
          grams_per_unit?: number
          id?: string
          name?: string
        }
        Relationships: []
      }
      weight_readings: {
        Row: {
          bmi: number | null
          bmr_kcal: number | null
          body_fat_pct: number | null
          bone_mass_kg: number | null
          created_at: string
          entered_by_member_id: string | null
          entered_by_user_id: string | null
          fat_mass_kg: number | null
          id: string
          lean_mass_kg: number | null
          member_id: string
          metabolic_age: number | null
          muscle_mass_kg: number | null
          note: string | null
          protein_pct: number | null
          reading_date: string
          scale_extraction_id: string | null
          subcutaneous_fat_pct: number | null
          visceral_fat: number | null
          weight_kg: number
        }
        Insert: {
          bmi?: number | null
          bmr_kcal?: number | null
          body_fat_pct?: number | null
          bone_mass_kg?: number | null
          created_at?: string
          entered_by_member_id?: string | null
          entered_by_user_id?: string | null
          fat_mass_kg?: number | null
          id?: string
          lean_mass_kg?: number | null
          member_id: string
          metabolic_age?: number | null
          muscle_mass_kg?: number | null
          note?: string | null
          protein_pct?: number | null
          reading_date: string
          scale_extraction_id?: string | null
          subcutaneous_fat_pct?: number | null
          visceral_fat?: number | null
          weight_kg: number
        }
        Update: {
          bmi?: number | null
          bmr_kcal?: number | null
          body_fat_pct?: number | null
          bone_mass_kg?: number | null
          created_at?: string
          entered_by_member_id?: string | null
          entered_by_user_id?: string | null
          fat_mass_kg?: number | null
          id?: string
          lean_mass_kg?: number | null
          member_id?: string
          metabolic_age?: number | null
          muscle_mass_kg?: number | null
          note?: string | null
          protein_pct?: number | null
          reading_date?: string
          scale_extraction_id?: string | null
          subcutaneous_fat_pct?: number | null
          visceral_fat?: number | null
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "weight_readings_entered_by_member_id_fkey"
            columns: ["entered_by_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weight_readings_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weight_readings_scale_extraction_id_fkey"
            columns: ["scale_extraction_id"]
            isOneToOne: false
            referencedRelation: "scale_extractions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_member_id: { Args: never; Returns: string }
      session_clinic_id: { Args: never; Returns: string }
      session_household_id: { Args: never; Returns: string }
      session_is_family_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      alternate_kind: "specific" | "open_veg"
      billing_status: "trialing" | "active" | "past_due" | "canceled" | "paused"
      clinic_role: "owner" | "nutritionist" | "staff"
      extraction_status: "pending" | "confirmed" | "rejected"
      food_category:
        | "vegetable"
        | "grain"
        | "dairy"
        | "protein"
        | "fruit"
        | "oil"
        | "spice"
        | "beverage"
        | "supplement"
        | "other"
      food_source: "ifct" | "usda" | "llm" | "manual"
      plan_item_kind: "fixed" | "choice"
      plan_version_status: "draft" | "active" | "superseded"
      unit_type: "g" | "ml" | "piece" | "tsp" | "tbsp"
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
      alternate_kind: ["specific", "open_veg"],
      billing_status: ["trialing", "active", "past_due", "canceled", "paused"],
      clinic_role: ["owner", "nutritionist", "staff"],
      extraction_status: ["pending", "confirmed", "rejected"],
      food_category: [
        "vegetable",
        "grain",
        "dairy",
        "protein",
        "fruit",
        "oil",
        "spice",
        "beverage",
        "supplement",
        "other",
      ],
      food_source: ["ifct", "usda", "llm", "manual"],
      plan_item_kind: ["fixed", "choice"],
      plan_version_status: ["draft", "active", "superseded"],
      unit_type: ["g", "ml", "piece", "tsp", "tbsp"],
    },
  },
} as const
