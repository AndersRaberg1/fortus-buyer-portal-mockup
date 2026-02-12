import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton – skapas bara en gång i browsern
let supabaseClient: any = null;

if (typeof window !== 'undefined' && !supabaseClient) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseClient || createClient(supabaseUrl, supabaseAnonKey);
