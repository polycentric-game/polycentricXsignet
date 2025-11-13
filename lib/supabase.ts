import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          ethereum_address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email?: string | null;
          ethereum_address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          ethereum_address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      founders: {
        Row: {
          id: string;
          user_id: string;
          founder_name: string;
          founder_type: string;
          founder_values: string[];
          company_name: string;
          company_description: string;
          stage: string;
          current_valuation_range: string;
          business_model: string;
          key_assets: string[];
          swap_motivation: string;
          gaps_or_needs: string[];
          total_equity_available: number;
          equity_swapped: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          founder_name: string;
          founder_type: string;
          founder_values: string[];
          company_name: string;
          company_description: string;
          stage: string;
          current_valuation_range: string;
          business_model: string;
          key_assets: string[];
          swap_motivation: string;
          gaps_or_needs: string[];
          total_equity_available?: number;
          equity_swapped?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          founder_name?: string;
          founder_type?: string;
          founder_values?: string[];
          company_name?: string;
          company_description?: string;
          stage?: string;
          current_valuation_range?: string;
          business_model?: string;
          key_assets?: string[];
          swap_motivation?: string;
          gaps_or_needs?: string[];
          total_equity_available?: number;
          equity_swapped?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      agreements: {
        Row: {
          id: string;
          founder_a_id: string;
          founder_b_id: string;
          status: string;
          initiated_by: string;
          last_revised_by: string;
          current_version: number;
          versions: any[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          founder_a_id: string;
          founder_b_id: string;
          status: string;
          initiated_by: string;
          last_revised_by: string;
          current_version?: number;
          versions: any[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          founder_a_id?: string;
          founder_b_id?: string;
          status?: string;
          initiated_by?: string;
          last_revised_by?: string;
          current_version?: number;
          versions?: any[];
          created_at?: string;
          updated_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          founder_id: string | null;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          founder_id?: string | null;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          founder_id?: string | null;
          expires_at?: string;
          created_at?: string;
        };
      };
    };
  };
}
