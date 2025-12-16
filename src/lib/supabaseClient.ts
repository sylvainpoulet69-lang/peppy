import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

let supabase: SupabaseClient | null = null;

export const getSupabaseClient = () => {
  if (supabase) return supabase;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase client fallback: environment variables missing, using disabled client.');
    supabase = createClient('https://disabled.supabase.local', 'public-anon-key', {
      global: { fetch: async () => Response.error() }
    });
    return supabase;
  }

  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'x-application-name': 'peppy-gym-booking'
      }
    }
  });

  return supabase;
};
