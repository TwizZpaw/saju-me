export function AppShell({ children, withGlow = true }) {
  return (
    <div className="app">
      <div className="app__veil" aria-hidden="true" />
      {withGlow && <div className="app__glow" aria-hidden="true" />}
      {children}
    </div>
  )
}
