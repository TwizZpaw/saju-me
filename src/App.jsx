import { useState } from 'react'
import './App.css'
import { buildSajuPrompt } from './buildSajuPrompt'
import { askGemini } from './gemini'

function App() {
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [gender, setGender] = useState('')
  const [calendarType, setCalendarType] = useState('')

  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAnalyze(e) {
    e.preventDefault()

    if (!name || !birthDate || !gender || !calendarType) {
      setError('이름, 생년월일, 성별, 양력/음력을 모두 입력해 주세요.')
      return
    }

    setLoading(true)
    setError('')
    setResult('')

    try {
      const prompt = buildSajuPrompt({
        name,
        birthDate,
        birthTime,
        gender,
        calendarType,
      })
      const text = await askGemini(prompt)
      setResult(text)
    } catch (err) {
      console.error(err)
      setError(err.message || '사주 해석 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <div className="app__veil" aria-hidden="true" />
      <div className="app__glow" aria-hidden="true" />

      <main className="shell">
        <header className="hero">
          <p className="brand">사주</p>
          <h1 className="headline">나의 운명을 읽어 보세요</h1>
          <p className="lede">
            생년월일과 시간을 입력하면, 당신만의 사주를 풀어 드립니다.
          </p>
        </header>

        <form className="form" onSubmit={handleAnalyze}>
          <div className="form__grid">
            <label className="field">
              <span className="field__label">이름</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                autoComplete="name"
              />
            </label>

            <label className="field">
              <span className="field__label">생년월일</span>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </label>

            <label className="field">
              <span className="field__label">
                태어난 시간 <em>선택</em>
              </span>
              <input
                type="time"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
              />
            </label>

            <label className="field">
              <span className="field__label">성별</span>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">선택하세요</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
              </select>
            </label>

            <label className="field field--wide">
              <span className="field__label">양력 / 음력</span>
              <div className="segment" role="group" aria-label="양력 또는 음력">
                <button
                  type="button"
                  className={
                    calendarType === 'solar'
                      ? 'segment__btn is-active'
                      : 'segment__btn'
                  }
                  onClick={() => setCalendarType('solar')}
                >
                  양력
                </button>
                <button
                  type="button"
                  className={
                    calendarType === 'lunar'
                      ? 'segment__btn is-active'
                      : 'segment__btn'
                  }
                  onClick={() => setCalendarType('lunar')}
                >
                  음력
                </button>
              </div>
            </label>
          </div>

          <button
            type="submit"
            className="analyze-btn"
            disabled={loading}
          >
            <span className="analyze-btn__text">
              {loading ? '별을 읽고 있어요…' : '사주 해석하기'}
            </span>
          </button>

          {error && <p className="error" role="alert">{error}</p>}
        </form>

        {result && (
          <section className="result" aria-live="polite">
            <h2 className="result__title">사주 해석 결과</h2>
            <pre className="result-text">{result}</pre>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
