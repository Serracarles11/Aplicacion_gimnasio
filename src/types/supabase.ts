// src/types/supabase.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          user_id: string;
          display_name: string | null;
        };
        Insert: {
          user_id: string;
          display_name?: string | null;
        };
        Update: {
          user_id?: string;
          display_name?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_: string]: never;
    };
    Functions: {
      [_: string]: never;
    };
    Enums: {
      [_: string]: never;
    };
    CompositeTypes: {
      [_: string]: never;
    };
  };
};
