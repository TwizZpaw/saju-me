import { useEffect, useState } from 'react'
import './App.css'
import { buildSajuPrompt } from './buildSajuPrompt'
import { askGemini } from './gemini'
import { isSupabaseConfigured, requireSupabase } from './supabase'

function formatGender(gender) {
  if (gender === 'male') return '남성'
  if (gender === 'female') return '여성'
  return gender
}

function formatCalendar(calendarType) {
  if (calendarType === 'solar') return '양력'
  if (calendarType === 'lunar') return '음력'
  return calendarType
}

function formatBirthTime(birthTime) {
  if (!birthTime) return null
  return birthTime.slice(0, 5)
}

function formatBirthDate(birthDate) {
  if (!birthDate) return ''
  const [year, month, day] = birthDate.split('-')
  return `${year}.${month}.${day}`
}

function App() {
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [gender, setGender] = useState('')
  const [calendarType, setCalendarType] = useState('')

  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [readings, setReadings] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  const selectedReading = readings.find((reading) => reading.id === selectedId) ?? null

  async function loadReadings() {
    if (!isSupabaseConfigured) {
      return []
    }

    const { data, error: loadError } = await requireSupabase()
      .from('saju_readings')
      .select(
        'id, name, birth_date, birth_time, gender, calendar_type, result, created_at',
      )
      .order('created_at', { ascending: false })

    if (loadError) {
      console.error(loadError)
      return []
    }

    const next = data ?? []
    setReadings(next)
    return next
  }

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError(
        'Supabase 환경 변수가 없습니다. Netlify에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY를 넣고 재배포하세요.',
      )
      return
    }
    loadReadings()
  }, [])

  function handleSelectReading(id) {
    setSelectedId((current) => (current === id ? null : id))
    setResult('')
    setError('')
  }

  async function handleAnalyze(e) {
    e.preventDefault()

    if (!name || !birthDate || !gender || !calendarType) {
      setError('이름, 생년월일, 성별, 양력/음력을 모두 입력해 주세요.')
      return
    }

    setLoading(true)
    setError('')
    setResult('')
    setSelectedId(null)

    const normalizedBirthTime = birthTime || null

    try {
      let existingQuery = requireSupabase()
        .from('saju_readings')
        .select(
          'id, name, birth_date, birth_time, gender, calendar_type, result, created_at',
        )
        .eq('name', name)
        .eq('birth_date', birthDate)
        .eq('gender', gender)
        .eq('calendar_type', calendarType)
        .order('created_at', { ascending: false })
        .limit(1)

      existingQuery = normalizedBirthTime
        ? existingQuery.eq('birth_time', normalizedBirthTime)
        : existingQuery.is('birth_time', null)

      const { data: existingRows, error: existingError } = await existingQuery

      if (existingError) {
        throw existingError
      }

      const existing = existingRows?.[0]
      if (existing) {
        await loadReadings()
        setSelectedId(existing.id)
        return
      }

      const prompt = buildSajuPrompt({
        name,
        birthDate,
        birthTime,
        gender,
        calendarType,
      })
      const text = await askGemini(prompt)
      setResult(text)

      const { data: saved, error: saveError } = await requireSupabase()
        .from('saju_readings')
        .insert({
          name,
          birth_date: birthDate,
          birth_time: normalizedBirthTime,
          gender,
          calendar_type: calendarType,
          result: text,
        })
        .select(
          'id, name, birth_date, birth_time, gender, calendar_type, result, created_at',
        )
        .single()

      if (saveError) {
        throw saveError
      }

      await loadReadings()
      if (saved?.id) {
        setSelectedId(saved.id)
        setResult('')
      }
    } catch (err) {
      console.error(err)
      setError(err.message || '사주 해석 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <div className="app__veil" aria-hidden="true" />
      <div className="app__glow" aria-hidden="true" />

      <aside className="sidebar" aria-label="저장된 사주 목록">
        <p className="sidebar__title">기록</p>
        {readings.length === 0 ? (
          <p className="sidebar__empty">아직 저장된 사주가 없습니다.</p>
        ) : (
          <ul className="sidebar__list">
            {readings.map((reading) => {
              const isActive = reading.id === selectedId
              return (
                <li key={reading.id}>
                  <button
                    type="button"
                    className={
                      isActive ? 'sidebar__item is-active' : 'sidebar__item'
                    }
                    onClick={() => handleSelectReading(reading.id)}
                    aria-pressed={isActive}
                  >
                    <span className="sidebar__name">{reading.name}</span>
                    <span className="sidebar__meta">
                      {formatBirthDate(reading.birth_date)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </aside>

      <main className="shell">
        <header className="hero">
          <p className="brand">사주</p>
          <h1 className="headline">나의 운명을 읽어 보세요</h1>
          <p className="lede">
            생년월일과 시간을 입력하면, 당신만의 사주를 풀어 드립니다.
          </p>
        </header>

        {selectedReading && (
          <section className="archive" aria-live="polite">
            <div className="archive__orb" aria-hidden="true" />
            <p className="archive__eyebrow">저장된 사주</p>
            <h2 className="archive__name">{selectedReading.name}</h2>
            <p className="archive__facts">
              <span>{formatBirthDate(selectedReading.birth_date)}</span>
              {formatBirthTime(selectedReading.birth_time) && (
                <>
                  <span className="archive__dot" aria-hidden="true" />
                  <span>{formatBirthTime(selectedReading.birth_time)}</span>
                </>
              )}
              <span className="archive__dot" aria-hidden="true" />
              <span>{formatGender(selectedReading.gender)}</span>
              <span className="archive__dot" aria-hidden="true" />
              <span>{formatCalendar(selectedReading.calendar_type)}</span>
            </p>
            <div className="archive__divider" aria-hidden="true" />
            <pre className="archive__result">{selectedReading.result}</pre>
          </section>
        )}

        <form className="form" onSubmit={handleAnalyze}>
          <div className="form__grid">
            <label className="field">
              <span className="field__label">이름</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                autoComplete="name"
              />
            </label>

            <label className="field">
              <span className="field__label">생년월일</span>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </label>

            <label className="field">
              <span className="field__label">
                태어난 시간 <em>선택</em>
              </span>
              <input
                type="time"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
              />
            </label>

            <label className="field">
              <span className="field__label">성별</span>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">선택하세요</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
              </select>
            </label>

            <label className="field field--wide">
              <span className="field__label">양력 / 음력</span>
              <div className="segment" role="group" aria-label="양력 또는 음력">
                <button
                  type="button"
                  className={
                    calendarType === 'solar'
                      ? 'segment__btn is-active'
                      : 'segment__btn'
                  }
                  onClick={() => setCalendarType('solar')}
                >
                  양력
                </button>
                <button
                  type="button"
                  className={
                    calendarType === 'lunar'
                      ? 'segment__btn is-active'
                      : 'segment__btn'
                  }
                  onClick={() => setCalendarType('lunar')}
                >
                  음력
                </button>
              </div>
            </label>
          </div>

          <button
            type="submit"
            className="analyze-btn"
            disabled={loading}
          >
            <span className="analyze-btn__text">
              {loading ? '별을 읽고 있어요…' : '사주 해석하기'}
            </span>
          </button>

          {error && <p className="error" role="alert">{error}</p>}
        </form>

        {!selectedReading && result && (
          <section className="result" aria-live="polite">
            <h2 className="result__title">사주 해석 결과</h2>
            <pre className="result-text">{result}</pre>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
