import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl as string;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey as string;

// Secure storage adapter for Supabase session tokens
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          avatar_url: string | null;
          handicap: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      bags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          is_default: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['bags']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['bags']['Row']>;
      };
      bag_discs: {
        Row: {
          id: string;
          bag_id: string;
          trydiscs_brand: string;
          trydiscs_disc: string;
          nickname: string | null;
          plastic: string | null;
          weight: number | null;
          color: string | null;
          is_worn: boolean;
          category: string;
          speed: number;
          glide: number;
          turn: number;
          fade: number;
        };
        Insert: Omit<Database['public']['Tables']['bag_discs']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['bag_discs']['Row']>;
      };
      rounds: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          course_name: string;
          layout_id: string | null;
          layout_name: string | null;
          started_at: string;
          finished_at: string | null;
          total_score: number | null;
          total_par: number | null;
          weather_snapshot: Record<string, unknown> | null;
        };
        Insert: Omit<Database['public']['Tables']['rounds']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['rounds']['Row']>;
      };
      scores: {
        Row: {
          id: string;
          round_id: string;
          hole_number: number;
          par: number;
          strokes: number;
          disc_used: string | null;
          notes: string | null;
        };
        Insert: Omit<Database['public']['Tables']['scores']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['scores']['Row']>;
      };
    };
  };
};
