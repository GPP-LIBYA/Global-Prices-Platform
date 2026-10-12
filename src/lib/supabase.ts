import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env?.VITE_SUPABASE_URL ||
  'https://uqqbbaylcmmtyutymqpa.supabase.co';

const supabaseAnonKey =
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_J-BGf6na5ax4-_oSdJ4Zsw_qdKaerP9';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'gcp-auth-stable-v1'
  }
});

console.log('Supabase URL:', supabaseUrl);

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);
