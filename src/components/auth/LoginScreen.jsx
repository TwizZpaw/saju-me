import { AppShell } from '../layout/AppShell'
import { Hero } from '../layout/Hero'
import { ErrorMessage } from '../common/ErrorMessage'
import { GoogleLoginButton } from './GoogleLoginButton'

export function LoginScreen({ readingsCount, authBusy, error, onLogin }) {
  return (
    <AppShell>
      <main className="shell">
        <Hero
          headline="나의 운명을 읽어 보세요"
          lede="Google 계정으로 로그인한 뒤, 당신만의 사주 기록을 남겨 보세요."
        />

        <section className="auth-card">
          <p className="auth-card__text">
            {readingsCount === null
              ? '이때까지 생성된 사주를 세는 중…'
              : `이때까지 ${readingsCount.toLocaleString('ko-KR')}개의 사주가 생성되었습니다.`}
          </p>
          <GoogleLoginButton busy={authBusy} onClick={() => onLogin('login')} />
          <ErrorMessage message={error} />
        </section>
      </main>
    </AppShell>
  )
}
