import { requireSupabase } from '../lib/supabase'

export function getShareUrl(shareToken) {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://uunmei.netlify.app'
  return `${origin}/share.html?t=${shareToken}`
}

export function readShareTokenFromUrl() {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('share')
}

export async function fetchSharedReading(shareToken) {
  const { data, error } = await requireSupabase().rpc('get_shared_reading', {
    p_token: shareToken,
  })

  if (error) throw error

  const row = Array.isArray(data) ? data[0] : data
  return row ?? null
}

export async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const input = document.createElement('textarea')
  input.value = text
  input.setAttribute('readonly', '')
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.select()
  document.execCommand('copy')
  document.body.removeChild(input)
}
