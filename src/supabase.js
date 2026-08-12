import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'VITE_SUPABASE_URL 또는 VITE_SUPABASE_ANON_KEY가 없습니다. .env 파일을 확인하고 개발 서버를 다시 실행하세요.',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
