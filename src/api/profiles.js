import { requireSupabase } from '../lib/supabase'

/**
 * 로그인한 사용자의 개인정보(프로필)를 불러온다.
 * @returns {Promise<object|null>}
 */
export async function loadProfile(userId) {
  const { data, error } = await requireSupabase()
    .from('profiles')
    .select('user_id, name, birth_date, birth_time, gender, calendar_type, updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

/**
 * 개인정보를 저장하거나 갱신한다. (auth.users 1:1)
 */
export async function upsertProfile(userId, profile) {
  const { data, error } = await requireSupabase()
    .from('profiles')
    .upsert(
      {
        user_id: userId,
        name: profile.name,
        birth_date: profile.birthDate,
        birth_time: profile.birthTime || null,
        gender: profile.gender,
        calendar_type: profile.calendarType,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .select('user_id, name, birth_date, birth_time, gender, calendar_type, updated_at')
    .single()

  if (error) {
    throw error
  }

  return data
}
