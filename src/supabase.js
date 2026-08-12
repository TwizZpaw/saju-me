import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase 환경 변수가 없습니다. Netlify/Vercel에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY를 넣고 다시 배포하세요.',
    )
  }
  return supabase
}
