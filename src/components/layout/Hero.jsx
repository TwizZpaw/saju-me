export function Hero({ headline, lede }) {
  return (
    <header className="hero">
      <p className="brand">사주</p>
      <h1 className="headline">{headline}</h1>
      <p className="lede">{lede}</p>
    </header>
  )
}
