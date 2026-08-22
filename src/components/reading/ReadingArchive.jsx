import {
  formatBirthDate,
  formatBirthTime,
  formatCalendar,
  formatGender,
} from '../../lib/format'
import { cleanReadingResult } from '../../prompts/buildSajuPrompt'

export function ReadingArchive({
  reading,
  eyebrow = '저장된 사주',
  showActions = false,
  deleting = false,
  shareNotice = '',
  onDelete,
  onShare,
}) {
  if (!reading) return null

  return (
    <section className="archive" aria-live="polite">
      <div className="archive__orb" aria-hidden="true" />
      <div className="archive__header">
        <p className="archive__eyebrow">{eyebrow}</p>
        {showActions && (
          <div className="archive__actions">
            <button
              type="button"
              className="ghost-btn"
              onClick={onDelete}
              disabled={deleting}
            >
              {deleting ? '삭제하는 중…' : '삭제'}
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={onShare}
              disabled={deleting}
            >
              공유
            </button>
          </div>
        )}
      </div>

      {shareNotice && (
        <p className="share-notice" role="status">
          {shareNotice}
        </p>
      )}

      <h2 className="archive__name">{reading.name}</h2>
      <p className="archive__facts">
        <span>{formatBirthDate(reading.birth_date)}</span>
        {formatBirthTime(reading.birth_time) && (
          <>
            <span className="archive__dot" aria-hidden="true" />
            <span>{formatBirthTime(reading.birth_time)}</span>
          </>
        )}
        <span className="archive__dot" aria-hidden="true" />
        <span>{formatGender(reading.gender)}</span>
        <span className="archive__dot" aria-hidden="true" />
        <span>{formatCalendar(reading.calendar_type)}</span>
      </p>
      <div className="archive__divider" aria-hidden="true" />
      <pre className="archive__result">{cleanReadingResult(reading.result)}</pre>
    </section>
  )
}
