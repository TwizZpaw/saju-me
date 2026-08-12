import { useEffect, useState } from 'react'
import { isSupabaseConfigured, requireSupabase } from './supabase'

/**
 * Supabase 세션/유저를 구독한다.
 */
export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
    const { error } = await requireSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })

    if (error) {
      throw error
    }
  }

  async function signOut() {
    const { error } = await requireSupabase().auth.signOut()
    if (error) {
      throw error
    }
  }

  return {
    user,
    loading,
    signInWithGoogle,
    signOut,
  }
}
