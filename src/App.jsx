import { useEffect, useState } from 'react'
import './App.css'
import { buildSajuPrompt } from './buildSajuPrompt'
import { askGemini } from './gemini'
import { isSupabaseConfigured, requireSupabase } from './supabase'
import { useAuth } from './useAuth'

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

function getUserLabel(user) {
  return (
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    '사용자'
  )
}

function App() {
  const {
    user,
    loading: authLoading,
    signInWithGoogle,
    signOut,
  } = useAuth()

  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [gender, setGender] = useState('')
  const [calendarType, setCalendarType] = useState('')

  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [authBusy, setAuthBusy] = useState(false)
  const [error, setError] = useState('')
  const [readings, setReadings] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editResult, setEditResult] = useState('')

  const selectedReading = readings.find((reading) => reading.id === selectedId) ?? null
  const isEditing = Boolean(editingId)

  async function loadReadings() {
    if (!isSupabaseConfigured || !user) {
      setReadings([])
      return []
    }

    const { data, error: loadError } = await requireSupabase()
      .from('saju_readings')
      .select(
        'id, name, birth_date, birth_time, gender, calendar_type, result, created_at, user_id',
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

    if (!user) {
      setReadings([])
      setSelectedId(null)
      setEditingId(null)
      return
    }

    setError('')
    loadReadings()
  }, [user])

  function clearForm() {
    setName('')
    setBirthDate('')
    setBirthTime('')
    setGender('')
    setCalendarType('')
    setResult('')
    setEditResult('')
  }

  async function handleGoogleLogin() {
    setAuthBusy(true)
    setError('')
    try {
      await signInWithGoogle()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Google 로그인에 실패했습니다.')
      setAuthBusy(false)
    }
  }

  async function handleSignOut() {
    setAuthBusy(true)
    setError('')
    try {
      await signOut()
      clearForm()
      setSelectedId(null)
      setEditingId(null)
      setReadings([])
    } catch (err) {
      console.error(err)
      setError(err.message || '로그아웃에 실패했습니다.')
    } finally {
      setAuthBusy(false)
    }
  }

  function handleSelectReading(id) {
    if (editingId && editingId !== id) {
      setEditingId(null)
      setEditResult('')
    }

    setSelectedId((current) => {
      if (current === id) {
        setEditingId(null)
        setEditResult('')
        return null
      }
      return id
    })
    setResult('')
    setError('')
  }

  function handleStartEdit() {
    if (!selectedReading) return

    setEditingId(selectedReading.id)
    setName(selectedReading.name)
    setBirthDate(selectedReading.birth_date)
    setBirthTime(formatBirthTime(selectedReading.birth_time) || '')
    setGender(selectedReading.gender)
    setCalendarType(selectedReading.calendar_type)
    setEditResult(selectedReading.result)
    setResult('')
    setError('')
  }

  function handleCancelEdit() {
    setEditingId(null)
    setEditResult('')
    clearForm()
    setError('')
  }

  async function handleUpdate(e) {
    e.preventDefault()

    if (!editingId || !user) return

    if (!name || !birthDate || !gender || !calendarType || !editResult.trim()) {
      setError('이름, 생년월일, 성별, 양력/음력, 결과 내용을 모두 입력해 주세요.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const { data: updated, error: updateError } = await requireSupabase()
        .from('saju_readings')
        .update({
          name,
          birth_date: birthDate,
          birth_time: birthTime || null,
          gender,
          calendar_type: calendarType,
          result: editResult.trim(),
        })
        .eq('id', editingId)
        .select(
          'id, name, birth_date, birth_time, gender, calendar_type, result, created_at, user_id',
        )
        .single()

      if (updateError) {
        throw updateError
      }

      await loadReadings()
      setSelectedId(updated.id)
      setEditingId(null)
      setEditResult('')
      clearForm()
    } catch (err) {
      console.error(err)
      setError(err.message || '사주 기록 수정 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!selectedReading || !user) return

    const ok = window.confirm(
      `"${selectedReading.name}" 사주 기록을 삭제할까요? 이 작업은 되돌릴 수 없습니다.`,
    )
    if (!ok) return

    setSaving(true)
    setError('')

    try {
      const { error: deleteError } = await requireSupabase()
        .from('saju_readings')
        .delete()
        .eq('id', selectedReading.id)

      if (deleteError) {
        throw deleteError
      }

      if (editingId === selectedReading.id) {
        setEditingId(null)
        setEditResult('')
        clearForm()
      }

      setSelectedId(null)
      await loadReadings()
    } catch (err) {
      console.error(err)
      setError(err.message || '사주 기록 삭제 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleAnalyze(e) {
    e.preventDefault()

    if (isEditing) {
      await handleUpdate(e)
      return
    }

    if (!user) {
      setError('사주를 보려면 Google 로그인이 필요합니다.')
      return
    }

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
          'id, name, birth_date, birth_time, gender, calendar_type, result, created_at, user_id',
        )
        .eq('name', name)
        .eq('birth_date', birthDate)
        .eq('gender', gender)
        .eq('calendar_type', calendarType)
        .eq('user_id', user.id)
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
          user_id: user.id,
        })
        .select(
          'id, name, birth_date, birth_time, gender, calendar_type, result, created_at, user_id',
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

  if (!isSupabaseConfigured) {
    return (
      <div className="app">
        <div className="app__veil" aria-hidden="true" />
        <main className="shell">
          <p className="error" role="alert">
            Supabase 환경 변수가 없습니다. Netlify에 VITE_SUPABASE_URL,
            VITE_SUPABASE_ANON_KEY를 넣고 재배포하세요.
          </p>
        </main>
      </div>
    )
  }

  if (authLoading) {
    return (
      <div className="app">
        <div className="app__veil" aria-hidden="true" />
        <div className="app__glow" aria-hidden="true" />
        <main className="shell">
          <p className="auth-status">별을 맞추는 중…</p>
        </main>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="app">
        <div className="app__veil" aria-hidden="true" />
        <div className="app__glow" aria-hidden="true" />
        <main className="shell">
          <header className="hero">
            <p className="brand">사주</p>
            <h1 className="headline">나의 운명을 읽어 보세요</h1>
            <p className="lede">
              Google 계정으로 로그인한 뒤, 당신만의 사주 기록을 남겨 보세요.
            </p>
          </header>

          <section className="auth-card">
            <p className="auth-card__text">
              로그인하면 사주 해석과 기록이 내 계정에만 안전하게 저장됩니다.
            </p>
            <button
              type="button"
              className="google-btn"
              onClick={handleGoogleLogin}
              disabled={authBusy}
            >
              <span className="google-btn__icon" aria-hidden="true">
                G
              </span>
              <span>{authBusy ? 'Google로 이동 중…' : 'Google로 계속하기'}</span>
            </button>
            {error && <p className="error" role="alert">{error}</p>}
          </section>
        </main>
      </div>
    )
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
        <div className="auth-bar">
          <p className="auth-bar__user">{getUserLabel(user)}</p>
          <button
            type="button"
            className="ghost-btn"
            onClick={handleSignOut}
            disabled={authBusy}
          >
            로그아웃
          </button>
        </div>

        <header className="hero">
          <p className="brand">사주</p>
          <h1 className="headline">나의 운명을 읽어 보세요</h1>
          <p className="lede">
            생년월일과 시간을 입력하면, 당신만의 사주를 풀어 드립니다.
          </p>
        </header>

        {selectedReading && !isEditing && (
          <section className="archive" aria-live="polite">
            <div className="archive__orb" aria-hidden="true" />
            <div className="archive__header">
              <p className="archive__eyebrow">저장된 사주</p>
              <div className="archive__actions">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={handleStartEdit}
                  disabled={saving}
                >
                  수정
                </button>
                <button
                  type="button"
                  className="ghost-btn ghost-btn--danger"
                  onClick={handleDelete}
                  disabled={saving}
                >
                  삭제
                </button>
              </div>
            </div>
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
          {isEditing && (
            <p className="form__banner">기록 수정 중 · 입력값과 결과 내용을 저장할 수 있습니다.</p>
          )}

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

            {isEditing && (
              <label className="field field--wide">
                <span className="field__label">사주 결과</span>
                <textarea
                  className="field__textarea"
                  value={editResult}
                  onChange={(e) => setEditResult(e.target.value)}
                  rows={12}
                />
              </label>
            )}
          </div>

          {isEditing ? (
            <div className="form__actions">
              <button
                type="button"
                className="ghost-btn ghost-btn--wide"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                취소
              </button>
              <button
                type="submit"
                className="analyze-btn analyze-btn--split"
                disabled={saving}
              >
                <span className="analyze-btn__text">
                  {saving ? '저장하는 중…' : '수정 저장하기'}
                </span>
              </button>
            </div>
          ) : (
            <button
              type="submit"
              className="analyze-btn"
              disabled={loading}
            >
              <span className="analyze-btn__text">
                {loading ? '별을 읽고 있어요…' : '사주 해석하기'}
              </span>
            </button>
          )}

          {error && <p className="error" role="alert">{error}</p>}
        </form>

        {!selectedReading && !isEditing && result && (
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
