import { createClient } from '@supabase/supabase-js'

// These would normally come from environment variables
// For demo purposes, using placeholder values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 