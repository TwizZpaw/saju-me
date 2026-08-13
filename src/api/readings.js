import { requireSupabase } from '../lib/supabase'

export const READING_FIELDS =
  'id, name, birth_date, birth_time, gender, calendar_type, result, today_fortune, created_at, user_id, profile_user_id, share_token'

export async function fetchReadings() {
  const { data, error } = await requireSupabase()
    .from('saju_readings')
    .select(READING_FIELDS)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function findExistingReading({
  userId,
  name,
  birthDate,
  birthTime,
  gender,
  calendarType,
}) {
  let query = requireSupabase()
    .from('saju_readings')
    .select(READING_FIELDS)
    .eq('name', name)
    .eq('birth_date', birthDate)
    .eq('gender', gender)
    .eq('calendar_type', calendarType)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)

  query = birthTime ? query.eq('birth_time', birthTime) : query.is('birth_time', null)

  const { data, error } = await query
  if (error) throw error
  return data?.[0] ?? null
}

export async function createReading(payload) {
  const { data, error } = await requireSupabase()
    .from('saju_readings')
    .insert(payload)
    .select(READING_FIELDS)
    .single()

  if (error) throw error
  return data
}

export async function updateReading(id, payload) {
  const { data, error } = await requireSupabase()
    .from('saju_readings')
    .update(payload)
    .eq('id', id)
    .select(READING_FIELDS)
    .single()

  if (error) throw error
  return data
}

export async function saveTodayFortune(id, todayFortune) {
  const { error } = await requireSupabase()
    .from('saju_readings')
    .update({ today_fortune: todayFortune })
    .eq('id', id)

  if (error) throw error
}

export async function fetchReadingsCount() {
  const { data, error } = await requireSupabase().rpc('get_saju_readings_count')
  if (error) throw error
  return typeof data === 'number' ? data : Number(data) || 0
}
