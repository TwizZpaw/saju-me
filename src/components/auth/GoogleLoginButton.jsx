export function GoogleLoginButton({ busy, onClick }) {
  return (
    <button type="button" className="google-btn" onClick={onClick} disabled={busy}>
      <span className="google-btn__icon" aria-hidden="true">
        G
      </span>
      <span>{busy ? 'Google로 이동 중…' : 'Google로 계속하기'}</span>
    </button>
  )
}
