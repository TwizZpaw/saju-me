export function ResultPanel({ result }) {
  if (!result) return null

  return (
    <section className="result" aria-live="polite">
      <h2 className="result__title">사주 해석 결과</h2>
      <pre className="result-text">{result}</pre>
    </section>
  )
}
