export function StatusScreen({ message, withGlow = true }) {
  return (
    <div className="app">
      <div className="app__veil" aria-hidden="true" />
      {withGlow && <div className="app__glow" aria-hidden="true" />}
      <main className="shell">
        <p className="auth-status">{message}</p>
      </main>
    </div>
  )
}
