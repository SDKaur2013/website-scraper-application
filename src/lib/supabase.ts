import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      scraped_results: {
        Row: {
          id: string;
          user_id: string;
          url: string;
          title: string | null;
          content: string | null;
          markdown_content: string | null;
          ai_summary: string | null;
          ai_insights: any;
          keywords: any[];
          sentiment: string | null;
          analysis_status: string;
          firecrawl_metadata: any;
          headings: any[];
          links: any[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          url: string;
          title?: string | null;
          content?: string | null;
          markdown_content?: string | null;
          ai_summary?: string | null;
          ai_insights?: any;
          keywords?: any[];
          sentiment?: string | null;
          analysis_status?: string;
          firecrawl_metadata?: any;
          headings?: any[];
          links?: any[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          url?: string;
          title?: string | null;
          content?: string | null;
          markdown_content?: string | null;
          ai_summary?: string | null;
          ai_insights?: any;
          keywords?: any[];
          sentiment?: string | null;
          analysis_status?: string;
          firecrawl_metadata?: any;
          headings?: any[];
          links?: any[];
          created_at?: string;
          updated_at?: string;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          theme: 'light' | 'dark';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          theme?: 'light' | 'dark';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          theme?: 'light' | 'dark';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};