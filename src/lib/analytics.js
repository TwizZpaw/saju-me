const MEASUREMENT_ID = 'G-W4C4RGKV8V'

function canTrack() {
  return typeof window !== 'undefined' && typeof window.gtag === 'function'
}

/**
 * GA4 커스텀 이벤트를 보낸다.
 * @param {string} eventName
 * @param {Record<string, string|number|boolean|undefined>} [params]
 */
export function trackEvent(eventName, params = {}) {
  if (!canTrack()) return

  window.gtag('event', eventName, {
    send_to: MEASUREMENT_ID,
    ...params,
  })
}

export function trackLoginClick(source = 'login') {
  trackEvent('login_click', { method: 'google', source })
}

export function trackLogout() {
  trackEvent('logout')
}

export function trackAnalyzeStart() {
  trackEvent('analyze_saju', { status: 'start' })
}

export function trackAnalyzeCached() {
  trackEvent('analyze_saju', { status: 'cached' })
}

export function trackAnalyzeSuccess() {
  trackEvent('analyze_saju', { status: 'success' })
}

export function trackAnalyzeError(message = '') {
  trackEvent('analyze_saju', {
    status: 'error',
    error_message: String(message).slice(0, 100),
  })
}

export function trackShareCopy() {
  trackEvent('share_copy')
}

export function trackShareCopyFail() {
  trackEvent('share_copy', { status: 'error' })
}

export function trackDeleteReading() {
  trackEvent('delete_reading')
}

export function trackSelectReading(action = 'open') {
  trackEvent('select_reading', { action })
}

export function trackShareViewOpen() {
  trackEvent('share_view_open')
}

export function trackGoHomeFromShare() {
  trackEvent('share_go_home')
}
