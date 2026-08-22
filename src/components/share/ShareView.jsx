import { trackGoHomeFromShare } from '../../lib/analytics'
import { AppShell } from '../layout/AppShell'
import { Hero } from '../layout/Hero'
import { ErrorMessage } from '../common/ErrorMessage'
import { GoogleLoginButton } from '../auth/GoogleLoginButton'
import { ReadingArchive } from '../reading/ReadingArchive'

export function ShareView({
  user,
  error,
  sharedReading,
  authBusy,
  onLogin,
}) {
  return (
    <AppShell>
      <main className="shell">
        <Hero
          headline="친구의 운명을 읽어 보세요"
          lede="친구가 보낸 사주 해석이에요."
        />

        <ErrorMessage message={error} />

        {sharedReading ? (
          <ReadingArchive
            reading={sharedReading}
            eyebrow="공유된 사주"
          />
        ) : (
          <p className="auth-status">공유된 사주를 찾을 수 없습니다.</p>
        )}

        <section className="auth-card share-cta">
          {user ? (
            <a
              className="google-btn share-cta__link"
              href="/"
              onClick={() => trackGoHomeFromShare()}
            >
              내 사주로 돌아가기
            </a>
          ) : (
            <>
              <p className="auth-card__text">
                내 운명도 궁금하다면 Google로 로그인해 보세요.
              </p>
              <GoogleLoginButton busy={authBusy} onClick={() => onLogin('share')} />
            </>
          )}
        </section>
      </main>
    </AppShell>
  )
}
