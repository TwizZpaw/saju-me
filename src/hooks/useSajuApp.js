import { useEffect, useState } from 'react'
import { loadProfile, upsertProfile } from '../api/profiles'
import {
  createReading,
  deleteReading,
  fetchReadings,
  fetchReadingsCount,
  findExistingReading,
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
  trackDeleteReading,
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
import { buildSajuPrompt, cleanReadingResult } from '../prompts/buildSajuPrompt'
import { useAuth } from './useAuth'

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
  const [deleting, setDeleting] = useState(false)
  const [authBusy, setAuthBusy] = useState(false)
  const [error, setError] = useState('')
  const [readings, setReadings] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [shareToken] = useState(() => readShareTokenFromUrl())
  const [sharedReading, setSharedReading] = useState(null)
  const [shareLoading, setShareLoading] = useState(Boolean(readShareTokenFromUrl()))
  const [shareNotice, setShareNotice] = useState('')
  const [readingsCount, setReadingsCount] = useState(null)

  const selectedReading = readings.find((reading) => reading.id === selectedId) ?? null
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
      return
    }

    setName(profile.name || '')
    setBirthDate(profile.birth_date || '')
    setBirthTime(formatBirthTime(profile.birth_time) || '')
    setGender(profile.gender || '')
    setCalendarType(profile.calendar_type || '')
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
      clearForm()
      return
    }

    setError('')
    loadUserData()
  }, [user])

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
      setReadings([])
    } catch (err) {
      console.error(err)
      setError(err.message || '로그아웃에 실패했습니다.')
    } finally {
      setAuthBusy(false)
    }
  }

  function handleSelectReading(id) {
    setShareNotice('')
    setSelectedId((current) => {
      if (current === id) {
        trackSelectReading('close')
        return null
      }
      trackSelectReading('open')
      return id
    })
    setResult('')
    setError('')
  }

  async function handleDelete() {
    if (!selectedReading || !user) return

    const confirmed = window.confirm(
      '이 사주 기록을 삭제할까요?\n삭제하면 되돌릴 수 없어요.',
    )
    if (!confirmed) return

    setDeleting(true)
    setError('')
    setShareNotice('')

    try {
      await deleteReading(selectedReading.id)
      trackDeleteReading()
      setSelectedId(null)
      await loadReadingsList()
    } catch (err) {
      console.error(err)
      setError(err.message || '사주 기록을 삭제하지 못했습니다.')
    } finally {
      setDeleting(false)
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
      const text = cleanReadingResult(await askGemini(prompt))
      setResult(text)

      const saved = await createReading({
        name,
        birth_date: birthDate,
        birth_time: normalizedBirthTime,
        gender,
        calendar_type: calendarType,
        result: text,
        user_id: user.id,
        profile_user_id: user.id,
      })

      await loadReadingsList()
      if (saved?.id) {
        setSelectedId(saved.id)
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
    name,
    birthDate,
    birthTime,
    gender,
    calendarType,
    result,
    loading,
    deleting,
    shareNotice,
    setName,
    setBirthDate,
    setBirthTime,
    setGender,
    setCalendarType,
    handleGoogleLogin,
    handleSignOut,
    handleSelectReading,
    handleDelete,
    handleShare,
    handleAnalyze,
  }
}
