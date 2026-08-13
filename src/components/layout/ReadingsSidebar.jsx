import { formatBirthDate, getUserLabel } from '../../lib/format'

export function ReadingsSidebar({
  readings,
  selectedId,
  user,
  authBusy,
  onSelectReading,
  onSignOut,
}) {
  return (
    <aside className="sidebar" aria-label="저장된 사주 목록">
      <div className="sidebar__body">
        <p className="sidebar__title">기록</p>
        {readings.length === 0 ? (
          <p className="sidebar__empty">아직 저장된 사주가 없습니다.</p>
        ) : (
          <ul className="sidebar__list">
            {readings.map((reading) => {
              const isActive = reading.id === selectedId
              return (
                <li key={reading.id}>
                  <button
                    type="button"
                    className={isActive ? 'sidebar__item is-active' : 'sidebar__item'}
                    onClick={() => onSelectReading(reading.id)}
                    aria-pressed={isActive}
                  >
                    <span className="sidebar__name">{reading.name}</span>
                    <span className="sidebar__meta">
                      {formatBirthDate(reading.birth_date)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="auth-bar">
        <p className="auth-bar__user">{getUserLabel(user)}</p>
        <button
          type="button"
          className="ghost-btn"
          onClick={onSignOut}
          disabled={authBusy}
        >
          로그아웃
        </button>
      </div>
    </aside>
  )
}
