import { useEffect, useState } from 'react'
import { loadProfile, upsertProfile } from '../api/profiles'
import {
  createReading,
  fetchReadings,
  fetchReadingsCount,
  findExistingReading,
  saveTodayFortune,
  updateReading,
} from '../api/readings'
import {
  copyText,
  fetchSharedReading,
  getShareUrl,
  readShareTokenFromUrl,
} from '../api/share'
import {
  trackAnalyzeCached,
  trackAnalyzeError,
  trackAnalyzeStart,
  trackAnalyzeSuccess,
  trackEditCancel,
  trackEditSave,
  trackEditStart,
  trackLoginClick,
  trackLogout,
  trackSelectReading,
  trackShareCopy,
  trackShareCopyFail,
  trackShareViewOpen,
} from '../lib/analytics'
import { askGemini } from '../lib/gemini'
import { formatBirthTime } from '../lib/format'
import { isSupabaseConfigured } from '../lib/supabase'
import {
  buildSajuPrompt,
  buildTodayFortunePrompt,
  stripBonusSection,
} from '../prompts/buildSajuPrompt'
import { useAuth } from './useAuth'

async function generateTodayFortune(input) {
  return askGemini(buildTodayFortunePrompt(input))
}

/**
 * 사주 앱의 화면 상태와 주요 액션을 관리한다.
 */
export function useSajuApp() {
  const {
    user,
    loading: authLoading,
    authError,
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
  const [hasProfile, setHasProfile] = useState(false)
  const [todayFortune, setTodayFortune] = useState('')
  const [todayFortuneLoading, setTodayFortuneLoading] = useState(false)
  const [shareToken] = useState(() => readShareTokenFromUrl())
  const [sharedReading, setSharedReading] = useState(null)
  const [shareLoading, setShareLoading] = useState(Boolean(readShareTokenFromUrl()))
  const [shareNotice, setShareNotice] = useState('')
  const [readingsCount, setReadingsCount] = useState(null)

  const selectedReading = readings.find((reading) => reading.id === selectedId) ?? null
  const isEditing = Boolean(editingId)
  const isShareView = Boolean(shareToken)

  function clearForm() {
    setName('')
    setBirthDate('')
    setBirthTime('')
    setGender('')
    setCalendarType('')
    setResult('')
  }

  function applyProfileToForm(profile) {
    if (!profile) {
      clearForm()
      setHasProfile(false)
      return
    }

    setName(profile.name || '')
    setBirthDate(profile.birth_date || '')
    setBirthTime(formatBirthTime(profile.birth_time) || '')
    setGender(profile.gender || '')
    setCalendarType(profile.calendar_type || '')
    setHasProfile(true)
  }

  async function loadReadingsList() {
    if (!isSupabaseConfigured || !user) {
      setReadings([])
      return []
    }

    try {
      const next = await fetchReadings()
      setReadings(next)
      return next
    } catch (err) {
      console.error(err)
      return []
    }
  }

  async function loadUserData() {
    if (!user) return

    try {
      const profile = await loadProfile(user.id)
      applyProfileToForm(profile)
      await loadReadingsList()
    } catch (err) {
      console.error(err)
      setError(err.message || '저장된 개인정보를 불러오지 못했습니다.')
    }
  }

  useEffect(() => {
    if (authError) setError(authError)
  }, [authError])

  useEffect(() => {
    if (!shareToken || !isSupabaseConfigured) {
      setShareLoading(false)
      return
    }

    let cancelled = false

    ;(async () => {
      setShareLoading(true)
      try {
        const reading = await fetchSharedReading(shareToken)
        if (!cancelled) {
          setSharedReading(reading)
          if (!reading) {
            setError('공유된 사주를 찾을 수 없습니다.')
          } else {
            trackShareViewOpen()
          }
        }
      } catch (err) {
        console.error(err)
        if (!cancelled) {
          setSharedReading(null)
          setError(err.message || '공유된 사주를 불러오지 못했습니다.')
        }
      } finally {
        if (!cancelled) setShareLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [shareToken])

  useEffect(() => {
    if (!isSupabaseConfigured || user || isShareView) return

    let cancelled = false

    ;(async () => {
      try {
        const count = await fetchReadingsCount()
        if (!cancelled) setReadingsCount(count)
      } catch (err) {
        console.error(err)
        if (!cancelled) setReadingsCount(null)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user, isShareView])

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
      setHasProfile(false)
      clearForm()
      return
    }

    setError('')
    loadUserData()
  }, [user])

  useEffect(() => {
    const reading = isShareView ? sharedReading : selectedReading
    if (!reading || (!isShareView && isEditing)) {
      if (!reading) {
        setTodayFortune('')
        setTodayFortuneLoading(false)
      }
      return
    }

    if (reading.today_fortune) {
      setTodayFortune(reading.today_fortune)
      setTodayFortuneLoading(false)
      return
    }

    if (isShareView) {
      setTodayFortune('')
      setTodayFortuneLoading(false)
      return
    }

    let cancelled = false

    ;(async () => {
      setTodayFortuneLoading(true)
      try {
        const text = await generateTodayFortune({
          name: reading.name,
          birthDate: reading.birth_date,
          birthTime: formatBirthTime(reading.birth_time) || '',
          gender: reading.gender,
          calendarType: reading.calendar_type,
        })

        if (cancelled) return

        await saveTodayFortune(reading.id, text)
        setTodayFortune(text)
        setReadings((prev) =>
          prev.map((item) =>
            item.id === reading.id ? { ...item, today_fortune: text } : item,
          ),
        )
      } catch (err) {
        console.error(err)
        if (!cancelled) setTodayFortune('')
      } finally {
        if (!cancelled) setTodayFortuneLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [selectedId, isEditing, sharedReading, isShareView, selectedReading?.today_fortune])

  async function handleGoogleLogin(source = 'login') {
    trackLoginClick(source)
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
    trackLogout()
    setAuthBusy(true)
    setError('')
    try {
      await signOut()
      clearForm()
      setSelectedId(null)
      setEditingId(null)
      setReadings([])
      setTodayFortune('')
    } catch (err) {
      console.error(err)
      setError(err.message || '로그아웃에 실패했습니다.')
    } finally {
      setAuthBusy(false)
    }
  }

  function handleSelectReading(id) {
    if (editingId && editingId !== id) setEditingId(null)

    setShareNotice('')
    setSelectedId((current) => {
      if (current === id) {
        trackSelectReading('close')
        setEditingId(null)
        setTodayFortune('')
        return null
      }
      trackSelectReading('open')
      return id
    })
    setResult('')
    setError('')
  }

  function handleStartEdit() {
    if (!selectedReading) return

    trackEditStart()
    setEditingId(selectedReading.id)
    setName(selectedReading.name)
    setBirthDate(selectedReading.birth_date)
    setBirthTime(formatBirthTime(selectedReading.birth_time) || '')
    setGender(selectedReading.gender)
    setCalendarType(selectedReading.calendar_type)
    setResult('')
    setError('')
  }

  function handleCancelEdit() {
    trackEditCancel()
    setEditingId(null)
    setError('')
    if (hasProfile) {
      loadProfile(user.id)
        .then(applyProfileToForm)
        .catch((err) => {
          console.error(err)
          clearForm()
        })
    } else {
      clearForm()
    }
  }

  async function handleUpdate(e) {
    e.preventDefault()
    if (!editingId || !user) return

    if (!name || !birthDate || !gender || !calendarType) {
      setError('이름, 생년월일, 성별, 양력/음력을 모두 입력해 주세요.')
      return
    }

    setSaving(true)
    setError('')

    try {
      await upsertProfile(user.id, {
        name,
        birthDate,
        birthTime,
        gender,
        calendarType,
      })
      setHasProfile(true)

      const current = readings.find((reading) => reading.id === editingId)
      const cleanedResult = stripBonusSection(current?.result || '')

      const updated = await updateReading(editingId, {
        name,
        birth_date: birthDate,
        birth_time: birthTime || null,
        gender,
        calendar_type: calendarType,
        result: cleanedResult,
        profile_user_id: user.id,
      })

      await loadReadingsList()
      setSelectedId(updated.id)
      setEditingId(null)
      applyProfileToForm({
        name,
        birth_date: birthDate,
        birth_time: birthTime || null,
        gender,
        calendar_type: calendarType,
      })
      trackEditSave()
    } catch (err) {
      console.error(err)
      setError(err.message || '사주 기록 수정 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleShare() {
    if (!selectedReading?.share_token) {
      setError('공유 링크를 만들 수 없습니다. 기록을 다시 불러와 주세요.')
      return
    }

    const url = getShareUrl(selectedReading.share_token)
    try {
      await copyText(url)
      trackShareCopy()
      setShareNotice('공유 링크를 복사했어요')
      setError('')
      window.setTimeout(() => setShareNotice(''), 2500)
    } catch (err) {
      console.error(err)
      trackShareCopyFail()
      setShareNotice('')
      setError(`링크 복사에 실패했어요. 직접 복사해 주세요: ${url}`)
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

    trackAnalyzeStart()
    setLoading(true)
    setError('')
    setResult('')
    setSelectedId(null)

    const normalizedBirthTime = birthTime || null

    try {
      await upsertProfile(user.id, {
        name,
        birthDate,
        birthTime: normalizedBirthTime,
        gender,
        calendarType,
      })
      setHasProfile(true)

      const existing = await findExistingReading({
        userId: user.id,
        name,
        birthDate,
        birthTime: normalizedBirthTime,
        gender,
        calendarType,
      })

      if (existing) {
        trackAnalyzeCached()
        await loadReadingsList()
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
      const text = stripBonusSection(await askGemini(prompt))
      setResult(text)

      const fortuneText = await generateTodayFortune({
        name,
        birthDate,
        birthTime,
        gender,
        calendarType,
      })

      const saved = await createReading({
        name,
        birth_date: birthDate,
        birth_time: normalizedBirthTime,
        gender,
        calendar_type: calendarType,
        result: text,
        today_fortune: fortuneText,
        user_id: user.id,
        profile_user_id: user.id,
      })

      await loadReadingsList()
      if (saved?.id) {
        setSelectedId(saved.id)
        setTodayFortune(fortuneText)
        setResult('')
      }
      trackAnalyzeSuccess()
    } catch (err) {
      console.error(err)
      trackAnalyzeError(err.message)
      setError(err.message || '사주 해석 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return {
    isSupabaseConfigured,
    user,
    authLoading,
    authBusy,
    error,
    shareLoading,
    isShareView,
    sharedReading,
    readingsCount,
    readings,
    selectedId,
    selectedReading,
    isEditing,
    name,
    birthDate,
    birthTime,
    gender,
    calendarType,
    result,
    loading,
    saving,
    todayFortune,
    todayFortuneLoading,
    shareNotice,
    setName,
    setBirthDate,
    setBirthTime,
    setGender,
    setCalendarType,
    handleGoogleLogin,
    handleSignOut,
    handleSelectReading,
    handleStartEdit,
    handleShare,
    handleCancelEdit,
    handleAnalyze,
  }
}
