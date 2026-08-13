export function formatGender(gender) {
  if (gender === 'male') return '남성'
  if (gender === 'female') return '여성'
  return gender
}

export function formatCalendar(calendarType) {
  if (calendarType === 'solar') return '양력'
  if (calendarType === 'lunar') return '음력'
  return calendarType
}

export function formatBirthTime(birthTime) {
  if (!birthTime) return null
  return birthTime.slice(0, 5)
}

export function formatBirthDate(birthDate) {
  if (!birthDate) return ''
  const [year, month, day] = birthDate.split('-')
  return `${year}.${month}.${day}`
}

export function getUserLabel(user) {
  return (
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    '사용자'
  )
}
