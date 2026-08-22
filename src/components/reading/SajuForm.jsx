import { ErrorMessage } from '../common/ErrorMessage'

export function SajuForm({
  name,
  birthDate,
  birthTime,
  gender,
  calendarType,
  loading,
  error,
  onNameChange,
  onBirthDateChange,
  onBirthTimeChange,
  onGenderChange,
  onCalendarTypeChange,
  onSubmit,
}) {
  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="form__grid">
        <label className="field">
          <span className="field__label">이름</span>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="홍길동"
            autoComplete="name"
          />
        </label>

        <label className="field">
          <span className="field__label">생년월일</span>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => onBirthDateChange(e.target.value)}
          />
        </label>

        <label className="field">
          <span className="field__label">
            태어난 시간 <em>선택</em>
          </span>
          <input
            type="time"
            value={birthTime}
            onChange={(e) => onBirthTimeChange(e.target.value)}
          />
        </label>

        <label className="field">
          <span className="field__label">성별</span>
          <select value={gender} onChange={(e) => onGenderChange(e.target.value)}>
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
                calendarType === 'solar' ? 'segment__btn is-active' : 'segment__btn'
              }
              onClick={() => onCalendarTypeChange('solar')}
            >
              양력
            </button>
            <button
              type="button"
              className={
                calendarType === 'lunar' ? 'segment__btn is-active' : 'segment__btn'
              }
              onClick={() => onCalendarTypeChange('lunar')}
            >
              음력
            </button>
          </div>
        </label>
      </div>

      <button type="submit" className="analyze-btn" disabled={loading}>
        <span className="analyze-btn__text">
          {loading ? '별을 읽고 있어요…' : '사주 해석하기'}
        </span>
      </button>

      <ErrorMessage message={error} />
    </form>
  )
}
