import { useEffect, useState } from 'react'
import { isSupabaseConfigured, requireSupabase } from '../lib/supabase'

function readOAuthErrorFromUrl() {
  const search = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))

  const error =
    search.get('error_description') ||
    search.get('error') ||
    hash.get('error_description') ||
    hash.get('error')

  if (!error) return ''

  window.history.replaceState({}, document.title, window.location.pathname)
  return decodeURIComponent(error.replace(/\+/g, ' '))
}

/**
 * Supabase 세션/유저를 구독한다.
 */
export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    const oauthError = readOAuthErrorFromUrl()
    if (oauthError) {
      setAuthError(oauthError)
    }

    if (!isSupabaseConfigured) {
      setUser(null)
      setLoading(false)
      return
    }

    let mounted = true
    const client = requireSupabase()

    client.auth.getSession().then(({ data, error }) => {
      if (!mounted) return
      if (error) {
        console.error(error)
        setUser(null)
        setAuthError(error.message)
      } else {
        setUser(data.session?.user ?? null)
      }
      setLoading(false)
    })

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function signInWithGoogle() {
    setAuthError('')
    const redirectTo = 'https://uunmei.netlify.app/'

    const { error } = await requireSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'online',
          prompt: 'select_account',
        },
      },
    })

    if (error) {
      setAuthError(error.message)
      throw error
    }
  }

  async function signOut() {
    setAuthError('')
    const { error } = await requireSupabase().auth.signOut()
    if (error) {
      setAuthError(error.message)
      throw error
    }
  }

  return {
    user,
    loading,
    authError,
    signInWithGoogle,
    signOut,
  }
}
